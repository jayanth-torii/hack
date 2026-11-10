"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

// Acjon fun-fact strip (index.html "funfact area end") reimagined with
// count-up numbers in the display font. Counters animate once when scrolled
// into view; reduced-motion users get the final value immediately.

const STATS = [
  { to: 7, suffix: "+", label: "stages per roadmap, on average" },
  { to: 3, suffix: "", label: "difficulty tiers, beginner → advanced" },
  { to: 24, suffix: "h", label: "freshness check cycle for links" },
  { to: 0, suffix: "", label: "AI-invented practice-link URLs" },
];

export function StatsSection() {
  return (
    <section
      id="stats"
      className="border-y border-md-outline-variant/60 bg-md-surface py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Eyebrow align="center">Vidhyora in numbers</Eyebrow>
        {/* Each figure gets its own container step so the row reads as four
            cards on a surface rather than four numbers floating in black. */}
        <Reveal stagger={0.1} className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-md-surface-container px-4 py-7 text-center shadow-e1"
            >
              <div className="text-display-md text-md-on-surface md:text-display-lg">
                <Counter to={stat.to} suffix={stat.suffix} />
              </div>
              <p className="mx-auto mt-3 max-w-[13rem] text-body-sm text-md-on-surface-variant">
                {stat.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduceMotion]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
