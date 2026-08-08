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
import { friendlyError } from "./aiErrors";

const REQUEST_TIMEOUT_MS = 90_000;

// Zod schemas for validation
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
 * Strips markdown code fences and validates Gemini response against Zod schema.
 */
function parseJsonArray<T>(raw: string, schema: z.ZodType<T>): T[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const data = JSON.parse(cleaned);
    const arraySchema = z.array(schema);
    const result = arraySchema.safeParse(data);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, "Gemini response failed schema validation");
      return [];
    }
    return result.data;
  } catch (err) {
    logger.warn({ err }, "Gemini response was not valid JSON");
    return [];
  }
}

/**
 * Gemini Provider using Google's native REST API.
 * This directly supports the new "AQ." key format, bypassing OpenAI compatibility
 * endpoint issues which do not support "AQ." prefixed keys yet.
 */
export class GeminiProvider implements AIProvider {
  private model: string;

  constructor() {
    this.model = env.GEMINI_MODEL;
  }

  private async complete(prompt: string): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${env.GEMINI_API_KEY}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        logger.error({ status: response.status, error: errorData }, "Gemini API returned non-2xx status");
        throw { status: response.status, message: errorData.error?.message };
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    } catch (err: any) {
      logger.error({ err, model: this.model }, "Gemini generation failed");
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
