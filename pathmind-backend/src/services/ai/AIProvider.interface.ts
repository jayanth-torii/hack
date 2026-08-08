import type { CertProvider, Difficulty, ResourceType } from "../../types/domain";
import type { SearchResult } from "./webSearch";

export interface StageDraft {
  order: number;
  title: string;
  type: "learn" | "practice";
  difficulty: Difficulty;
  /** index into the drafted stages array of this stage's prerequisite, or null for the first stage */
  prerequisiteOrder: number | null;
  syllabus: string[];
  estimatedDays: number;
}

export interface FreeResourceDraft {
  title: string;
  url: string;
  type: ResourceType;
}

export interface CertificationDraft {
  title: string;
  provider: CertProvider;
  url: string;
  price: number | null;
  rank: number;
}

export interface PracticeTagSuggestion {
  tag: string;
  difficulty: Difficulty;
}

export interface TimelineDayDraft {
  day: number;
  tasks: string[];
}

/**
 * One interface, many implementations (mockProvider, anthropicProvider,
 * openaiProvider). aiService.ts is the only place that picks which
 * implementation is active — nothing else in the codebase branches on
 * provider, so swapping/adding a vendor never touches business logic.
 *
 * Generation order (mirrors the build order in the spec): syllabus -> free
 * resources (per stage) -> certifications -> practice tags (per stage) ->
 * timeline.
 */
export interface AIProvider {
  generateSyllabus(topic: string, searchContext: SearchResult[]): Promise<StageDraft[]>;

  generateFreeResources(
    topic: string,
    stage: StageDraft,
    searchContext: SearchResult[]
  ): Promise<FreeResourceDraft[]>;

  generateCertifications(
    topic: string,
    searchContext: SearchResult[]
  ): Promise<CertificationDraft[]>;

  suggestPracticeTags(topic: string, stage: StageDraft): Promise<PracticeTagSuggestion[]>;

  generateTimeline(topic: string, stages: StageDraft[]): Promise<TimelineDayDraft[]>;
}
