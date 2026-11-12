import { Schema, model, type Document, type Types } from "mongoose";

/** One completed stage, with the moment it was completed. */
export interface CompletedStageEntry {
  stageId: Types.ObjectId;
  completedAt: Date;
}

/**
 * The syllabus items a learner has ticked inside one stage.
 *
 * Items are addressed by their index in the stage's `syllabus` array rather
 * than by text. A generated roadmap's stages are an immutable template once
 * written — many learners share one cached roadmap document and nothing
 * rewrites its syllabus — so the index is stable for the life of the roadmap,
 * and it stays correct when two items happen to have the same wording.
 */
export interface StageItemsEntry {
  stageId: Types.ObjectId;
  /** Sorted, de-duplicated indexes into `stage.syllabus`. */
  itemIndexes: number[];
}

export interface UserProgressDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  roadmapId: Types.ObjectId;
  /**
   * Flat id list. Kept as the wire format the API has always returned and the
   * frontend already reads, so adding timestamps did not become a breaking
   * change. Always mirrors `completedStages`.
   */
  completedStageIds: Types.ObjectId[];
  /**
   * The same completions, dated. This is what the activity chart, the streak
   * and "completed on" labels are computed from — the flat id array above
   * could never answer "when".
   *
   * Documents written before this field existed are backfilled lazily on read
   * (see `backfillCompletedStages`), using the document's `updatedAt` as a
   * best-known timestamp rather than inventing a precise one.
   */
  completedStages: CompletedStageEntry[];
  /**
   * Per-stage lesson ticks. A stage can have items ticked long before it is
   * complete, so this cannot live on `completedStages` — it is its own list,
   * holding only stages the learner has actually touched.
   */
  completedItems: StageItemsEntry[];
  unlockedStageIds: Types.ObjectId[];
  /**
   * When the learner passed the certificate quiz, and with what score.
   * A certificate cannot be issued without a pass, so this is the record that
   * makes the gate enforceable across requests rather than only inside the
   * one that scored the attempt.
   */
  quizPassedAt?: Date | null;
  quizScore?: number | null;
  quizAttempts?: number;
  updatedAt: Date;
  createdAt: Date;
}

const completedStageSchema = new Schema<CompletedStageEntry>(
  {
    stageId: { type: Schema.Types.ObjectId, required: true },
    completedAt: { type: Date, required: true },
  },
  { _id: false }
);

const stageItemsSchema = new Schema<StageItemsEntry>(
  {
    stageId: { type: Schema.Types.ObjectId, required: true },
    itemIndexes: { type: [Number], default: [] },
  },
  { _id: false }
);

// Kept separate from the Roadmap template document so many students can share
// one cached/generated roadmap without write contention on that shared doc.
const userProgressSchema = new Schema<UserProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    completedStageIds: [{ type: Schema.Types.ObjectId }],
    completedStages: { type: [completedStageSchema], default: [] },
    completedItems: { type: [stageItemsSchema], default: [] },
    unlockedStageIds: [{ type: Schema.Types.ObjectId }],
    quizPassedAt: { type: Date, default: null },
    quizScore: { type: Number, default: null },
    quizAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export const UserProgress = model<UserProgressDocument>("UserProgress", userProgressSchema);

/**
 * Brings a pre-timestamp document up to date in memory.
 *
 * Older documents only have `completedStageIds`. Rather than run a one-shot
 * migration against a live database, every read path repairs the document it
 * touches: any id missing from `completedStages` is added with the document's
 * `updatedAt`. That is honest about precision — it is the last time this
 * document changed, which for a single-stage history is exact and for a longer
 * one is the best the old schema can support.
 *
 * Returns true when something changed, so the caller can decide whether to save.
 */
export function backfillCompletedStages(progress: UserProgressDocument): boolean {
  const dated = new Set(progress.completedStages.map((entry) => entry.stageId.toString()));
  const missing = progress.completedStageIds.filter((id) => !dated.has(id.toString()));
  if (missing.length === 0) return false;

  const fallback = progress.updatedAt ?? progress.createdAt ?? new Date();
  for (const stageId of missing) {
    progress.completedStages.push({ stageId, completedAt: fallback });
  }
  return true;
}
