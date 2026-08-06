import type { Roadmap, Stage } from "@/types/roadmap";
import { apiRoadmapSchema, type ApiRoadmap, type ApiStage } from "./zod-schemas";

// The one place that translates the backend's Mongoose-JSON response shape
// (`_id`, unsorted stages) into the clean frontend `types/*` shape used by
// every component downstream. Runtime-validated via zod so a backend shape
// drift throws here instead of silently producing `undefined`s in the 3D view.

const RADIUS = 6;
const DEPTH_STEP = 8;

function stagePosition(order: number, total: number): [number, number, number] {
  // Gently spirals the checkpoints through 3D space so the tube path has
  // visible curvature rather than sitting on a single straight line.
  const angle = (order / Math.max(total, 1)) * Math.PI * 2.2;
  const x = Math.sin(angle) * RADIUS;
  const y = Math.cos(angle * 0.6) * 2;
  const z = -order * DEPTH_STEP;
  return [x, y, z];
}

export function mapStage(raw: ApiStage, index: number, total: number): Stage {
  return {
    id: raw._id,
    order: raw.order,
    title: raw.title,
    type: raw.type,
    difficulty: raw.difficulty,
    syllabus: raw.syllabus,
    resources: raw.freeResources.map((r) => ({
      title: r.title,
      url: r.url,
      type: r.type,
      lastVerifiedAt: r.lastVerifiedAt,
      verified: r.verified,
    })),
    certifications: raw.certifications.map((c) => ({
      title: c.title,
      provider: c.provider,
      url: c.url,
      price: c.price,
      rank: c.rank,
      lastVerifiedAt: c.lastVerifiedAt,
    })),
    practiceLinks: raw.practiceLinks.map((p) => ({
      platform: p.platform,
      problemId: p.problemId,
      title: p.title,
      url: p.url,
      difficulty: p.difficulty,
      verified: p.verified,
    })),
    estimatedDays: raw.estimatedDays,
    prerequisiteStageId: raw.prerequisiteStageId,
    position: stagePosition(index, total),
  };
}

export function mapRoadmap(raw: unknown): Roadmap {
  const parsed: ApiRoadmap = apiRoadmapSchema.parse(raw);
  const stages = [...parsed.stages].sort((a, b) => a.order - b.order);
  return {
    id: parsed._id,
    topic: parsed.topic,
    slug: parsed.slug,
    createdAt: parsed.createdAt,
    stages: stages.map((s, i) => mapStage(s, i, stages.length)),
    suggestedTimeline: parsed.suggestedTimeline,
  };
}
