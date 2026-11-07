import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

let initialized = false;
let lenisInstance: Lenis | null = null;

/**
 * Registers ScrollTrigger once, and wires Lenis's smooth-scroll raf loop
 * into GSAP's own ticker so ScrollTrigger reads Lenis-smoothed scroll
 * positions instead of the browser's native (jumpy) scroll value. Call once
 * from the client-only RoadmapCanvas mount; safe to call multiple times.
 */
export function initSmoothScroll(): Lenis {
  if (typeof window === "undefined") {
    throw new Error("initSmoothScroll must only run on the client");
  }

  if (!initialized) {
    gsap.registerPlugin(ScrollTrigger);
    initialized = true;
  }

  if (lenisInstance) return lenisInstance;

  // `syncTouch` re-implements touch scrolling in JS. On phones that means a
  // laggy, non-native feel and broken overscroll/pull-to-refresh, so it is
  // only ever enabled for devices with a fine pointer (mouse/trackpad).
  // Reduced-motion users get the browser's own scrolling, untouched.
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lenis = new Lenis({
    smoothWheel: fine && !reduce,
    syncTouch: false,
  });
  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;
  return lenis;
}

export function destroySmoothScroll(): void {
  lenisInstance?.destroy();
  lenisInstance = null;
}

export { gsap, ScrollTrigger };
