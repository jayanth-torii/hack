import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type {
  AIProvider,
  CertificationDraft,
  FreeResourceDraft,
  PracticeTagSuggestion,
  StageDraft,
  TimelineDayDraft,
} from "./AIProvider.interface";
import type { SearchResult } from "./webSearch";
import {
  buildCertificationsPrompt,
  buildFreeResourcesPrompt,
  buildPracticeTagsPrompt,
  buildSyllabusPrompt,
  buildTimelinePrompt,
} from "./promptBuilder";

const MODEL = env.ANTHROPIC_MODEL;

const stageDraftSchema = z.object({
  order: z.number(),
  title: z.string(),
  type: z.enum(["learn", "practice"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  prerequisiteOrder: z.number().nullable(),
  syllabus: z.array(z.string()),
  estimatedDays: z.number().positive(),
});

const freeResourceDraftSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(["video", "playlist", "doc", "blog"]),
});

const certificationDraftSchema = z.object({
  title: z.string(),
  provider: z.enum(["coursera", "udemy", "aws", "google", "microsoft", "other"]),
  url: z.string().url(),
  price: z.number().nullable(),
  rank: z.number(),
});

const practiceTagSchema = z.object({
  tag: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

const timelineDaySchema = z.object({
  day: z.number(),
  tasks: z.array(z.string()),
});

/**
 * Strips markdown code fences if the model wraps its JSON despite
 * instructions, then parses+validates against the given Zod schema.
 * Returns [] on any parse/validation failure rather than throwing, so a
 * single malformed generation step never crashes the whole roadmap build.
 */
function parseJsonArray<T>(raw: string, schema: z.ZodType<T>): T[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const data = JSON.parse(cleaned);
    const arraySchema = z.array(schema);
    const result = arraySchema.safeParse(data);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, "AI response failed schema validation");
      return [];
    }
    return result.data;
  } catch (err) {
    logger.warn({ err }, "AI response was not valid JSON");
    return [];
  }
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  private async complete(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block && block.type === "text" ? block.text : "";
  }

  async generateSyllabus(topic: string, searchContext: SearchResult[]): Promise<StageDraft[]> {
    const raw = await this.complete(buildSyllabusPrompt(topic, searchContext));
    return parseJsonArray(raw, stageDraftSchema);
  }

  async generateFreeResources(
    topic: string,
    stage: StageDraft,
    searchContext: SearchResult[]
  ): Promise<FreeResourceDraft[]> {
    const raw = await this.complete(buildFreeResourcesPrompt(topic, stage, searchContext));
    const drafts = parseJsonArray(raw, freeResourceDraftSchema);
    // Defense in depth: even if the model ignored instructions, drop any URL
    // that isn't present verbatim in the grounding search results.
    const allowedUrls = new Set(searchContext.map((r) => r.url));
    return drafts.filter((d) => allowedUrls.has(d.url));
  }

  async generateCertifications(
    topic: string,
    searchContext: SearchResult[]
  ): Promise<CertificationDraft[]> {
    const raw = await this.complete(buildCertificationsPrompt(topic, searchContext));
    const drafts = parseJsonArray(raw, certificationDraftSchema);
    const allowedUrls = new Set(searchContext.map((r) => r.url));
    return drafts.filter((d) => allowedUrls.has(d.url));
  }

  async suggestPracticeTags(topic: string, stage: StageDraft): Promise<PracticeTagSuggestion[]> {
    const raw = await this.complete(buildPracticeTagsPrompt(topic, stage));
    return parseJsonArray(raw, practiceTagSchema);
  }

  async generateTimeline(topic: string, stages: StageDraft[]): Promise<TimelineDayDraft[]> {
    const raw = await this.complete(buildTimelinePrompt(topic, stages));
    return parseJsonArray(raw, timelineDaySchema);
  }
}
