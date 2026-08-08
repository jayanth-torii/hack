"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { TextReveal } from "./TextReveal";
import { GeometryShapes } from "./GeometryShapes";

// "From curiosity to competence" — a dark journey timeline that matches the
// Vidhyora theme: a glowing lime→cyan spine draws itself with scroll (GSAP
// scrub) while a lime "traveler dot" rides down it; four dark-glass step
// cards each carry their own live progress indicator. Framer-motion handles
// node pops, card entrances and hover lifts. Reduced-motion users get a
// static, fully-visible layout.

const STEPS = [
  {
    n: "01",
    tag: "Step 01",
    title: "Type any topic",
    accent: "text-accent-text",
    accentBg: "bg-accent",
    glow: "shadow-accent/40",
    accentBorder: "border-accent/40",
    copy: "Dynamic Programming, System Design, Sanskrit, Piano — just type what you want to master.",
    percent: 25,
  },
  {
    n: "02",
    tag: "Step 02",
    title: "AI builds your path",
    accent: "text-cyan-text",
    accentBg: "bg-cyan-400",
    glow: "shadow-cyan-400/40",
    accentBorder: "border-cyan-400/40",
    copy: "A syllabus, free resources, certifications, practice problems and a daily timeline — all sequenced by difficulty.",
    percent: 50,
  },
  {
    n: "03",
    tag: "Step 03",
    title: "Learn & unlock",
    accent: "text-accent-text",
    accentBg: "bg-accent",
    glow: "shadow-accent/40",
    accentBorder: "border-accent/40",
    copy: "Finish a stage to unlock the next. Progress is enforced server-side, so it always sticks — no cheating your twin.",
    percent: 75,
  },
  {
    n: "04",
    tag: "Step 04",
    title: "Export & track",
    accent: "text-cyan-text",
    accentBg: "bg-cyan-400",
    glow: "shadow-cyan-400/40",
    accentBorder: "border-cyan-400/40",
    copy: "Push the plan to your calendar, revisit your roadmap, and watch your progress dashboard fill up in real time.",
    percent: 100,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  // GSAP: the spine fill + traveler dot scrub with the scroll position,
  // and each step card slides in from the left as it enters the viewport.
  useIsomorphicLayoutEffect(() => {
    if (reduce) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (fillRef.current) {
        gsap.fromTo(
          fillRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top center",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              end: "bottom 70%",
              scrub: 0.6,
            },
          }
        );
      }
      if (dotRef.current) {
        gsap.fromTo(
          dotRef.current,
          { top: "0%" },
          {
            top: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              end: "bottom 70%",
              scrub: 0.6,
            },
          }
        );
      }
      gsap.utils.toArray<HTMLElement>(".how-card").forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, x: -48, y: 24 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 82%" },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative overflow-hidden bg-ink py-28 text-paper"
    >
      {/* Ambient glow echoing the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_30rem_at_10%_0%,rgba(201,243,29,0.07),transparent_60%),radial-gradient(40rem_28rem_at_95%_100%,rgba(56,189,248,0.06),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.04]" />
      <GeometryShapes variant="how" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
              {"// How it works"}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight md:text-5xl">
              <TextReveal
                lines={["From curiosity to", "competence in four steps"]}
                accentLines={[1]}
              />
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted md:text-base">
              One stage at a time — each step unlocks the next, so your momentum
              compounds and you never feel lost.
            </p>
          </div>
          <a
            href="#start"
            className="group hidden items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-bold tracking-tight text-on-accent transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25 md:inline-flex"
          >
            Start now
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* Journey timeline */}
        <div className="relative mt-16 md:mt-20">
          {/* Spine track */}
          <div
            aria-hidden
            className="absolute bottom-6 left-[21px] top-2 w-[2px] overflow-hidden rounded-full bg-line/10 md:left-[27px]"
          >
            {/* Glowing fill — drawn by GSAP scrub */}
            <div
              ref={fillRef}
              className="absolute inset-0 rounded-full bg-gradient-to-b from-accent via-lime-300 to-cyan-400"
            />
            {/* Traveler dot */}
            <span
              ref={dotRef}
              className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_14px_4px_rgba(184,255,0,0.65)]"
            />
          </div>

          {/* Steps */}
          <ol className="space-y-10 md:space-y-14">
            {STEPS.map((step, i) => (
              <li key={step.n} className="relative pl-14 md:pl-24">
                {/* Node on the spine */}
                <motion.span
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className={`absolute left-0 top-0 flex h-[44px] w-[44px] items-center justify-center rounded-full border border-line/15 bg-card text-sm font-semibold shadow-xl shadow-black/20 md:h-[56px] md:w-[56px] md:text-base ${step.accent}`}
                >
                  <span className="relative font-display">
                    {step.n}
                    <motion.span
                      aria-hidden
                      className={`pointer-events-none absolute inset-0 -m-2 rounded-full border ${step.accentBorder}`}
                      animate={
                        reduce
                          ? undefined
                          : { scale: [1, 1.35], opacity: [0.6, 0] }
                      }
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut",
                      }}
                    />
                  </span>
                </motion.span>

                {/* Dark glass card */}
                <motion.article
                  className="how-card group relative rounded-3xl border border-line/10 bg-card/60 p-6 shadow-xl shadow-black/10 backdrop-blur-md transition-colors duration-500 hover:border-accent/40 hover:bg-card/80 md:p-8"
                  whileHover={reduce ? undefined : { y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                >
                  {/* Ghost number watermark */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-6 right-3 select-none font-display text-7xl font-semibold leading-none text-paper/[0.06] md:text-8xl"
                  >
                    {step.n}
                  </span>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">
                      {step.tag}
                    </span>
                    <span className="h-px w-6 bg-line/15" />
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${step.accentBg} ${step.glow} shadow-lg`}
                    />
                  </div>

                  <h3 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
                    {step.title.split(" ").map((word, w) => {
                      const words = step.title.split(" ");
                      const isAccent = w === words.length - 1;
                      return (
                        <span
                          key={w}
                          className={
                            isAccent
                              ? `bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent`
                              : undefined
                          }
                        >
                          {word}
                          {w < words.length - 1 ? " " : ""}
                        </span>
                      );
                    })}
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                    {step.copy}
                  </p>

                  {/* Per-step progress indicator */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
                      <span>Journey progress</span>
                      <span className={step.accent}>{step.percent}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/10">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r from-accent to-cyan-400`}
                        initial={{ width: "0%" }}
                        whileInView={{ width: `${step.percent}%` }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                      />
                    </div>
                  </div>
                </motion.article>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile CTA */}
        <div className="mt-14 text-center md:hidden">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold tracking-tight text-on-accent"
          >
            Start your journey now →
          </a>
        </div>
      </div>
    </section>
  );
}
