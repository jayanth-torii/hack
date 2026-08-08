"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Stage } from "@/types/roadmap";
import type { NodeState } from "./ProgressBadge";
import { ProgressBadge } from "./ProgressBadge";
import { FreshnessBadge } from "./FreshnessBadge";
import { PracticeBadge } from "./PracticeBadge";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { CalendarExportButton } from "./CalendarExportButton";
import { useUpdateProgress } from "@/hooks/useRoadmapQuery";
import { clsx } from "@/lib/clsx";

interface NodeCardProps {
  stage: Stage;
  state: NodeState;
  roadmapId: string;
  topic: string;
  /** Compact mode is used inside the 3D <Html> panel; full mode on MobileTimeline/dashboard. */
  compact?: boolean;
}

const DIFFICULTY_LABEL: Record<Stage["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_STYLE: Record<Stage["difficulty"], string> = {
  beginner: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  intermediate: "border-brand-400/30 bg-brand-400/10 text-brand-300",
  advanced: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

const TYPE_ICON: Record<Stage["type"], ReactNode> = {
  learn: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6.5C4 5.7 4.7 5 5.5 5H10l2 2h6.5c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13c-.8 0-1.5-.7-1.5-1.5v-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  practice: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 4 7v6c0 4.6 3.2 7.6 8 8 4.8-.4 8-3.4 8-8V7l-8-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * The per-stage detail panel: syllabus + free resources + certifications +
 * practice links + a timeline slice, plus the mark-complete action that
 * drives server-enforced unlock progression. Used both inside the 3D <Html>
 * overlay (Node.tsx) and by MobileTimeline/ProgressDashboard — one component,
 * two mount points, so content is always identical.
 *
 * Restyled for the Vidhyora dark/light theme: glass card, glowing node
 * header, video resources embed inline as lazy iframe previews.
 */
export function NodeCard({ stage, state, roadmapId, topic, compact }: NodeCardProps) {
  const updateProgress = useUpdateProgress();
  const locked = state === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative overflow-hidden rounded-3xl border bg-card/70 shadow-xl shadow-black/30 backdrop-blur-xl",
        locked
          ? "border-line/8 opacity-80"
          : state === "completed"
            ? "border-emerald-400/25 shadow-emerald-400/5"
            : "border-line/12 hover:border-accent/35 hover:shadow-accent/5",
        compact ? "w-80" : "w-full"
      )}
    >
      {/* top accent shine */}
      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
          state === "completed"
            ? "via-emerald-400/60"
            : state === "active"
              ? "via-accent/70"
              : "via-line/20"
        )}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
                state === "completed"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : state === "active"
                    ? "bg-accent/15 text-accent"
                    : "bg-line/5 text-muted"
              )}
            >
              {state === "completed" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-[11px] font-bold">{stage.order + 1}</span>
              )}
            </span>
            <ProgressBadge state={state} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted sm:flex">
              {TYPE_ICON[stage.type]}
              {stage.type}
            </span>
            <Badge tone="neutral" className={DIFFICULTY_STYLE[stage.difficulty]}>
              {DIFFICULTY_LABEL[stage.difficulty]}
            </Badge>
          </div>
        </div>

        <h3
          className={clsx(
            "font-display text-lg font-semibold tracking-tight",
            locked ? "text-subtle" : "text-paper"
          )}
        >
          {stage.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          ~{stage.estimatedDays} day{stage.estimatedDays === 1 ? "" : "s"} at 1hr/day
        </p>

        {locked ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line/10 bg-ink/40 px-4 py-3.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line/15 text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-sm text-muted">
              Complete the previous stage to unlock this checkpoint.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-sm">
            <Section title="Syllabus">
              <ul className="space-y-1.5">
                {stage.syllabus.map((item, i) => (
                  <li key={item} className="flex items-start gap-2.5 text-subtle">
                    <span
                      className={clsx(
                        "mt-[7px] h-1 w-1 flex-none rounded-full",
                        state === "completed" ? "bg-emerald-400/70" : "bg-accent/60"
                      )}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {stage.resources.length > 0 && (
              <Section title="Free resources">
                <ul className="space-y-3">
                  {stage.resources.map((r) => (
                    <li key={r.url}>
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-line/10 bg-ink/30 px-3.5 py-2.5 transition-colors hover:border-accent/30">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 flex-1 truncate font-medium text-accent-text transition-colors hover:text-accent"
                        >
                          {r.title}
                        </a>
                        <FreshnessBadge lastVerifiedAt={r.lastVerifiedAt} verified={r.verified} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {stage.certifications.length > 0 && (
              <Section title="Paid certifications">
                <ul className="space-y-2">
                  {stage.certifications
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((c) => (
                      <li
                        key={c.url}
                        className="flex items-center justify-between gap-2 rounded-xl border border-line/10 bg-ink/30 px-3.5 py-2.5 transition-colors hover:border-accent/30"
                      >
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 truncate font-medium text-accent-text hover:text-accent"
                        >
                          #{c.rank} {c.title}
                        </a>
                        <span className="whitespace-nowrap rounded-full border border-line/15 px-2.5 py-0.5 text-[11px] font-medium text-subtle">
                          {c.price ? `$${c.price}` : "Free"}
                        </span>
                      </li>
                    ))}
                </ul>
              </Section>
            )}

            {stage.practiceLinks.length > 0 && (
              <Section title="Practice arena">
                <ul className="space-y-2">
                  {stage.practiceLinks.map((p) => (
                    <li
                      key={p.url}
                      className="flex items-center justify-between gap-2 rounded-xl border border-line/10 bg-ink/30 px-3.5 py-2.5 transition-colors hover:border-accent/30"
                    >
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate font-medium text-accent-text hover:text-accent"
                      >
                        {p.title}
                      </a>
                      <div className="flex flex-none items-center gap-1.5">
                        {!p.verified && (
                          <FreshnessBadge lastVerifiedAt={new Date().toISOString()} verified={false} />
                        )}
                        <PracticeBadge platform={p.platform} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {!compact && (
              <Section title="Send this plan to your calendar">
                <CalendarExportButton roadmapId={roadmapId} topic={topic} />
              </Section>
            )}

            {state !== "completed" && (
              <Button
                variant="accent"
                className="w-full rounded-full"
                isLoading={updateProgress.isPending}
                onClick={() => updateProgress.mutate({ roadmapId, stageId: stage.id })}
              >
                Mark stage complete
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        {title}
      </h4>
      {children}
    </div>
  );
}
