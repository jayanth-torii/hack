"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";

interface ProgressRingProps {
  /** 0–100. Values outside that range are clamped rather than drawn wrong. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Text inside the ring. Defaults to the rounded percentage. */
  label?: string;
  sublabel?: string;
  className?: string;
}

/**
 * Donut progress indicator.
 *
 * The percentage is rendered as real text in the middle, not just conveyed by
 * arc length — status is never shape-only here, and a screen reader gets the
 * number from the accessible name rather than having to interpret an SVG.
 */
export function ProgressRing({
  percent,
  size = 112,
  strokeWidth = 10,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  // Animate from zero on mount so the arc sweeps in; under reduced motion it
  // starts at its final value and never moves.
  const [shown, setShown] = useState(reduce ? clamped : 0);
  useEffect(() => {
    if (reduce) {
      setShown(clamped);
      return;
    }
    const raf = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped, reduce]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (shown / 100) * circumference;

  return (
    <div
      className={clsx("relative flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% complete${sublabel ? ` — ${sublabel}` : ""}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-line/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-accent"
          style={{
            transition: reduce ? undefined : "stroke-dashoffset 900ms var(--ease-emphasized)",
          }}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold tabular-nums text-paper">
          {label ?? `${clamped}%`}
        </span>
        {sublabel && <span className="mt-0.5 text-[0.625rem] text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
