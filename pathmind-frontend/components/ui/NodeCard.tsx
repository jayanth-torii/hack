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

// Difficulty is a scale, not a status, so it borrows three *distinct* M3
// container pairs rather than three tints of one hue — and every chip still
// spells the level out, so the colour is never the only cue.
const DIFFICULTY_STYLE: Record<Stage["difficulty"], string> = {
  beginner: "border-transparent bg-md-success-container text-md-on-success-container",
  intermediate: "border-transparent bg-md-info-container text-md-on-info-container",
  advanced: "border-transparent bg-md-tertiary-container text-md-on-tertiary-container",
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
 * Material 3: an elevated card at level 1, state expressed through tonal
 * container/on-container pairs rather than tinted hues, and every chip and
 * row sitting on a real surface step instead of a translucent glass panel.
 */
export function NodeCard({ stage, state, roadmapId, topic, compact }: NodeCardProps) {
  const updateProgress = useUpdateProgress();
  const locked = state === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        // M3 elevated card: a tonal step up from the page plus level 1. This
        // one earns its elevation — it floats over the 3D scene as an <Html>
        // overlay — but level 1, not the level 3 drop shadow it used to carry.
        "relative overflow-hidden rounded-md border bg-md-surface-container-low shadow-e1",
        locked
          ? "border-md-outline-variant opacity-80"
          : state === "completed"
            ? "border-md-success/40"
            : "border-md-outline-variant",
        compact ? "w-80" : "w-full"
      )}
    >
      {/* top accent shine */}
      <div
        aria-hidden
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
          state === "completed"
            ? "via-md-success/60"
            : state === "active"
              ? "via-md-primary/70"
              : "via-md-outline-variant"
        )}
      />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "flex h-8 w-8 flex-none items-center justify-center rounded-sm text-label-lg",
                state === "completed"
                  ? "bg-md-success-container text-md-on-success-container"
                  : state === "active"
                    ? "bg-md-primary-container text-md-on-primary-container"
                    : "bg-md-surface-container-highest text-md-on-surface-variant"
              )}
            >
              {state === "completed" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="tabular-nums">{stage.order + 1}</span>
              )}
            </span>
            <ProgressBadge state={state} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1 text-label-sm uppercase tracking-[0.15em] text-md-on-surface-variant sm:flex">
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
            "text-title-lg",
            locked ? "text-md-on-surface-variant" : "text-md-on-surface"
          )}
        >
          {stage.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-md-on-surface-variant">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          ~{stage.estimatedDays} day{stage.estimatedDays === 1 ? "" : "s"} at 1hr/day
        </p>

        {locked ? (
          <div className="mt-5 flex items-center gap-3 rounded-sm border border-md-outline-variant bg-md-surface-container px-4 py-3.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-md-outline text-md-on-surface-variant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-body-md text-md-on-surface-variant">
              Complete the previous stage to unlock this checkpoint.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5 text-body-md">
            <Section title="Syllabus">
              <ul className="space-y-1.5">
                {stage.syllabus.map((item, i) => (
                  <li key={item} className="flex items-start gap-2.5 text-md-on-surface-variant">
                    <span
                      className={clsx(
                        "mt-[7px] h-1 w-1 flex-none rounded-full",
                        state === "completed" ? "bg-md-success" : "bg-md-primary"
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
                      <div className="flex min-h-touch items-center justify-between gap-2 rounded-sm border border-md-outline-variant bg-md-surface-container px-3.5 py-2.5 transition-colors duration-fast hover:border-md-primary">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 flex-1 truncate text-label-lg text-md-primary underline-offset-4 hover:underline"
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
                        className="flex min-h-touch items-center justify-between gap-2 rounded-sm border border-md-outline-variant bg-md-surface-container px-3.5 py-2.5 transition-colors duration-fast hover:border-md-primary"
                      >
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 truncate text-label-lg text-md-primary underline-offset-4 hover:underline"
                        >
                          #{c.rank} {c.title}
                        </a>
                        <span className="whitespace-nowrap rounded-sm border border-md-outline-variant px-2.5 py-1 text-label-md text-md-on-surface-variant">
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
                      className="flex min-h-touch items-center justify-between gap-2 rounded-sm border border-md-outline-variant bg-md-surface-container px-3.5 py-2.5 transition-colors duration-fast hover:border-md-primary"
                    >
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-label-lg text-md-primary underline-offset-4 hover:underline"
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
      <h4 className="mb-2 text-label-md uppercase tracking-[0.2em] text-md-on-surface-variant">
        {title}
      </h4>
      {children}
    </div>
  );
}
