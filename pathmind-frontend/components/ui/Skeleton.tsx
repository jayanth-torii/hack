"use client";

import { clsx } from "@/lib/clsx";

/**
 * Loading placeholders.
 *
 * These replace the app's previous "Loading roadmap…" text and bare centred
 * spinners. Each skeleton mirrors the dimensions of the content it stands in
 * for, so the arriving data causes no layout shift — a skeleton that doesn't
 * match its final layout is worse than a spinner.
 *
 * The whole block is wrapped in a polite live region with an accessible
 * "Loading" label, so screen-reader users aren't left listening to silence.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("skeleton rounded-sm", className)} />;
}

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Journey screen: hero band + progress ring + timeline checkpoints. */
export function RoadmapSkeleton() {
  return (
    <Shell label="Loading your roadmap">
      <div className="pt-app-bar pb-nav mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pt-10">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-4 h-10 w-full max-w-md sm:h-12" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-lg" />

          <div className="mt-7 flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>

          <div className="mt-8 flex items-center gap-5">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          </div>
        </div>

        <div className="mt-14 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-line/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-4 aspect-video w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Library grid: responsive roadmap cards. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Shell label="Loading your saved roadmaps">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-md border border-line/10 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-3 h-3 w-1/2" />
            <Skeleton className="mt-4 h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Dashboard / calendar: stat tiles above a content block. */
export function DashboardSkeleton() {
  return (
    <Shell label="Loading your progress">
      <div className="pt-app-bar pb-nav mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pt-10">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-4 h-9 w-64" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-line/10 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>
    </Shell>
  );
}
