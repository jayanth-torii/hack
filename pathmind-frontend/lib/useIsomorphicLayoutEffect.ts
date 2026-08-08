import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client (so GSAP can set initial states before the
 * first paint — no flash of unanimated content), plain useEffect during SSR.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
