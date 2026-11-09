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
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChartIcon,
  CircleIcon,
  ClockIcon,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-accent-text">
              Home
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-subtle">
            Saved roadmaps
          </li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-5 lg:grid-cols-12">
        {/* ── Main column ────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-8">
          <header className="relative overflow-hidden rounded-xl border border-accent/25 bg-card/40 p-5 shadow-[0_0_60px_-26px_rgb(var(--color-accent)/0.65)] backdrop-blur-sm sm:p-7">
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
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-paper sm:text-4xl">
                Your saved <span className="text-accent">roadmaps</span>
              </h1>
              <p className="mt-2 text-sm text-muted">
                Continue your learning journey, track progress, and reach your goals.
              </p>
            </div>
          </header>

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
              value={totals.completedStages}
              label="Completed stages"
            />
            <StatCard
              icon={<ChartIcon className="h-5 w-5" />}
              value={`${totals.percent}%`}
              label="Overall progress"
            />
          </dl>

          {/* Filters + view controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rail" role="group" aria-label="Filter roadmaps">
              {(
                [
                  { key: "all", label: `All roadmaps (${counts.all})`, icon: LayersIcon },
                  { key: "progress", label: `In progress (${counts.inProgress})`, icon: PlayIcon },
                  { key: "completed", label: `Completed (${counts.completed})`, icon: CheckCircleIcon },
                  { key: "favorites", label: `Favourites (${counts.favorites})`, icon: StarIcon },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={clsx(
                    "press inline-flex min-h-touch items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-fast",
                    filter === key
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line/15 text-muted hover:border-accent/40 hover:text-paper"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="sr-only">
                Sort roadmaps
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-touch rounded-full border border-line/15 bg-ink/50 px-4 text-sm text-subtle"
              >
                <option value="recent">Recent</option>
                <option value="progress">Progress</option>
                <option value="title">Title</option>
              </select>

              <div className="flex rounded-full border border-line/15 p-0.5" role="group" aria-label="Layout">
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
                      "press flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast",
                      layout === key ? "bg-accent text-on-accent" : "text-muted hover:text-paper"
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
            <div className="rounded-xl border border-line/12 bg-card/30 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-paper">Nothing matches this filter</p>
              <p className="mt-1 text-sm text-muted">
                {filter === "favorites"
                  ? "Star a roadmap to keep it here."
                  : filter === "completed"
                    ? "Finish every stage of a roadmap to see it here."
                    : "Complete a stage to move a roadmap into progress."}
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="press mt-4 inline-flex min-h-touch items-center rounded-full border border-accent/45 px-5 text-sm font-semibold text-accent-text transition-colors duration-fast hover:bg-accent/12"
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
                  <li
                    key={roadmap.id}
                    className="relative overflow-hidden rounded-xl border border-accent/20 bg-card/40 p-5 shadow-[0_0_50px_-26px_rgb(var(--color-accent)/0.6)] backdrop-blur-sm transition-colors duration-base hover:border-accent/45 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/[0.10] text-accent-text">
                        <LayersIcon className="h-6 w-6" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-lg font-bold tracking-tight text-paper sm:text-xl">
                          <Link
                            href={`/roadmap/${roadmap.id}`}
                            className="transition-colors hover:text-accent-text"
                          >
                            {roadmap.topic}
                          </Link>
                        </h2>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
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
                            {stats?.isComplete
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
                            "press flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast",
                            stats?.isFavorite
                              ? "text-accent"
                              : "text-muted hover:text-accent-text"
                          )}
                        >
                          <StarIcon className="h-5 w-5" filled={stats?.isFavorite} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleUnsave(roadmap)}
                          aria-label={`Remove ${roadmap.topic} from your library`}
                          className="press flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-fast hover:text-danger"
                        >
                          <span aria-hidden className="text-lg leading-none">
                            ×
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">
                          {stats?.completedStages ?? 0} of {roadmap.stages.length} complete
                        </span>
                        <span className="font-display font-bold tabular-nums text-accent">
                          {percent}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line/12">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-hover to-accent"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Link
                        href={`/roadmap/${roadmap.id}`}
                        className="press inline-flex min-h-touch items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover"
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
        <div className="space-y-5 lg:col-span-4">
          <Panel title="Your progress" icon={<TargetIcon className="h-4 w-4" />}>
            <div className="flex items-center gap-5">
              <ProgressRing percent={totals.percent} size={104} />
              <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
                  <span className="text-subtle">
                    {totals.completedStages} / {totals.totalStages} stages completed
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <LayersIcon className="h-4 w-4 shrink-0 text-accent-text" />
                  <span className="text-subtle">
                    {Math.max(0, totals.totalStages - totals.completedStages)} stages remaining
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <PlayIcon className="h-4 w-4 shrink-0 text-accent-text" />
                  <span className="text-subtle">
                    {counts.inProgress} active {counts.inProgress === 1 ? "roadmap" : "roadmaps"}
                  </span>
                </li>
              </ul>
            </div>
          </Panel>

          {activeRoadmap && (
            <Panel title="Upcoming in this roadmap" icon={<CalendarIcon className="h-4 w-4" />}>
              <p className="truncate text-xs text-muted">{activeRoadmap.topic}</p>
              <ul className="mt-3 space-y-2.5">
                {activeRoadmap.stages
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 4)
                  .map((stage, i) => {
                    // The summary gives counts, not which stages — so the first
                    // N stages are shown as done, which matches the sequential
                    // unlock rule the server enforces.
                    const done = i < (activeStats?.completedStages ?? 0);
                    return (
                      <li key={stage.id} className="flex items-center gap-2.5 text-sm">
                        {done ? (
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" />
                        ) : (
                          <CircleIcon className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <span className={clsx("truncate", done ? "text-subtle" : "text-muted")}>
                          {stage.title}
                        </span>
                      </li>
                    );
                  })}
              </ul>
              <Link
                href={`/roadmap/${activeRoadmap.id}`}
                className="press mt-4 inline-flex min-h-touch-min items-center gap-2 text-sm font-semibold text-accent-text transition-colors duration-fast hover:text-accent"
              >
                View full roadmap
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Panel>
          )}

          <Panel title="Quick actions" icon={<CompassIcon className="h-4 w-4" />} bodyClassName="py-2">
            <ul className="divide-y divide-line/10">
              {[
                { href: "/", label: "Generate new roadmap", icon: PlusIcon },
                { href: "/#features", label: "Explore topics", icon: CompassIcon },
                { href: "/profile", label: "View achievements", icon: TrophyIcon },
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="press flex min-h-touch items-center justify-between gap-3 py-2 text-sm font-medium text-subtle transition-colors duration-fast hover:text-accent-text"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-accent-text" />
                      {label}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
