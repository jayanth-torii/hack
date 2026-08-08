"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

// GSAP is registered once at module scope (initSmoothScroll's registration
// is only used by the 3D journey — this module is safe on any client page).
gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** ScrollTrigger start position, e.g. "top 85%" */
  start?: string;
  /** Stagger (s) between direct children when the wrapper has several */
  stagger?: number;
  /** Vertical travel distance in px */
  y?: number;
  duration?: number;
}

/**
 * Scroll-reveal wrapper built on GSAP + ScrollTrigger (the Acjon template's
 * animation language): each direct child fades/slides in with a stagger the
 * moment the wrapper scrolls into view. Respects prefers-reduced-motion by
 * leaving content fully visible. Cleanup via gsap.context so HMR/route
 * changes never leak tweens or triggers.
 */
export function Reveal({
  children,
  className,
  start = "top 85%",
  stagger = 0.12,
  y = 32,
  duration = 0.9,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const targets = el.children.length > 0 ? Array.from(el.children) : [el];
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: el, start },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [start, stagger, y, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
