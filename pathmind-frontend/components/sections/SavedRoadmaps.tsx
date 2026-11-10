"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import {
  useProgressSummary,
  useToggleFavorite,
  useUnsaveRoadmap,
} from "@/hooks/useProfileQuery";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Panel } from "@/components/ui/Panel";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatCard } from "@/components/ui/StatCard";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { confirm } from "@/components/ui/ConfirmDialog";
import { clsx } from "@/lib/clsx";
import type { Roadmap } from "@/types/roadmap";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChartIcon,
  CircleIcon,
  ClockIcon,
  CloseIcon,
  CompassIcon,
  GridIcon,
  LayersIcon,
  ListIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/profile/ProfileIcons";

type Filter = "all" | "progress" | "completed" | "favorites";
type SortKey = "recent" | "progress" | "title";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The learning library.
 *
 * Per-card progress comes from `/me/progress-summary` — one request for the
 * whole library rather than one `/roadmaps/:id/progress` per card, which is
 * what the N+1 would otherwise cost. Filters and sorting are client-side
 * because the library is small and already fully loaded.
 */
export function SavedRoadmaps() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  const saved = useSavedRoadmaps();
  const summary = useProgressSummary();
  const toggleFavorite = useToggleFavorite();
  const unsave = useUnsaveRoadmap();

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [layout, setLayout] = useState<"grid" | "list">("list");

  const roadmaps: Roadmap[] = useMemo(() => saved.data ?? [], [saved.data]);
  const statsById = useMemo(
    () => new Map((summary.data ?? []).map((s) => [s.roadmapId, s])),
    [summary.data]
  );

  // When the progress query fails, every `?? 0` below would render a confident
  // 0% for a library that may be nearly finished. Nothing derived from it is
  // shown in that case — the row of em-dashes plus the alert says "unknown",
  // which is the truth.
  const progressFailed = summary.isError;

  const counts = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let favorites = 0;
    for (const roadmap of roadmaps) {
      const s = statsById.get(roadmap.id);
      if (s?.isComplete) completed += 1;
      else if ((s?.completedStages ?? 0) > 0) inProgress += 1;
      if (s?.isFavorite) favorites += 1;
    }
    return { all: roadmaps.length, inProgress, completed, favorites };
  }, [roadmaps, statsById]);

  const totals = useMemo(() => {
    const totalStages = roadmaps.reduce((sum, r) => sum + r.stages.length, 0);
    const completedStages = (summary.data ?? []).reduce((sum, s) => sum + s.completedStages, 0);
    return {
      totalStages,
      completedStages,
      percent: totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100),
    };
  }, [roadmaps, summary.data]);

  const visible = useMemo(() => {
    const filtered = roadmaps.filter((roadmap) => {
      const s = statsById.get(roadmap.id);
      if (filter === "completed") return Boolean(s?.isComplete);
      if (filter === "favorites") return Boolean(s?.isFavorite);
      if (filter === "progress") return !s?.isComplete && (s?.completedStages ?? 0) > 0;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "title") return a.topic.localeCompare(b.topic);
      if (sort === "progress") {
        return (statsById.get(b.id)?.percent ?? 0) - (statsById.get(a.id)?.percent ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [roadmaps, statsById, filter, sort]);

  // The first unfinished roadmap drives the "up next" rail.
  const activeRoadmap = useMemo(
    () => roadmaps.find((r) => !statsById.get(r.id)?.isComplete) ?? roadmaps[0],
    [roadmaps, statsById]
  );
  const activeStats = activeRoadmap ? statsById.get(activeRoadmap.id) : undefined;

  if (!isInitializing && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <StateView
          tone="empty"
          illustration="secure-login"
          title="Sign in to see your library"
          description="Your saved roadmaps and progress are tied to your account."
          primary={{ href: "/auth/login", label: "Log in" }}
          secondary={{ href: "/", label: "Back home" }}
        />
      </div>
    );
  }

  if (saved.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <CardGridSkeleton />
      </div>
    );
  }

  if (saved.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <StateView
          tone="error"
          illustration="no-data"
          title="Couldn't load your library"
          description="Something went wrong fetching your saved roadmaps. Your data is safe — try again."
          primary={{ onClick: () => void saved.refetch(), label: "Try again" }}
          secondary={{ href: "/", label: "Back home" }}
        />
      </div>
    );
  }

  const handleUnsave = async (roadmap: Roadmap) => {
    // `confirm` renders through components/md/Dialog — centred on desktop, a
    // full-screen page with a back arrow on phones. No popup.
    const ok = await confirm({
      title: `Remove "${roadmap.topic}"?`,
      message:
        "It leaves your library but your progress is kept — saving it again picks up where you left off.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (ok) unsave.mutate(roadmap.id);
  };

  const FILTERS = [
    {
      key: "all" as const,
      label: progressFailed ? "All roadmaps" : `All roadmaps (${counts.all})`,
    },
    {
      key: "progress" as const,
      label: progressFailed ? "In progress" : `In progress (${counts.inProgress})`,
    },
    {
      key: "completed" as const,
      label: progressFailed ? "Completed" : `Completed (${counts.completed})`,
    },
    {
      key: "favorites" as const,
      label: progressFailed ? "Favourites" : `Favourites (${counts.favorites})`,
    },
  ];

  return (
    // The extra bottom padding below md is the FAB's landing room: `pb-nav` on
    // the page only clears the navigation bar, not the 56dp button floating
    // above it.
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-16">
      <nav aria-label="Breadcrumb" className="text-body-sm text-md-on-surface-variant">
        <ol className="flex items-center gap-2">
          <li>
            {/* -my-3/py-3 grows the tap target to the 44px floor without
                changing the crumb row's visual height. */}
            <Link
              href="/"
              className="-my-3 inline-flex min-h-touch-min items-center rounded-xs py-3 transition-colors duration-fast hover:text-md-primary"
            >
              Home
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-md-on-surface">
            Saved roadmaps
          </li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-5 lg:grid-cols-12">
        {/* ── Main column ────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 lg:col-span-8">
          <header className="relative overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container-low p-5 sm:p-7">
            <div
              aria-hidden
              data-scene-stage
              className="pointer-events-none absolute right-0 top-0 hidden h-full w-[40%] items-center justify-end md:flex"
            >
              <Image
                src="/3d/how-header.png"
                alt=""
                width={846}
                height={356}
                sizes="28vw"
                className="h-auto w-full max-w-xs select-none opacity-90"
              />
            </div>

            <div className="relative max-w-lg">
              <Eyebrow>Your learning library</Eyebrow>
              <h1 className="mt-2 text-headline-sm font-medium text-md-on-surface sm:text-headline-lg">
                Your saved <span className="text-md-primary">roadmaps</span>
              </h1>
              <p className="mt-2 text-body-md text-md-on-surface-variant">
                Continue your learning journey, track progress, and reach your goals.
              </p>
            </div>
          </header>

          {progressFailed && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-md-error-container px-4 py-3 text-md-on-error-container"
            >
              <p className="flex min-w-0 items-center gap-2 text-body-md">
                <AlertIcon className="h-4 w-4 shrink-0" />
                Your progress couldn&apos;t be loaded, so completion is shown as unknown.
              </p>
              <button
                type="button"
                onClick={() => void summary.refetch()}
                className="press state-layer ml-auto inline-flex min-h-touch-min items-center rounded-full border border-current px-4 text-label-lg"
              >
                Try again
              </button>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={<LayersIcon className="h-5 w-5" />}
              value={counts.all}
              label="Total roadmaps"
            />
            <StatCard
              icon={<PlayIcon className="h-5 w-5" />}
              value={totals.totalStages}
              label="Total stages"
            />
            <StatCard
              icon={<CheckCircleIcon className="h-5 w-5" />}
              value={progressFailed ? "—" : totals.completedStages}
              label="Completed stages"
            />
            <StatCard
              icon={<ChartIcon className="h-5 w-5" />}
              value={progressFailed ? "—" : `${totals.percent}%`}
              label="Overall progress"
            />
          </dl>

          {/* Filters + view controls */}
          {/* Below sm the four filter chips are ~700px wide: they get their own
              full-width scrolling rail rather than being left to wrap against
              the sort/view cluster, which produced a ragged two-line row that
              could still push past 360px. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="rail min-w-0 py-1.5" role="group" aria-label="Filter roadmaps">
              {FILTERS.map(({ key, label }) => {
                const selected = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilter(key)}
                    className={clsx(
                      // M3 filter chip: 32dp tall, 8dp corners, outlined when
                      // unselected and a secondary-container fill plus a
                      // leading check when selected. The chip's own box stays
                      // 32dp; `before:` lifts the hit area to the 44px floor.
                      "press state-layer relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-sm px-4 text-label-lg",
                      "transition-colors duration-fast ease-standard",
                      "before:absolute before:-bottom-1.5 before:-top-1.5 before:left-0 before:right-0 before:content-['']",
                      selected
                        ? "bg-md-secondary-container pl-2 text-md-on-secondary-container"
                        : "border border-md-outline text-md-on-surface-variant"
                    )}
                  >
                    {selected && <CheckIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />}
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <label htmlFor="sort" className="sr-only">
                Sort roadmaps
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-touch rounded-xs border border-md-outline bg-md-surface-container-low px-4 text-md-on-surface"
              >
                <option value="recent">Recent</option>
                <option value="progress">Progress</option>
                <option value="title">Title</option>
              </select>

              <div
                className="flex shrink-0 rounded-full border border-md-outline p-0.5"
                role="group"
                aria-label="Layout"
              >
                {(
                  [
                    { key: "grid", label: "Grid view", icon: GridIcon },
                    { key: "list", label: "List view", icon: ListIcon },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={layout === key}
                    aria-label={label}
                    onClick={() => setLayout(key)}
                    className={clsx(
                      "press state-layer flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-fast ease-standard",
                      layout === key
                        ? "bg-md-secondary-container text-md-on-secondary-container"
                        : "text-md-on-surface-variant"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards */}
          {roadmaps.length === 0 ? (
            <StateView
              tone="empty"
              illustration="save-to-bookmarks"
              title="Your library is empty"
              description="Generate a roadmap for any topic and it will be saved here with your progress."
              primary={{ href: "/", label: "Build your first roadmap" }}
            />
          ) : visible.length === 0 ? (
            <div className="rounded-lg bg-md-surface-container-highest px-4 py-12 text-center sm:px-6">
              <p className="text-title-md text-md-on-surface">Nothing matches this filter</p>
              <p className="mt-1 text-body-md text-md-on-surface-variant">
                {filter === "favorites"
                  ? "Star a roadmap to keep it here."
                  : filter === "completed"
                    ? "Finish every stage of a roadmap to see it here."
                    : "Complete a stage to move a roadmap into progress."}
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="press state-layer mt-4 inline-flex min-h-touch items-center rounded-full border border-md-outline px-5 text-label-lg text-md-primary"
              >
                Show all roadmaps
              </button>
            </div>
          ) : (
            <ul className={clsx("grid gap-4", layout === "grid" && "sm:grid-cols-2")}>
              {visible.map((roadmap) => {
                const stats = statsById.get(roadmap.id);
                const percent = stats?.percent ?? 0;
                return (
                  // M3 filled card. No border, no glow — the container step
                  // does the separating.
                  <li
                    key={roadmap.id}
                    className="relative overflow-hidden rounded-lg bg-md-surface-container-highest p-5 text-md-on-surface sm:p-6"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Decorative: the same glyph already appears in the
                          "N stages" meta below. At 360px its 56px box plus the
                          two 44px actions left ~110px for the title, so it is
                          dropped below sm rather than shrunk. */}
                      <span
                        aria-hidden
                        className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container sm:flex"
                      >
                        <LayersIcon className="h-6 w-6" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-title-md font-medium text-md-on-surface sm:text-title-lg">
                          {/* `block` + the negative margin keeps `truncate`
                              working on the heading while the link itself
                              reaches the 44px touch floor. */}
                          <Link
                            href={`/roadmap/${roadmap.id}`}
                            className="-my-2.5 block min-h-touch-min truncate rounded-xs py-2.5 transition-colors duration-fast hover:text-md-primary"
                          >
                            {roadmap.topic}
                          </Link>
                        </h2>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-md-on-surface-variant">
                          <span className="inline-flex items-center gap-1.5">
                            <LayersIcon className="h-3.5 w-3.5" />
                            {roadmap.stages.length} stages
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatDate(roadmap.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {progressFailed
                              ? "Progress unknown"
                              : stats?.isComplete
                                ? "Completed"
                                : percent > 0
                                  ? "In progress"
                                  : "Not started"}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleFavorite.mutate(roadmap.id)}
                          aria-pressed={Boolean(stats?.isFavorite)}
                          aria-label={
                            stats?.isFavorite
                              ? `Remove ${roadmap.topic} from favourites`
                              : `Add ${roadmap.topic} to favourites`
                          }
                          className={clsx(
                            "press state-layer flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast ease-standard",
                            stats?.isFavorite ? "text-md-primary" : "text-md-on-surface-variant"
                          )}
                        >
                          <StarIcon className="h-5 w-5" filled={stats?.isFavorite} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleUnsave(roadmap)}
                          aria-label={`Remove ${roadmap.topic} from your library`}
                          className="press state-layer flex h-11 w-11 items-center justify-center rounded-full text-md-on-surface-variant transition-colors duration-fast ease-standard"
                        >
                          <CloseIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {!progressFailed && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-body-sm">
                          <span className="text-md-on-surface-variant">
                            {stats?.completedStages ?? 0} of {roadmap.stages.length} complete
                          </span>
                          <span className="text-label-lg tabular-nums text-md-primary">
                            {percent}%
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${roadmap.topic} progress`}
                          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-md-surface-variant"
                        >
                          <div
                            className="h-full rounded-full bg-md-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <Link
                        href={`/roadmap/${roadmap.id}`}
                        className="press state-layer inline-flex min-h-touch items-center gap-2 rounded-full bg-md-primary px-5 text-label-lg text-md-on-primary"
                      >
                        {percent > 0 ? "Continue learning" : "Start learning"}
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Side rail ──────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 lg:col-span-4">
          <Panel title="Your progress" icon={<TargetIcon className="h-4 w-4" />}>
            {progressFailed ? (
              <p
                role="alert"
                className="flex items-center gap-2 text-body-md text-md-on-surface-variant"
              >
                <AlertIcon className="h-4 w-4 shrink-0 text-md-error" />
                Progress is unavailable right now.
              </p>
            ) : (
              <div className="flex items-center gap-5">
                <ProgressRing percent={totals.percent} size={104} />
                <ul className="min-w-0 flex-1 space-y-2.5 text-body-md">
                  <li className="flex items-center gap-2.5">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-md-success" />
                    <span className="text-md-on-surface-variant">
                      {totals.completedStages} / {totals.totalStages} stages completed
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LayersIcon className="h-4 w-4 shrink-0 text-md-primary" />
                    <span className="text-md-on-surface-variant">
                      {Math.max(0, totals.totalStages - totals.completedStages)} stages remaining
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <PlayIcon className="h-4 w-4 shrink-0 text-md-primary" />
                    <span className="text-md-on-surface-variant">
                      {counts.inProgress} active {counts.inProgress === 1 ? "roadmap" : "roadmaps"}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </Panel>

          {activeRoadmap && (
            <Panel title="Upcoming in this roadmap" icon={<CalendarIcon className="h-4 w-4" />}>
              <p className="truncate text-body-sm text-md-on-surface-variant">
                {activeRoadmap.topic}
              </p>
              <ul className="mt-3 space-y-2.5">
                {activeRoadmap.stages
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 4)
                  .map((stage, i) => {
                    // The summary gives counts, not which stages — so the first
                    // N stages are shown as done, which matches the sequential
                    // unlock rule the server enforces.
                    const done = !progressFailed && i < (activeStats?.completedStages ?? 0);
                    return (
                      <li key={stage.id} className="flex items-center gap-2.5 text-body-md">
                        {done ? (
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-md-primary" />
                        ) : (
                          <CircleIcon className="h-4 w-4 shrink-0 text-md-outline" />
                        )}
                        <span
                          className={clsx(
                            "truncate",
                            done ? "text-md-on-surface" : "text-md-on-surface-variant"
                          )}
                        >
                          {stage.title}
                        </span>
                      </li>
                    );
                  })}
              </ul>
              <Link
                href={`/roadmap/${activeRoadmap.id}`}
                className="press state-layer mt-4 inline-flex min-h-touch-min items-center gap-2 rounded-full px-3 text-label-lg text-md-primary"
              >
                View full roadmap
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Panel>
          )}

          <Panel title="Quick actions" icon={<CompassIcon className="h-4 w-4" />} bodyClassName="py-2">
            <ul className="divide-y divide-md-outline-variant">
              {[
                { href: "/", label: "Generate new roadmap", icon: PlusIcon },
                { href: "/#features", label: "Explore topics", icon: CompassIcon },
                { href: "/profile", label: "View achievements", icon: TrophyIcon },
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="press flex min-h-touch items-center justify-between gap-3 py-2 text-body-md text-md-on-surface transition-colors duration-fast hover:text-md-primary"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-md-primary" />
                      {label}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-md-on-surface-variant" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* ── FAB ────────────────────────────────────────────────────────
          M3 FAB for the library's one primary action. 56dp, 16dp corners,
          bottom-right, floating clear of the 80dp navigation bar and the home
          indicator below it. `router.push` rather than a Link so the button is
          a button — the bottom nav owns navigation semantics on this screen. */}
      <button
        type="button"
        onClick={() => router.push("/")}
        aria-label="Generate a new roadmap"
        // Material moves the FAB up for a snackbar instead of letting one cover
        // it. `--snackbar-lift` is published by the Toaster (0px when the stack
        // is empty), and we spend it as a transform — §7 allows transform and
        // opacity only, and animating `bottom` would lay out on every frame.
        style={{ transform: "translateY(calc(-1 * var(--snackbar-lift, 0px)))" }}
        className="press state-layer fixed bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom)+1rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-lg bg-md-primary-container text-md-on-primary-container shadow-e3 transition-transform duration-base ease-standard motion-reduce:transition-none sm:right-6 md:bottom-[calc(1.5rem+var(--safe-bottom))]"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
