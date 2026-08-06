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

  const lenis = new Lenis({ smoothWheel: true, syncTouch: true });
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
