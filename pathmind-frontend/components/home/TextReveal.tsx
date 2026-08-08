"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { clsx } from "@/lib/clsx";

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  /** Each entry renders as a masked line; words slide up into view on scroll */
  lines: string[];
  /** Line indexes to render in the lime accent color */
  accentLines?: number[];
  className?: string;
}

/**
 * GSAP word-by-word "load text" reveal: every word of the heading is masked
 * inside its line and slides up (yPercent) with a stagger when the heading
 * scrolls into view. Reduced-motion users simply get the text fully visible.
 */
export function TextReveal({ lines, accentLines = [], className }: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = el.querySelectorAll("[data-word]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 130, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.045,
          scrollTrigger: { trigger: el, start: "top 88%" },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [lines, accentLines]);

  return (
    <span ref={ref} className={clsx("block", className)}>
      {lines.map((line, lineIdx) => (
        <span key={`${lineIdx}-${line}`} className="block overflow-hidden pb-1">
          {line.split(" ").map((word, wordIdx) => (
            <span
              key={`${wordIdx}-${word}`}
              data-word
              className={clsx(
                "mr-[0.26em] inline-block will-change-transform",
                accentLines.includes(lineIdx) && "text-accent-text"
              )}
            >
              {word}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
