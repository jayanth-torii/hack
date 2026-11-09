"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Roadmap } from "@/types/roadmap";
import type { RoadmapProgressSummary } from "@/types/profile";
import { ArrowRightIcon, ClockIcon, LayersIcon } from "./ProfileIcons";

interface RoadmapProgressListProps {
  roadmaps: Roadmap[];
  summary: RoadmapProgressSummary[];
  isPending?: boolean;
}

/**
 * Saved roadmaps with their completion bar.
 *
 * Shared by the profile's "Continue learning" block and its Roadmaps tab so
 * the two cannot drift apart — they previously rendered the same thing twice
 * from different code.
 */
export function RoadmapProgressList({
  roadmaps,
  summary,
  isPending = false,
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

  if (roadmaps.length === 0) {
    return (
      <div className="rounded-md border border-line/12 bg-ink/40 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-paper">No roadmaps yet</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Generate one from any topic and it will show up here with your progress.
        </p>
        <Link
          href="/"
          className="press mt-4 inline-flex min-h-touch items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover"
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
              className="group block rounded-md border border-line/12 bg-ink/40 p-4 transition-colors duration-fast hover:border-accent/40 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-bold text-paper group-hover:text-accent-text sm:text-lg">
                    {roadmap.topic}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
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
                <span className="shrink-0 font-display text-base font-bold tabular-nums text-accent">
                  {percent}%
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line/12">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-hover to-accent"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
