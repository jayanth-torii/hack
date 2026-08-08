"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { Roadmap } from "@/types/roadmap";
import { ProgressBadge, type NodeState } from "@/components/ui/ProgressBadge";
import { Badge } from "@/components/ui/Badge";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";
import { useUpdateProgress } from "@/hooks/useRoadmapQuery";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";

const DIFFICULTY_STYLE: Record<Roadmap["stages"][number]["difficulty"], string> = {
  beginner: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  intermediate: "border-brand-400/30 bg-brand-400/10 text-brand-300",
  advanced: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

const DIFFICULTY_BAR: Record<Roadmap["stages"][number]["difficulty"], string> = {
  beginner: "from-emerald-400/80 to-emerald-400/40",
  intermediate: "from-brand-400/80 to-brand-400/40",
  advanced: "from-violet-400/80 to-violet-400/40",
};

/**
 * Creative progress overview: a hero band with an animated progress ring,
 * stat cards, per-difficulty completion bars, and a glowing stage list with
 * the mark-complete action that unlocks the next checkpoint. Reuses
 * useUnlockLogic (same source of truth as the journey and 3D view) so the
 * unlock state can never drift between screens.
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
    <div className="relative overflow-hidden pb-28 pt-28">
      <GeometryShapes variant="features" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* ── Hero band ── */}
        <motion.section
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center"
        >
          <div className="max-w-2xl relative">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/progress_2.png" alt="" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-accent/10" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
                {"// Progress dashboard"}
              </p>
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-paper sm:text-5xl">
              {roadmap.topic}
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              {completedCount} of {stages.length} checkpoints completed. Complete each
              stage to unlock the next one — one small win at a time.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/roadmap/${roadmap.id}`}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold tracking-tight text-on-accent shadow-lg shadow-accent/25 transition-colors hover:bg-accent/90"
              >
                Continue journey
              </Link>
              <Link
                href={`/roadmap/${roadmap.id}/calendar`}
                className="rounded-full border border-line/15 px-5 py-2.5 text-sm font-medium text-subtle transition-colors hover:border-accent/50 hover:text-accent"
              >
                Study calendar
              </Link>
            </div>
          </div>

          {/* Progress ring */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative flex flex-none flex-col items-center gap-8 xl:flex-row xl:gap-12"
          >
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke="url(#dash-ring)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={reduce ? { strokeDashoffset: CIRC - (CIRC * pct) / 100 } : { strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC - (CIRC * pct) / 100 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="dash-ring" x1="0" y1="0" x2="1" y2="1">
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

            <Illustration
              name="progress-overview"
              className="hidden h-40 w-72 xl:block"
              imgClassName="object-contain p-1"
              glow
            />
          </motion.div>
        </motion.section>

        {/* ── Stat cards ── */}
        <dl className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { value: completedCount, label: "Completed", tone: "text-emerald-300" },
            { value: activeCount, label: "In progress", tone: "text-accent" },
            { value: lockedCount, label: "Locked", tone: "text-muted" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-line/10 bg-card/50 p-5 backdrop-blur"
            >
              <dd className={clsx("font-display text-3xl font-semibold", stat.tone)}>{stat.value}</dd>
              <dt className="mt-1 text-xs text-muted">{stat.label}</dt>
            </motion.div>
          ))}
        </dl>

        {/* ── Difficulty breakdown ── */}
        {byDifficulty.length > 0 && (
          <section className="mt-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Completion by difficulty
            </p>
            <div className="mt-4 space-y-4">
              {byDifficulty.map((g, i) => (
                <div key={g.difficulty} className="flex items-center gap-4">
                  <span
                    className={clsx(
                      "w-24 flex-none rounded-full border px-2.5 py-1 text-center text-[11px] font-medium capitalize",
                      DIFFICULTY_STYLE[g.difficulty]
                    )}
                  >
                    {g.difficulty}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/60">
                    <motion.div
                      className={clsx("h-full rounded-full bg-gradient-to-r", DIFFICULTY_BAR[g.difficulty])}
                      initial={reduce ? { width: `${g.pct}%` } : { width: 0 }}
                      animate={{ width: `${g.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="w-14 flex-none text-right text-xs text-muted">
                    {g.done}/{g.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stage list ── */}
        <section className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
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
                    "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur transition-all sm:flex-row sm:items-center sm:justify-between",
                    state === "completed"
                      ? "border-emerald-400/25"
                      : state === "active"
                        ? "border-accent/40 shadow-lg shadow-accent/10"
                        : "border-line/10 opacity-80"
                  )}
                >
                  {state === "active" && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
                    />
                  )}

                  <div className="flex min-w-0 items-center gap-4">
                    {/* stage number node */}
                    <span
                      className={clsx(
                        "flex h-10 w-10 flex-none items-center justify-center rounded-2xl text-sm font-bold",
                        state === "completed" && "bg-emerald-400/15 text-emerald-300",
                        state === "active" && "bg-accent/15 text-accent",
                        state === "locked" && "bg-line/5 text-muted"
                      )}
                    >
                      {state === "completed" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        stage.order + 1
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={clsx("truncate text-sm font-semibold", state === "locked" ? "text-subtle" : "text-paper")}>
                          {stage.title}
                        </p>
                        <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", DIFFICULTY_STYLE[stage.difficulty])}>
                          {stage.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Stage {stage.order + 1} · {stage.type} · ~{stage.estimatedDays}d
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-none items-center justify-end gap-2">
                    {state === "completed" && <ProgressBadge state={state} />}
                    {state === "active" && (
                      <button
                        type="button"
                        disabled={updateProgress.isPending}
                        onClick={() => updateProgress.mutate({ roadmapId: roadmap.id, stageId: stage.id })}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-on-accent shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 disabled:opacity-60"
                      >
                        {updateProgress.isPending ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        Mark complete
                      </button>
                    )}
                    {state === "locked" && <Badge tone="neutral">Locked</Badge>}
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
