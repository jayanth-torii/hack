"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { Roadmap, UserProgress } from "@/types";
import { useReducedMotionOrMobile } from "@/hooks/useReducedMotion";
import { useRoadmapStore } from "@/store/roadmapStore";
import { MobileTimeline } from "./MobileTimeline";
import { CanvasLoadingFallback } from "@/components/canvas/SceneLoader";

// The 3D Canvas is dynamically imported with ssr:false per the spec's
// performance requirements — three.js touches the DOM/WebGL context, which
// doesn't exist during server rendering.
const RoadmapCanvas = dynamic(
  () => import("@/components/canvas/RoadmapCanvas").then((m) => m.RoadmapCanvas),
  { ssr: false, loading: () => <CanvasLoadingFallback /> }
);

interface RoadmapJourneyProps {
  roadmap: Roadmap;
  progress?: UserProgress;
}

export function RoadmapJourney({ roadmap, progress }: RoadmapJourneyProps) {
  const isMobileFallback = useReducedMotionOrMobile();
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setProgress = useRoadmapStore((s) => s.setProgress);
  const setMobileFallback = useRoadmapStore((s) => s.setMobileFallback);

  useEffect(() => {
    setRoadmap(roadmap);
  }, [roadmap, setRoadmap]);

  useEffect(() => {
    if (progress) setProgress(progress);
  }, [progress, setProgress]);

  useEffect(() => {
    setMobileFallback(isMobileFallback);
  }, [isMobileFallback, setMobileFallback]);

  if (isMobileFallback) {
    return <MobileTimeline roadmap={roadmap} />;
  }

  return <RoadmapCanvas roadmap={roadmap} />;
}
