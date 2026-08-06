"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, initSmoothScroll } from "@/lib/gsap-config";
import { useRoadmapStore } from "@/store/roadmapStore";

export interface ScrollProgressRef {
  /** 0..1 progress along the whole roadmap curve, mutated in place every scroll frame */
  progress: number;
}

/**
 * Drives the scroll-scrubbed camera journey: pins a tall scroll container
 * (`stageCount * 100vh`) and maps scroll progress (0..1) to both a mutable
 * ref (read every useFrame tick by CameraRig, avoiding React re-renders on
 * every scroll pixel) and the Zustand `activeStageIndex` (throttled to
 * integer stage changes, which IS worth a re-render since it toggles which
 * Node mounts its <Html> panel).
 */
export function useRoadmapScroll(containerRef: React.RefObject<HTMLElement>, stageCount: number) {
  const progressRef = useRef<ScrollProgressRef>({ progress: 0 });
  const setActiveStageIndex = useRoadmapStore((s) => s.setActiveStageIndex);

  useEffect(() => {
    if (!containerRef.current || stageCount === 0) return;

    const lenis = initSmoothScroll();
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current.progress = self.progress;
        const activeIndex = Math.round(self.progress * (stageCount - 1));
        setActiveStageIndex(activeIndex);
      },
    });

    return () => {
      trigger.kill();
      lenis.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageCount]);

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.globalTimeline.clear();
    };
  }, []);

  return progressRef;
}
