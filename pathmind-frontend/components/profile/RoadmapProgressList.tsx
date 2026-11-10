"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import type { Roadmap } from "@/types/roadmap";
import type { RoadmapProgressSummary } from "@/types/profile";
import { ArrowRightIcon, ClockIcon, LayersIcon } from "./ProfileIcons";

interface RoadmapProgressListProps {
  roadmaps: Roadmap[];
  summary: RoadmapProgressSummary[];
  isPending?: boolean;
  /** The roadmap query failed — show recovery rather than an empty library. */
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * Saved roadmaps with their completion bar.
 *
 * Shared by the profile's "Continue learning" block and its Roadmaps tab so
 * the two cannot drift apart — they previously rendered the same thing twice
 * from different code.
 *
 * Each row is an M3 filled card. They are the only card layer here: the
 * callers deliberately render this list on a bare section rather than inside
 * another card, because cards must not nest (CLAUDE.md §8).
 */
export function RoadmapProgressList({
  roadmaps,
  summary,
  isPending = false,
  isError = false,
  onRetry,
}: RoadmapProgressListProps) {
  const byId = new Map(summary.map((s) => [s.roadmapId, s]));

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>
    );
  }

  // An error is not an empty library — saying "no roadmaps yet" to someone who
  // has twenty is worse than saying nothing.
  if (isError) {
    return (
      <StateView
        tone="error"
        title="Couldn't load your roadmaps"
        description="The request didn't come back. Nothing has been lost — try again in a moment."
        {...(onRetry ? { primary: { onClick: onRetry, label: "Try again" } } : {})}
      />
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="rounded-lg bg-md-surface-container-highest px-4 py-8 text-center sm:px-6">
        <p className="text-title-md text-md-on-surface">No roadmaps yet</p>
        <p className="mx-auto mt-1 max-w-xs text-body-md text-md-on-surface-variant">
          Generate one from any topic and it will show up here with your progress.
        </p>
        <Link
          href="/"
          className="press state-layer mt-4 inline-flex min-h-touch items-center gap-2 rounded-full bg-md-primary px-5 text-label-lg text-md-on-primary"
        >
          Build your first roadmap
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {roadmaps.map((roadmap) => {
        const stats = byId.get(roadmap.id);
        const percent = stats?.percent ?? 0;
        const status = stats?.isComplete
          ? "Completed"
          : percent > 0
            ? "In progress"
            : "Not started";

        return (
          <li key={roadmap.id}>
            <Link
              href={`/roadmap/${roadmap.id}`}
              className="state-layer group block rounded-lg bg-md-surface-container-highest p-4 text-md-on-surface transition-colors duration-fast ease-standard sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-title-md text-md-on-surface sm:text-title-lg sm:font-medium">
                    {roadmap.topic}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-md-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <LayersIcon className="h-3.5 w-3.5" />
                      {roadmap.stages.length} stages
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {status}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-title-md tabular-nums text-md-primary">
                  {percent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${roadmap.topic} progress`}
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-md-surface-variant"
              >
                <div className="h-full rounded-full bg-md-primary" style={{ width: `${percent}%` }} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
