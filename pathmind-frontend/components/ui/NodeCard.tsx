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

/**
 * The per-stage detail panel: syllabus + free resources + certifications +
 * practice links + a timeline slice, plus the mark-complete action that
 * drives server-enforced unlock progression. Used both inside the 3D <Html>
 * overlay (Node.tsx) and by MobileTimeline/ProgressDashboard — one component,
 * two mount points, so content is always identical.
 */
export function NodeCard({ stage, state, roadmapId, topic, compact }: NodeCardProps) {
  const updateProgress = useUpdateProgress();
  const locked = state === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-slate-700/70 bg-surface-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur ${
        compact ? "w-80" : "w-full"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <ProgressBadge state={state} />
        <Badge tone="neutral">{DIFFICULTY_LABEL[stage.difficulty]}</Badge>
      </div>

      <h3 className="text-base font-semibold text-white">{stage.title}</h3>
      <p className="mt-0.5 text-xs text-slate-400">~{stage.estimatedDays} day(s) at 1hr/day</p>

      {locked ? (
        <p className="mt-4 text-sm text-slate-500">
          Complete the previous stage to unlock this checkpoint.
        </p>
      ) : (
        <div className="mt-4 space-y-4 text-sm">
          <Section title="Syllabus">
            <ul className="list-inside list-disc space-y-1 text-slate-300">
              {stage.syllabus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          {stage.resources.length > 0 && (
            <Section title="Free resources">
              <ul className="space-y-2">
                {stage.resources.map((r) => (
                  <li key={r.url} className="flex items-center justify-between gap-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-brand-300 hover:underline"
                    >
                      {r.title}
                    </a>
                    <FreshnessBadge lastVerifiedAt={r.lastVerifiedAt} verified={r.verified} />
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
                    <li key={c.url} className="flex items-center justify-between gap-2">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-brand-300 hover:underline"
                      >
                        #{c.rank} {c.title}
                      </a>
                      <span className="whitespace-nowrap text-xs text-slate-400">
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
                  <li key={p.url} className="flex items-center justify-between gap-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-brand-300 hover:underline"
                    >
                      {p.title}
                    </a>
                    <div className="flex items-center gap-1.5">
                      {!p.verified && <FreshnessBadge lastVerifiedAt={new Date().toISOString()} verified={false} />}
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
              className="w-full"
              isLoading={updateProgress.isPending}
              onClick={() => updateProgress.mutate({ roadmapId, stageId: stage.id })}
            >
              Mark stage complete
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}
