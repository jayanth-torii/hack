import { create } from "zustand";
import type { Roadmap, UserProgress } from "@/types";

interface RoadmapState {
  currentRoadmap: Roadmap | null;
  progress: UserProgress | null;
  activeStageIndex: number;
  savedRoadmaps: Roadmap[];
  isMobileFallback: boolean;

  setRoadmap: (roadmap: Roadmap) => void;
  setProgress: (progress: UserProgress) => void;
  setActiveStageIndex: (index: number) => void;
  hydrateSavedRoadmaps: (roadmaps: Roadmap[]) => void;
  setMobileFallback: (value: boolean) => void;
  reset: () => void;
}

// Unlock derivation itself is NOT stored here — it's a memoized selector in
// hooks/useUnlockLogic.ts computed from `currentRoadmap` + `progress`, so
// there is exactly one source of truth for "is this stage unlocked" shared
// by both the 3D view and the mobile timeline.
export const useRoadmapStore = create<RoadmapState>((set) => ({
  currentRoadmap: null,
  progress: null,
  activeStageIndex: 0,
  savedRoadmaps: [],
  isMobileFallback: false,

  setRoadmap: (roadmap) => set({ currentRoadmap: roadmap, activeStageIndex: 0 }),
  setProgress: (progress) => set({ progress }),
  setActiveStageIndex: (index) => set({ activeStageIndex: index }),
  hydrateSavedRoadmaps: (roadmaps) => set({ savedRoadmaps: roadmaps }),
  setMobileFallback: (value) => set({ isMobileFallback: value }),
  reset: () => set({ currentRoadmap: null, progress: null, activeStageIndex: 0 }),
}));
