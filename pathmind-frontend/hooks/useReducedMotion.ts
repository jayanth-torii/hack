"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT_PX = 768;

/**
 * True when either the OS/browser signals prefers-reduced-motion, or the
 * viewport is mobile-width. Both cases fall back to MobileTimeline instead
 * of the 3D scroll journey (spec requirement: reduced-motion users get the
 * vertical timeline; so do small screens where a scroll-scrubbed camera
 * isn't a good experience).
 */
export function useReducedMotionOrMobile(): boolean {
  const [shouldFallback, setShouldFallback] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);

    const update = () => setShouldFallback(motionQuery.matches || widthQuery.matches);
    update();

    motionQuery.addEventListener("change", update);
    widthQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      widthQuery.removeEventListener("change", update);
    };
  }, []);

  return shouldFallback;
}
