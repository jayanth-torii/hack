"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Roadmap, UserProgress } from "@/types";
import { useRoadmapStore } from "@/store/roadmapStore";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";
import { NodeCard } from "@/components/ui/NodeCard";
import { VideoPreview, isVideoUrl } from "@/components/ui/VideoPreview";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";

interface RoadmapJourneyProps {
  roadmap: Roadmap;
  progress?: UserProgress;
}

/**
 * Creative journey view: a cinematic hero band (topic, progress ring,
 * difficulty breakdown) above a glowing spine timeline where checkpoints
 * alternate left/right. Each stage renders the full NodeCard — the same
 * component the 3D view and dashboard use, so content never drifts.
 *
 * Motion: framer-motion whileInView reveals per checkpoint (spine draws
 * via scaleY, nodes pop in with a ring pulse); hero ring animates on mount.
 * Reduced-motion users get static-but-ordered layout.
 */
export function RoadmapJourney({ roadmap, progress }: RoadmapJourneyProps) {
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setProgress = useRoadmapStore((s) => s.setProgress);
  const reduce = useReducedMotion();
  const { isUnlocked, isCompleted } = useUnlockLogic();

  useEffect(() => {
    setRoadmap(roadmap);
  }, [roadmap, setRoadmap]);

  useEffect(() => {
    if (progress) setProgress(progress);
  }, [progress, setProgress]);

  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);
  const completedCount = stages.filter((s) => isCompleted(s.id)).length;
  const activeIndex = stages.findIndex((s) => isUnlocked(s.id) && !isCompleted(s.id));
  const pct = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  const difficultyCounts = stages.reduce<Record<string, number>>((acc, s) => {
    acc[s.difficulty] = (acc[s.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  // SVG ring — circumference for r=52
  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="relative overflow-hidden bg-ink pb-16 pt-6 sm:pt-10">
      {/* Ambient glows + noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_36rem_at_15%_-10%,rgba(201,243,29,0.12),transparent_60%),radial-gradient(44rem_32rem_at_100%_10%,rgba(56,189,248,0.1),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />
      <GeometryShapes variant="hero" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Hero band ── */}
        <motion.section
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/roadmap_2.png" alt="" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-accent/10" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
                {"// Your learning path"}
              </p>
            </div>
            <h1 className="mt-3 font-display text-[1.75rem] font-semibold leading-[1.14] tracking-tight text-paper sm:text-4xl lg:text-5xl">
              {roadmap.topic}
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              {stages.length} difficulty-sequenced checkpoints — complete each one to
              unlock the next. Freshness-verified resources and a day-by-day plan
              built in.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2 sm:gap-3">
              {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-line/12 bg-card/50 px-3 py-1.5 text-xs font-medium text-subtle backdrop-blur"
                >
                  {difficultyCounts[d] ?? 0} {d}
                </span>
              ))}
              {/* Hidden on phones: these two destinations live in the bottom
                  navigation there, so repeating them is redundant chrome. */}
              <div className="hidden gap-3 md:flex">
                <Link
                  href={`/roadmap/${roadmap.id}/dashboard`}
                  className="press inline-flex min-h-touch items-center rounded-full bg-accent px-5 text-sm font-bold tracking-tight text-on-accent shadow-e2 transition-colors duration-fast hover:bg-accent-hover"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/roadmap/${roadmap.id}/calendar`}
                  className="press inline-flex min-h-touch items-center rounded-full border border-line/15 px-5 text-sm font-medium text-subtle transition-colors duration-fast hover:border-accent/50 hover:text-accent"
                >
                  Calendar
                </Link>
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative flex w-full flex-col items-center gap-6 md:w-auto md:flex-none xl:flex-row xl:gap-12"
          >
            <div className="relative h-28 w-28 sm:h-36 sm:w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="url(#journey-ring)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={reduce ? { strokeDashoffset: CIRC - (CIRC * pct) / 100 } : { strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC - (CIRC * pct) / 100 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="journey-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c9f31d" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-semibold text-paper">{pct}%</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                  complete
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              {completedCount} of {stages.length} checkpoints
            </p>

            <Illustration
              name="adventure-map"
              className="hidden h-40 w-72 xl:block"
              imgClassName="object-contain p-1"
              glow
            />
          </motion.div>
        </motion.section>

        {/* ── Glowing path timeline ── */}
        <section className="relative mt-14 sm:mt-20">
          {/* spine */}
          <motion.div
            aria-hidden
            initial={reduce ? undefined : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute left-3 top-0 h-full w-px origin-top bg-gradient-to-b from-accent via-brand-400/60 to-transparent sm:left-5 md:left-1/2"
          />
          {/* spine glow */}
          <div
            aria-hidden
            className="absolute left-3 top-0 h-full w-px -translate-x-1/2 blur-[2px] sm:left-5 md:left-1/2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(201,243,29,0.6), rgba(56,189,248,0.3), transparent)",
            }}
          />

          <ol className="space-y-8 sm:space-y-10">
            {stages.map((stage, i) => {
              const state = isCompleted(stage.id)
                ? "completed"
                : isUnlocked(stage.id)
                  ? "active"
                  : "locked";
              const even = i % 2 === 0;
              const isActive = i === activeIndex;
              // Prefer real video URLs regardless of their stored type label —
              // some "playlist" entries are actually article links (e.g.
              // freeCodeCamp), and the actual YouTube links may be typed "doc".
              const videoResource =
                stage.resources.find((r) => isVideoUrl(r.url)) ?? null;

              return (
                <motion.li
                  key={stage.id}
                  initial={reduce ? undefined : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
                  className="relative md:grid md:grid-cols-2 md:gap-10 lg:gap-16"
                >
                  {/* node marker */}
                  <div className="absolute left-3 top-6 z-10 -translate-x-1/2 sm:left-5 md:left-1/2">
                    <span className="relative block h-4 w-4">
                      {isActive && !reduce && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-accent/50" />
                      )}
                      <span
                        className={clsx(
                          "absolute inset-0 rounded-full border-2",
                          state === "completed" && "border-emerald-400 bg-emerald-400",
                          state === "active" && "border-accent bg-ink shadow-[0_0_12px_rgba(201,243,29,0.7)]",
                          state === "locked" && "border-line/30 bg-ink"
                        )}
                      />
                      {state === "completed" && (
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-on-accent">
                          ✓
                        </span>
                      )}
                    </span>
                  </div>

                  {/* card side */}
                  <div
                    className={clsx(
                      "pl-8 sm:pl-12 md:pl-0",
                      even ? "md:col-start-1 md:pr-3" : "md:col-start-2 md:pl-3"
                    )}
                  >
                    <NodeCard stage={stage} state={state} roadmapId={roadmap.id} topic={roadmap.topic} />
                  </div>

                  {/* opposite column: video preview on the alternate side */}
                  <div
                    className={clsx(
                      "pl-8 pt-3 sm:pl-12 md:flex md:items-center md:pl-0 md:pt-0",
                      even ? "md:col-start-2 md:pl-3" : "md:col-start-1 md:row-start-1 md:pr-3"
                    )}
                  >
                    {videoResource ? (
                      <VideoPreview
                        url={videoResource.url}
                        title={videoResource.title}
                        type={videoResource.type}
                        verified={videoResource.verified}
                        className="md:rounded-lg"
                      />
                    ) : (
                      <div aria-hidden className="hidden md:block" />
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
