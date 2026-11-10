"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { Difficulty, Roadmap } from "@/types/roadmap";
import { Button } from "@/components/ui/Button";
import { ProgressBadge, type NodeState } from "@/components/ui/ProgressBadge";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";
import { useUpdateProgress } from "@/hooks/useRoadmapQuery";
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Difficulty is an **ordered scale**, so it gets an ordered role ramp rather
 * than three unrelated hues: tertiary → secondary → primary, rising towards
 * the brand colour as the work gets harder. Each step is a real M3 container
 * pair, so the text contrast is guaranteed by the palette. The word itself is
 * always on the chip, so the ramp is reinforcement, never the only signal.
 */
const DIFFICULTY_CHIP: Record<Difficulty, string> = {
  beginner: "bg-md-tertiary-container text-md-on-tertiary-container",
  intermediate: "bg-md-secondary-container text-md-on-secondary-container",
  advanced: "bg-md-primary-container text-md-on-primary-container",
};

const DIFFICULTY_BAR: Record<Difficulty, string> = {
  beginner: "bg-md-tertiary",
  intermediate: "bg-md-secondary",
  advanced: "bg-md-primary",
};

/**
 * Progress overview: a hero band with a circular progress indicator, stat
 * cards, per-difficulty completion bars, and a stage list carrying the
 * mark-complete action that unlocks the next checkpoint. Reuses
 * useUnlockLogic (same source of truth as the journey and 3D view) so the
 * unlock state can never drift between screens.
 *
 * Material 3: tone carries hierarchy. Stage cards are filled surfaces whose
 * container step rises with their state, progress is `md-primary` on a
 * `md-surface-container-highest` track, and nothing is tinted with a raw hue.
 */
export function ProgressDashboard({ roadmap }: { roadmap: Roadmap }) {
  const { isUnlocked, isCompleted } = useUnlockLogic();
  const updateProgress = useUpdateProgress();
  const reduce = useReducedMotion();
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);

  const completedCount = stages.filter((s) => isCompleted(s.id)).length;
  const activeCount = stages.filter((s) => isUnlocked(s.id) && !isCompleted(s.id)).length;
  const lockedCount = stages.length - completedCount - activeCount;
  const pct = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  const byDifficulty = (["beginner", "intermediate", "advanced"] as const)
    .map((d) => {
      const group = stages.filter((s) => s.difficulty === d);
      const done = group.filter((s) => isCompleted(s.id)).length;
      return {
        difficulty: d,
        total: group.length,
        done,
        pct: group.length > 0 ? Math.round((done / group.length) * 100) : 0,
      };
    })
    .filter((g) => g.total > 0);

  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    // The app bar is fixed and the bottom nav covers the last 80px on phones,
    // so the screen pays both back here — matching DashboardSkeleton, which
    // already did, so nothing shifts when the data lands.
    <div className="pt-app-bar pb-nav relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-10">
        {/* ── Hero band ── */}
        <motion.section
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center"
        >
          <div className="relative w-full min-w-0 max-w-2xl">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/progress_2.png"
                alt=""
                className="h-10 w-10 rounded-md object-cover"
              />
              <Eyebrow>Progress dashboard</Eyebrow>
            </div>
            <h1 className="mt-3 break-words text-headline-md text-md-on-surface sm:text-display-sm">
              {roadmap.topic}
            </h1>
            <p className="mt-4 max-w-xl text-body-lg text-md-on-surface-variant">
              {completedCount} of {stages.length} checkpoints completed. Complete each
              stage to unlock the next one — one small win at a time.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {/* The one filled action on this screen. */}
              <Link
                href={`/roadmap/${roadmap.id}`}
                className="state-layer press inline-flex min-h-touch items-center rounded-full bg-md-primary px-6 text-label-lg font-medium text-md-on-primary transition-colors duration-fast ease-standard"
              >
                Continue journey
              </Link>
              <Link
                href={`/roadmap/${roadmap.id}/calendar`}
                className="state-layer press inline-flex min-h-touch items-center rounded-full border border-md-outline px-6 text-label-lg font-medium text-md-on-surface transition-colors duration-fast ease-standard"
              >
                Study calendar
              </Link>
            </div>
          </div>

          {/* Circular progress — M3: primary indicator on a
              surface-container-highest track. */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative flex flex-none flex-col items-center gap-8 xl:flex-row xl:gap-12"
          >
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="rgb(var(--md-surface-container-highest))"
                  strokeWidth="9"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="rgb(var(--md-primary))"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={reduce ? { strokeDashoffset: CIRC - (CIRC * pct) / 100 } : { strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC - (CIRC * pct) / 100 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-headline-md text-md-on-surface">{pct}%</span>
                <span className="text-label-sm uppercase tracking-[0.2em] text-md-on-surface-variant">
                  complete
                </span>
              </div>
            </div>

            <Illustration
              name="progress-overview"
              className="hidden h-40 w-72 xl:block"
              imgClassName="object-contain p-1"
              glow
            />
          </motion.div>
        </motion.section>

        {/* ── Stat cards ── */}
        <dl className="mt-10 grid grid-cols-3 gap-2.5 sm:mt-12 sm:gap-4">
          {[
            { value: completedCount, label: "Completed", tone: "text-md-success" },
            { value: activeCount, label: "In progress", tone: "text-md-primary" },
            { value: lockedCount, label: "Locked", tone: "text-md-on-surface-variant" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.5 }}
              className="rounded-md border border-md-outline-variant bg-md-surface-container-low p-3.5 sm:p-5"
            >
              <dd className={clsx("text-headline-sm tabular-nums sm:text-headline-md", stat.tone)}>
                {stat.value}
              </dd>
              {/* The number is read with its label, so the colour is a
                  reinforcement of the state and never the only cue. */}
              <dt className="mt-1 text-body-sm leading-tight text-md-on-surface-variant">
                {stat.label}
              </dt>
            </motion.div>
          ))}
        </dl>

        {/* ── Difficulty breakdown ── */}
        {byDifficulty.length > 0 && (
          <section className="mt-12">
            <p className="text-label-md uppercase tracking-[0.2em] text-md-on-surface-variant">
              Completion by difficulty
            </p>
            <div className="mt-4 space-y-4">
              {byDifficulty.map((g, i) => (
                <div key={g.difficulty} className="flex items-center gap-4">
                  <span
                    className={clsx(
                      "flex h-8 w-24 flex-none items-center justify-center rounded-sm text-label-lg capitalize",
                      DIFFICULTY_CHIP[g.difficulty]
                    )}
                  >
                    {g.difficulty}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-md-surface-container-highest">
                    <motion.div
                      className={clsx("h-full rounded-full", DIFFICULTY_BAR[g.difficulty])}
                      initial={reduce ? { width: `${g.pct}%` } : { width: 0 }}
                      animate={{ width: `${g.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="w-14 flex-none text-right text-body-sm tabular-nums text-md-on-surface-variant">
                    {g.done}/{g.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stage list ── */}
        <section className="mt-14">
          <p className="text-label-md uppercase tracking-[0.2em] text-md-on-surface-variant">
            Checkpoints
          </p>
          <ul className="mt-4 space-y-3">
            {stages.map((stage, i) => {
              const state: NodeState = isCompleted(stage.id)
                ? "completed"
                : isUnlocked(stage.id)
                  ? "active"
                  : "locked";

              return (
                <motion.li
                  key={stage.id}
                  initial={reduce ? undefined : { opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-5% 0px" }}
                  transition={{ duration: 0.45, delay: i * 0.04 }}
                  className={clsx(
                    "relative flex flex-col gap-4 overflow-hidden rounded-lg border p-5 transition-colors duration-base ease-standard sm:flex-row sm:items-center sm:justify-between",
                    state === "active"
                      ? "border-md-primary bg-md-surface-container-highest"
                      : state === "completed"
                        ? "border-md-outline-variant bg-md-surface-container"
                        : "border-md-outline-variant bg-md-surface"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* stage number node */}
                    <span
                      className={clsx(
                        "flex h-10 w-10 flex-none items-center justify-center rounded-md text-title-md",
                        state === "completed" && "bg-md-success-container text-md-on-success-container",
                        state === "active" && "bg-md-primary text-md-on-primary",
                        state === "locked" && "bg-md-surface-container-highest text-md-on-surface-variant"
                      )}
                    >
                      {state === "completed" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        stage.order + 1
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Phones get the whole checkpoint name on two lines;
                            truncation only kicks in from `sm`, where the row
                            turns horizontal and the title shares the line. */}
                        <p
                          className={clsx(
                            "min-w-0 break-words text-title-md font-medium sm:truncate",
                            state === "locked" ? "text-md-on-surface-variant" : "text-md-on-surface"
                          )}
                        >
                          {stage.title}
                        </p>
                        <span
                          className={clsx(
                            "inline-flex h-6 items-center rounded-xs px-2 text-label-sm capitalize",
                            DIFFICULTY_CHIP[stage.difficulty]
                          )}
                        >
                          {stage.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-body-sm text-md-on-surface-variant">
                        Stage {stage.order + 1} · {stage.type} · ~{stage.estimatedDays}d
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-none items-center justify-end gap-2">
                    {state !== "active" && <ProgressBadge state={state} />}
                    {state === "active" && (
                      <Button
                        variant="accent"
                        size="sm"
                        isLoading={updateProgress.isPending}
                        onClick={() => updateProgress.mutate({ roadmapId: roadmap.id, stageId: stage.id })}
                      >
                        {!updateProgress.isPending && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        Mark complete
                      </Button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
