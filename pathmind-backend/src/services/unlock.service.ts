import { Types } from "mongoose";
import type { Stage } from "@/models/Roadmap";

/**
 * Server-side enforcement of difficulty-aware unlock progression.
 *
 * Rule: the stage with no prerequisite (order 0) is always unlocked. Every
 * other stage unlocks the moment its `prerequisiteStageId` appears in
 * `completedStageIds`. This is recomputed from scratch on every call (cheap:
 * stages arrays are small) rather than incrementally patched, so it can
 * never drift from the source of truth.
 */
export function recomputeUnlockedStageIds(
  stages: Stage[],
  completedStageIds: Types.ObjectId[]
): Types.ObjectId[] {
  const completedSet = new Set(completedStageIds.map((id) => id.toString()));
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  const unlocked: Types.ObjectId[] = [];
  for (const stage of sorted) {
    if (stage.prerequisiteStageId === null) {
      unlocked.push(stage._id);
    } else if (completedSet.has(stage.prerequisiteStageId.toString())) {
      unlocked.push(stage._id);
    }
  }
  return unlocked;
}

export function isStageUnlocked(
  stageId: Types.ObjectId,
  unlockedStageIds: Types.ObjectId[]
): boolean {
  const target = stageId.toString();
  return unlockedStageIds.some((id) => id.toString() === target);
}
