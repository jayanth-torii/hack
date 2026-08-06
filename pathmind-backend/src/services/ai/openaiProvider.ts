import type {
  AIProvider,
  CertificationDraft,
  FreeResourceDraft,
  PracticeTagSuggestion,
  StageDraft,
  TimelineDayDraft,
} from "./AIProvider.interface";
import type { SearchResult } from "./webSearch";

/**
 * Stub implementation kept behind the same AIProvider interface as
 * anthropicProvider.ts so switching AI_PROVIDER=openai is a drop-in once
 * this is filled in (e.g. via the `openai` npm package + a JSON-mode
 * chat.completions.create call, mirroring promptBuilder.ts's prompts and
 * anthropicProvider.ts's Zod-validated parseJsonArray pattern).
 */
export class OpenAIProvider implements AIProvider {
  generateSyllabus(_topic: string, _searchContext: SearchResult[]): Promise<StageDraft[]> {
    throw new NotImplementedError();
  }
  generateFreeResources(
    _topic: string,
    _stage: StageDraft,
    _searchContext: SearchResult[]
  ): Promise<FreeResourceDraft[]> {
    throw new NotImplementedError();
  }
  generateCertifications(
    _topic: string,
    _searchContext: SearchResult[]
  ): Promise<CertificationDraft[]> {
    throw new NotImplementedError();
  }
  suggestPracticeTags(_topic: string, _stage: StageDraft): Promise<PracticeTagSuggestion[]> {
    throw new NotImplementedError();
  }
  generateTimeline(_topic: string, _stages: StageDraft[]): Promise<TimelineDayDraft[]> {
    throw new NotImplementedError();
  }
}

class NotImplementedError extends Error {
  constructor() {
    super(
      "OpenAIProvider is a stub. Implement it against promptBuilder.ts's prompts, or set AI_PROVIDER=anthropic / MOCK_MODE=true."
    );
  }
}
