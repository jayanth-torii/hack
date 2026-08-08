"use client";

import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";

// Decorative geometry for otherwise-empty areas of the landing (Acjon uses
// similar floating shapes around its hero/CTA imagery). Pure SVG strokes,
// gently floating/rotating via framer-motion; static under reduced motion.

type Variant = "hero" | "features" | "how" | "cta" | "footer";

interface ShapeSpec {
  key: string;
  className: string;
  shape: ReactNode;
  float?: number;
  duration?: number;
  delay?: number;
  spin?: number;
}

function Float({
  className,
  shape,
  float = 12,
  duration = 6,
  delay = 0,
  spin = 0,
}: {
  className: string;
  shape: ReactNode;
  float: number;
  duration: number;
  delay: number;
  spin: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={clsx("pointer-events-none absolute", className)}
      animate={
        reduce
          ? undefined
          : { y: [0, -float, 0], rotate: [spin, spin + 8, spin] }
      }
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {shape}
    </motion.div>
  );
}

const VARIANTS: Record<Variant, ShapeSpec[]> = {
  hero: [
    {
      key: "ring",
      className: "-top-8 right-10 h-24 w-24 text-accent/30 md:h-32 md:w-32",
      shape: <Ring />,
      duration: 7,
    },
    {
      key: "triangle",
      className: "top-1/3 -left-5 h-20 w-20 text-brand-400/25 md:h-24 md:w-24",
      shape: <Triangle />,
      duration: 8,
      delay: 0.4,
      spin: 12,
    },
    {
      key: "plus",
      className: "bottom-20 left-1/4 h-9 w-9 text-accent/40",
      shape: <Plus />,
      duration: 5.5,
      delay: 0.8,
    },
    {
      key: "dots",
      className: "bottom-28 right-[18%] h-14 w-14 text-muted/40",
      shape: <Dots />,
      duration: 6.5,
      delay: 1,
    },
  ],
  features: [
    {
      key: "ring",
      className: "-top-12 right-8 h-32 w-32 text-accent/20",
      shape: <Ring dashed />,
      duration: 9,
    },
    {
      key: "square",
      className: "top-1/4 -left-7 h-16 w-16 text-brand-400/20",
      shape: <Square />,
      duration: 7.5,
      delay: 0.3,
      spin: 20,
    },
    {
      key: "dots",
      className: "bottom-12 right-0 h-14 w-14 text-muted/30",
      shape: <Dots />,
      duration: 6,
      delay: 0.6,
    },
  ],
  how: [
    {
      key: "triangle",
      className: "-top-6 right-1/4 h-20 w-20 text-paper/10 md:h-28 md:w-28",
      shape: <Triangle />,
      duration: 8,
      spin: 10,
    },
    {
      key: "ring",
      className: "-bottom-10 -left-8 h-28 w-28 text-brand-400/15",
      shape: <Ring dashed />,
      duration: 9,
      delay: 0.5,
    },
    {
      key: "plus",
      className: "bottom-16 right-10 h-8 w-8 text-accent/25",
      shape: <Plus />,
      duration: 5,
    },
  ],
  cta: [
    {
      key: "ring",
      className: "left-1/2 top-1/2 -ml-[15rem] -mt-[15rem] h-[30rem] w-[30rem] text-accent/10",
      shape: <Ring dashed />,
      duration: 0,
      spin: 360,
    },
    {
      key: "plus",
      className: "right-16 top-16 h-10 w-10 text-accent/30",
      shape: <Plus />,
      duration: 6,
    },
    {
      key: "dots",
      className: "bottom-16 left-16 h-16 w-16 text-muted/30",
      shape: <Dots />,
      duration: 7,
      delay: 0.4,
    },
  ],
  footer: [
    {
      key: "ring",
      className: "-top-12 right-12 h-24 w-24 text-accent/10",
      shape: <Ring />,
      duration: 9,
    },
    {
      key: "dots",
      className: "top-1/3 left-8 h-12 w-12 text-muted/40",
      shape: <Dots />,
      duration: 7,
      delay: 0.5,
    },
  ],
};

export function GeometryShapes({ variant }: { variant: Variant }) {
  return (
    <>
      {VARIANTS[variant].map((spec) => (
        <Float
          key={spec.key}
          className={spec.className}
          shape={spec.shape}
          float={spec.float ?? 12}
          duration={spec.duration ?? 6}
          delay={spec.delay ?? 0}
          spin={spec.spin ?? 0}
        />
      ))}
    </>
  );
}

function Ring({ dashed = false }: { dashed?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={dashed ? "7 8" : undefined}
      />
    </svg>
  );
}

function Triangle() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      <path d="M50 8 92 88H8L50 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Square() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      <rect x="12" y="12" width="76" height="76" rx="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" aria-hidden>
      <path d="M20 5v30M5 20h30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Dots() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <circle cx="42" cy="18" r="5" />
      <circle cx="18" cy="44" r="3" />
      <circle cx="50" cy="46" r="4" />
    </svg>
  );
}
