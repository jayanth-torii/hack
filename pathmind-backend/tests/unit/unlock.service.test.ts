import { Types } from "mongoose";
import { isStageUnlocked, recomputeUnlockedStageIds } from "@/services/unlock.service";
import type { Stage } from "@/models/Roadmap";

function makeStage(order: number, prerequisiteStageId: Types.ObjectId | null): Stage {
  return {
    _id: new Types.ObjectId(),
    order,
    title: `Stage ${order}`,
    type: "learn",
    difficulty: "beginner",
    prerequisiteStageId,
    syllabus: [],
    freeResources: [],
    certifications: [],
    practiceLinks: [],
    estimatedDays: 1,
  };
}

describe("unlock.service", () => {
  it("always unlocks the first stage (prerequisiteStageId = null)", () => {
    const stage0 = makeStage(0, null);
    const unlocked = recomputeUnlockedStageIds([stage0], []);
    expect(unlocked.map((id) => id.toString())).toEqual([stage0._id.toString()]);
  });

  it("unlocks a chain of stages progressively as prerequisites complete", () => {
    const stage0 = makeStage(0, null);
    const stage1 = makeStage(1, stage0._id);
    const stage2 = makeStage(2, stage1._id);
    const stages = [stage0, stage1, stage2];

    let unlocked = recomputeUnlockedStageIds(stages, []);
    expect(unlocked).toHaveLength(1);
    expect(isStageUnlocked(stage1._id, unlocked)).toBe(false);

    unlocked = recomputeUnlockedStageIds(stages, [stage0._id]);
    expect(isStageUnlocked(stage1._id, unlocked)).toBe(true);
    expect(isStageUnlocked(stage2._id, unlocked)).toBe(false);

    unlocked = recomputeUnlockedStageIds(stages, [stage0._id, stage1._id]);
    expect(isStageUnlocked(stage2._id, unlocked)).toBe(true);
  });

  it("does not unlock a stage whose prerequisite is skipped", () => {
    const stage0 = makeStage(0, null);
    const stage1 = makeStage(1, stage0._id);
    const stage2 = makeStage(2, stage1._id);
    const stages = [stage0, stage1, stage2];

    // Completing stage2's prerequisite's prerequisite (stage0) alone must not unlock stage2.
    const unlocked = recomputeUnlockedStageIds(stages, [stage0._id]);
    expect(isStageUnlocked(stage2._id, unlocked)).toBe(false);
  });

  it("is order-independent in the input stages array", () => {
    const stage0 = makeStage(0, null);
    const stage1 = makeStage(1, stage0._id);
    const shuffled = [stage1, stage0];

    const unlocked = recomputeUnlockedStageIds(shuffled, [stage0._id]);
    expect(isStageUnlocked(stage1._id, unlocked)).toBe(true);
  });
});
