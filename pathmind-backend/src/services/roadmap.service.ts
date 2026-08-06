import { Types } from "mongoose";
import { Roadmap, type RoadmapDocument, type Stage } from "@/models/Roadmap";
import { getAIProvider } from "@/services/ai/aiService";
import { webSearch } from "@/services/ai/webSearch";
import { resolvePracticeLinks } from "@/services/practiceLinks/practiceLinks.service";
import { cacheRoadmap, getCachedRoadmapByTopic } from "@/services/cache/cacheService";
import { normalizeTopic, slugify } from "@/utils/slugify";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { StageDraft } from "@/services/ai/AIProvider.interface";

/**
 * The main /roadmaps/generate orchestration:
 *   1. Redis cache check by normalized topic
 *   2. Mongo check for an existing public template
 *   3. AI generation, IN THIS ORDER (per spec): syllabus -> free resources
 *      (per stage) -> certifications -> practice links (per stage) -> timeline
 *   4. Persist as a public template + populate the cache
 *
 * Many students share the same generated template — this function never
 * writes user-specific state (that's UserProgress, see unlock.service.ts).
 */
export async function generateOrGetRoadmap(topic: string): Promise<RoadmapDocument> {
  const normalizedTopic = normalizeTopic(topic);

  const cached = await getCachedRoadmapByTopic(normalizedTopic);
  if (cached) {
    logger.info({ topic }, "roadmap cache hit (redis)");
    return cached;
  }

  const existing = await Roadmap.findOne({ normalizedTopic, isPublicTemplate: true });
  if (existing) {
    logger.info({ topic }, "roadmap cache hit (mongo)");
    await cacheRoadmap(existing);
    return existing;
  }

  logger.info({ topic }, "roadmap cache miss — generating via AI");
  const roadmap = await generateRoadmapFromScratch(topic, normalizedTopic);
  await cacheRoadmap(roadmap);
  return roadmap;
}

async function generateRoadmapFromScratch(
  topic: string,
  normalizedTopic: string
): Promise<RoadmapDocument> {
  const ai = getAIProvider();

  // 1. Syllabus — ordered stages, beginner -> advanced.
  const syllabusSearch = await webSearch(`${topic} learning roadmap syllabus`);
  const stageDrafts = await ai.generateSyllabus(topic, syllabusSearch);
  if (stageDrafts.length === 0) {
    throw new Error(`AI provider returned no syllabus stages for topic "${topic}"`);
  }

  const stages: Stage[] = [];
  const stageObjectIds = stageDrafts.map(() => new Types.ObjectId());

  for (const draft of stageDrafts) {
    // 2. Free resources — grounded against a per-stage web search.
    const resourceSearch = await webSearch(`${topic} ${draft.title} free tutorial docs`);
    const resourceDrafts = await ai.generateFreeResources(topic, draft, resourceSearch);

    // 3. Certifications (fetched once per stage template context; ranked by value).
    const certSearch = await webSearch(`best ${topic} certification`);
    const certDrafts = await ai.generateCertifications(topic, certSearch);

    // 4. Practice links — AI suggests tags/difficulty only; the verification
    // module resolves them to guaranteed-real problem URLs.
    const tagSuggestions = await ai.suggestPracticeTags(topic, draft);
    const practiceLinks = resolvePracticeLinks(
      tagSuggestions.map((t) => ({ tag: t.tag, difficulty: t.difficulty }))
    );

    const now = new Date();
    stages.push({
      _id: stageObjectIds[stageDrafts.indexOf(draft)]!,
      order: draft.order,
      title: draft.title,
      type: draft.type,
      difficulty: draft.difficulty,
      prerequisiteStageId:
        draft.prerequisiteOrder === null ? null : stageObjectIds[draft.prerequisiteOrder]!,
      syllabus: draft.syllabus,
      estimatedDays: draft.estimatedDays,
      freeResources: resourceDrafts.map((r) => ({
        title: r.title,
        url: r.url,
        type: r.type,
        lastVerifiedAt: now,
        verified: true,
      })),
      certifications: certDrafts.map((c) => ({
        title: c.title,
        provider: c.provider,
        url: c.url,
        price: c.price,
        rank: c.rank,
        lastVerifiedAt: now,
      })),
      practiceLinks,
    });
  }

  // 5. Suggested timeline — structured day-by-day breakdown.
  const timelineDrafts = await ai.generateTimeline(topic, stageDrafts);

  const slug = await uniqueSlug(topic);

  const roadmap = await Roadmap.create({
    topic,
    normalizedTopic,
    slug,
    isPublicTemplate: true,
    sourceModel: env.MOCK_MODE ? "mock" : env.AI_PROVIDER,
    stages,
    suggestedTimeline: timelineDrafts,
  });

  return roadmap;
}

async function uniqueSlug(topic: string): Promise<string> {
  const base = slugify(topic);
  let candidate = base;
  let suffix = 1;
  // Extremely unlikely to collide since normalizedTopic is checked first, but
  // guards against two different-cased topics slugifying to the same string.
  while (await Roadmap.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate;
}

export async function getRoadmapBySlug(slug: string): Promise<RoadmapDocument | null> {
  return Roadmap.findOne({ slug });
}

export async function getRoadmapById(id: string): Promise<RoadmapDocument | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return Roadmap.findById(id);
}
