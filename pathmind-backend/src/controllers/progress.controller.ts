import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { UserProgress, backfillCompletedStages } from "../models/UserProgress";
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

export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };
  const { progress } = await getOrCreateProgress(userId, id);
  req.log?.info(
    { userId, roadmapId: id, completed: progress.completedStageIds.length, unlocked: progress.unlockedStageIds.length },
    "Progress fetched"
  );
  res.status(200).json({
    completedStageIds: progress.completedStageIds,
    unlockedStageIds: progress.unlockedStageIds,
  });
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

  res.status(200).json({
    completedStageIds: progress.completedStageIds,
    unlockedStageIds: progress.unlockedStageIds,
  });
});
