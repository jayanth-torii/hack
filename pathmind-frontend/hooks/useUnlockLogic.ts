"use client";

import { useMemo } from "react";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Stage } from "@/types/roadmap";

export interface UnlockLogic {
  isUnlocked: (stageId: string) => boolean;
  isCompleted: (stageId: string) => boolean;
  nextUnlockable: () => Stage | null;
}

/**
 * The single source of truth for "is this stage locked/unlocked/completed"
 * on the client. Consumed identically by the 3D `Node`/`NodeCard` panels and
 * by `MobileTimeline` — neither ever computes unlock state itself, so the
 * two views can never drift out of sync.
 *
 * Falls back to "stage 0 only" when server progress hasn't loaded yet, and
 * defers to the server's `unlockedStageIds` the moment it has — the server
 * (unlock.service.ts) is always the actual source of truth; this is a
 * read-only mirror plus an optimistic bridge for the instant between a
 * mark-complete click and the mutation response landing.
 */
export function useUnlockLogic(): UnlockLogic {
  const roadmap = useRoadmapStore((s) => s.currentRoadmap);
  const progress = useRoadmapStore((s) => s.progress);

  return useMemo(() => {
    const stages = roadmap?.stages ?? [];
    const unlockedSet = new Set(progress?.unlockedStageIds ?? []);
    const completedSet = new Set(progress?.completedStageIds ?? []);

    // Progress not loaded yet: only the first (no-prerequisite) stage is unlocked.
    if (!progress && stages.length > 0) {
      unlockedSet.add(stages[0]!.id);
    }

    return {
      isUnlocked: (stageId: string) => unlockedSet.has(stageId),
      isCompleted: (stageId: string) => completedSet.has(stageId),
      nextUnlockable: () => stages.find((s) => unlockedSet.has(s.id) && !completedSet.has(s.id)) ?? null,
    };
  }, [roadmap, progress]);
}
