import OpenAI from "openai";
import { z } from "zod";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
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

import { friendlyError } from "./aiErrors";

const MODEL = env.OPENAI_MODEL;

// Fail fast (90s) instead of letting the SDK hang for its default 10 minutes
// when the API is slow or rate-limited.
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;

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

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || undefined,
      baseURL: env.OPENAI_BASE_URL || undefined,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }

  private async complete(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      });
      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error({ err, model: MODEL }, "OpenAI generation failed");
      throw friendlyError(err);
    }
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
