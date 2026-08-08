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
import { MockAIProvider } from "./mockProvider";
import { AnthropicProvider } from "./anthropicProvider";
import { OpenAIProvider } from "./openaiProvider";
import { GeminiProvider } from "./geminiProvider";
import type { SearchResult } from "./webSearch";

// The single seam between "which vendor generates the roadmap" and
// everything else. roadmap.service.ts only ever calls `getAIProvider()` and
// programs against the AIProvider interface.
let cached: AIProvider | null = null;

/**
 * Fallback AI Provider wrapper that tries a primary provider, and if it fails,
 * transparently falls back to a secondary provider. Keeps generation resilient.
 */
class FallbackAIProvider implements AIProvider {
  constructor(
    private primary: AIProvider,
    private secondary: AIProvider
  ) {}

  private async executeWithFallback<T>(
    fn: (provider: AIProvider) => Promise<T>,
    methodName: string
  ): Promise<T> {
    try {
      logger.info(`Attempting ${methodName} via primary provider...`);
      return await fn(this.primary);
    } catch (primaryErr: any) {
      logger.warn(
        { err: primaryErr },
        `Primary provider failed in ${methodName}. Falling back to secondary provider...`
      );
      try {
        logger.info(`Attempting ${methodName} via fallback (secondary) provider...`);
        return await fn(this.secondary);
      } catch (secondaryErr: any) {
        logger.error(
          { err: secondaryErr },
          `Secondary provider also failed in ${methodName}.`
        );
        // Bubble up secondary error with context
        const originalMsg = primaryErr.message || String(primaryErr);
        const fallbackMsg = secondaryErr.message || String(secondaryErr);
        throw new Error(`AI generation failed. Primary error: ${originalMsg}. Fallback error: ${fallbackMsg}`);
      }
    }
  }

  async generateSyllabus(topic: string, searchContext: SearchResult[]): Promise<StageDraft[]> {
    return this.executeWithFallback(
      (p) => p.generateSyllabus(topic, searchContext),
      "generateSyllabus"
    );
  }

  async generateFreeResources(
    topic: string,
    stage: StageDraft,
    searchContext: SearchResult[]
  ): Promise<FreeResourceDraft[]> {
    return this.executeWithFallback(
      (p) => p.generateFreeResources(topic, stage, searchContext),
      "generateFreeResources"
    );
  }

  async generateCertifications(
    topic: string,
    searchContext: SearchResult[]
  ): Promise<CertificationDraft[]> {
    return this.executeWithFallback(
      (p) => p.generateCertifications(topic, searchContext),
      "generateCertifications"
    );
  }

  async suggestPracticeTags(topic: string, stage: StageDraft): Promise<PracticeTagSuggestion[]> {
    return this.executeWithFallback(
      (p) => p.suggestPracticeTags(topic, stage),
      "suggestPracticeTags"
    );
  }

  async generateTimeline(topic: string, stages: StageDraft[]): Promise<TimelineDayDraft[]> {
    return this.executeWithFallback(
      (p) => p.generateTimeline(topic, stages),
      "generateTimeline"
    );
  }
}

export function getAIProvider(): AIProvider {
  if (cached) return cached;

  if (env.MOCK_MODE) {
    cached = new MockAIProvider();
    return cached;
  }

  if (env.AI_PROVIDER === "openai") {
    cached = new OpenAIProvider();
  } else if (env.AI_PROVIDER === "gemini") {
    const gemini = new GeminiProvider();
    if (env.OPENAI_API_KEY) {
      const fallback = new OpenAIProvider();
      cached = new FallbackAIProvider(gemini, fallback);
    } else {
      cached = gemini;
    }
  } else {
    cached = new AnthropicProvider();
  }
  return cached;
}

// Exposed for tests that need to reset the memoized provider between cases.
export function resetAIProviderCache(): void {
  cached = null;
}
