export interface UserProgress {
  roadmapId: string;
  unlockedStageIds: string[];
  completedStageIds: string[];
  /**
   * Ticked syllabus items, keyed by stage id, as indexes into that stage's
   * `syllabus` array. A stage with nothing ticked is absent rather than present
   * with an empty array, so always read it through a fallback.
   */
  completedItems: Record<string, number[]>;
}
