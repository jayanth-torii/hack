import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { UserProgress, backfillCompletedStages, type UserProgressDocument } from "../models/UserProgress";
import { recordActivity } from "../services/activity.service";
import { getRoadmapById } from "../services/roadmap.service";
import { isStageUnlocked, recomputeUnlockedStageIds } from "../services/unlock.service";

async function getOrCreateProgress(userId: string, roadmapId: string) {
  const roadmap = await getRoadmapById(roadmapId);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  let progress = await UserProgress.findOne({ userId, roadmapId });
  if (!progress) {
    const unlockedStageIds = recomputeUnlockedStageIds(roadmap.stages, []);
    progress = await UserProgress.create({
      userId,
      roadmapId,
      completedStageIds: [],
      completedStages: [],
      unlockedStageIds,
    });
  } else if (backfillCompletedStages(progress)) {
    // Document predates the dated-completions field; repair it in place rather
    // than running a migration against a live database.
    await progress.save();
  }
  return { roadmap, progress };
}

/**
 * Wire format for lesson ticks: `{ "<stageId>": [0, 2, 3] }`.
 *
 * A map keyed by stage is what every caller actually wants — the timeline
 * renders one stage at a time — and it keeps the flat stage arrays above
 * untouched, so no existing client breaks.
 */
function serializeItems(progress: UserProgressDocument): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const entry of progress.completedItems) {
    if (entry.itemIndexes.length > 0) out[entry.stageId.toString()] = [...entry.itemIndexes];
  }
  return out;
}

function progressPayload(progress: UserProgressDocument) {
  return {
    completedStageIds: progress.completedStageIds,
    unlockedStageIds: progress.unlockedStageIds,
    completedItems: serializeItems(progress),
  };
}

/** Replaces a stage's tick set, creating or pruning its entry as needed. */
function writeStageItems(
  progress: UserProgressDocument,
  stageId: Types.ObjectId,
  indexes: number[]
): void {
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  const existing = progress.completedItems.find((entry) => entry.stageId.equals(stageId));

  if (!existing) {
    if (sorted.length > 0) progress.completedItems.push({ stageId, itemIndexes: sorted });
    return;
  }
  if (sorted.length === 0) {
    // Drop the entry rather than keep an empty one, so the serialized map only
    // ever lists stages with real ticks.
    progress.completedItems = progress.completedItems.filter(
      (entry) => !entry.stageId.equals(stageId)
    );
    return;
  }
  existing.itemIndexes = sorted;
  progress.markModified("completedItems");
}

function itemsForStage(progress: UserProgressDocument, stageId: Types.ObjectId): number[] {
  return progress.completedItems.find((entry) => entry.stageId.equals(stageId))?.itemIndexes ?? [];
}

export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };
  const { progress } = await getOrCreateProgress(userId, id);
  req.log?.info(
    { userId, roadmapId: id, completed: progress.completedStageIds.length, unlocked: progress.unlockedStageIds.length },
    "Progress fetched"
  );
  res.status(200).json(progressPayload(progress));
});

/**
 * PATCH /roadmaps/:id/progress/:stageId
 * Marks a stage complete and returns the recomputed unlock set. This is the
 * ONLY place progression advances — the frontend's dimmed/locked nodes are
 * purely a reflection of this response, never the source of truth.
 */
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id, stageId } = req.params as { id: string; stageId: string };

  if (!Types.ObjectId.isValid(stageId)) throw ApiError.badRequest("Invalid stageId");

  const { roadmap, progress } = await getOrCreateProgress(userId, id);
  const stageObjectId = new Types.ObjectId(stageId);

  const stageExists = roadmap.stages.some((s) => s._id.equals(stageObjectId));
  if (!stageExists) throw ApiError.notFound("Stage not found on this roadmap");

  if (!isStageUnlocked(stageObjectId, progress.unlockedStageIds)) {
    throw ApiError.badRequest("This stage is not yet unlocked");
  }

  const alreadyCompleted = progress.completedStageIds.some((id_) => id_.equals(stageObjectId));
  if (!alreadyCompleted) {
    progress.completedStageIds.push(stageObjectId);
    progress.completedStages.push({ stageId: stageObjectId, completedAt: new Date() });
  }

  // Completing the stage completes its lessons. Without this the timeline would
  // show a finished stage with unticked rows inside it.
  const stageForItems = roadmap.stages.find((s) => s._id.equals(stageObjectId));
  const itemCount = stageForItems?.syllabus.length ?? 0;
  if (itemCount > 0) {
    writeStageItems(progress, stageObjectId, Array.from({ length: itemCount }, (_, i) => i));
  }

  progress.unlockedStageIds = recomputeUnlockedStageIds(roadmap.stages, progress.completedStageIds);
  await progress.save();

  req.log?.info(
    {
      userId,
      roadmapId: id,
      stageId,
      completedCount: progress.completedStageIds.length,
      wasAlreadyCompleted: alreadyCompleted,
    },
    "Stage progress updated"
  );

  // Only a genuinely new completion is history. Re-marking an already complete
  // stage must not inflate the streak or the activity chart.
  if (!alreadyCompleted) {
    const stage = roadmap.stages.find((s) => s._id.equals(stageObjectId));
    await recordActivity({
      userId,
      type: "stage_completed",
      roadmapId: id,
      stageId,
      ...(stage?.title ? { title: stage.title } : {}),
      subtitle: roadmap.topic,
    });
  }

  res.status(200).json(progressPayload(progress));
});

/**
 * PUT /roadmaps/:id/progress/:stageId/items
 * Body: `{ index: number, done: boolean }`
 *
 * Ticks or unticks one syllabus item. Idempotent — sending `done: true` twice
 * is not an error and changes nothing the second time.
 *
 * Ticking the last outstanding item completes the stage, which is what makes
 * the timeline's "Continue (2/4)" button finish a stage when the fourth lesson
 * is ticked. Unticking afterwards does NOT reverse that: later stages may
 * already be unlocked or complete behind it, and silently relocking a learner's
 * finished work is worse than leaving a completed stage with a gap in it.
 */
export const updateStageItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id, stageId } = req.params as { id: string; stageId: string };
  const { index, done } = req.body as { index: number; done: boolean };

  if (!Types.ObjectId.isValid(stageId)) throw ApiError.badRequest("Invalid stageId");

  const { roadmap, progress } = await getOrCreateProgress(userId, id);
  const stageObjectId = new Types.ObjectId(stageId);

  const stage = roadmap.stages.find((s) => s._id.equals(stageObjectId));
  if (!stage) throw ApiError.notFound("Stage not found on this roadmap");

  if (index >= stage.syllabus.length) {
    throw ApiError.badRequest(
      `This stage has ${stage.syllabus.length} ${stage.syllabus.length === 1 ? "item" : "items"}`
    );
  }

  // Same gate as completing the whole stage: a locked stage is not workable, so
  // its lessons are not tickable either.
  if (!isStageUnlocked(stageObjectId, progress.unlockedStageIds)) {
    throw ApiError.badRequest("This stage is not yet unlocked");
  }

  const current = itemsForStage(progress, stageObjectId);
  const next = done
    ? [...current, index]
    : current.filter((existing) => existing !== index);
  writeStageItems(progress, stageObjectId, next);

  const ticked = itemsForStage(progress, stageObjectId).length;
  const stageWasComplete = progress.completedStageIds.some((id_) => id_.equals(stageObjectId));
  const stageNowComplete = ticked === stage.syllabus.length;

  if (stageNowComplete && !stageWasComplete) {
    progress.completedStageIds.push(stageObjectId);
    progress.completedStages.push({ stageId: stageObjectId, completedAt: new Date() });
    progress.unlockedStageIds = recomputeUnlockedStageIds(
      roadmap.stages,
      progress.completedStageIds
    );
  }

  await progress.save();

  req.log?.info(
    { userId, roadmapId: id, stageId, index, done, ticked, stageNowComplete },
    "Stage item progress updated"
  );

  if (stageNowComplete && !stageWasComplete) {
    await recordActivity({
      userId,
      type: "stage_completed",
      roadmapId: id,
      stageId,
      ...(stage.title ? { title: stage.title } : {}),
      subtitle: roadmap.topic,
    });
  }

  res.status(200).json({ ...progressPayload(progress), stageCompleted: stageNowComplete });
});
