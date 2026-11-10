"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAchievements, useOverview, useProfile } from "@/hooks/useProfileQuery";
import { RoadmapProgressList } from "./RoadmapProgressList";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import type { Roadmap } from "@/types/roadmap";
import type { RoadmapProgressSummary } from "@/types/profile";
import {
  ACHIEVEMENT_ICONS,
  AlertIcon,
  BookIcon,
  CheckCircleIcon,
  CircleIcon,
  ChartIcon,
  FlameIcon,
  LayersIcon,
  MedalIcon,
  PlusIcon,
  TargetIcon,
} from "./ProfileIcons";

interface ProfileOverviewProps {
  summary: RoadmapProgressSummary[];
}

/** One checklist row in the completeness panel. */
function CompletenessRow({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-body-md">
      {done ? (
        <CheckCircleIcon className="h-4 w-4 shrink-0 text-md-success" />
      ) : (
        <CircleIcon className="h-4 w-4 shrink-0 text-md-outline" />
      )}
      <span className={done ? "text-md-on-surface" : "text-md-on-surface-variant"}>{label}</span>
    </li>
  );
}

/**
 * Inline, non-blocking failure notice for one panel's query.
 *
 * Used where the rest of the tab is still useful: the section says it could
 * not load rather than rendering a zero that looks like real data.
 */
function LoadError({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-md bg-md-error-container px-4 py-3 text-md-on-error-container"
    >
      <p className="flex items-center gap-2 text-title-sm">
        <AlertIcon className="h-4 w-4 shrink-0" />
        Couldn&apos;t load {what}
      </p>
      <p className="mt-1 text-body-sm">
        Nothing has been lost — the numbers are just unavailable right now.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="press state-layer mt-2 inline-flex min-h-touch-min items-center rounded-full border border-current px-4 text-label-lg"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function ProfileOverview({ summary }: ProfileOverviewProps) {
  const profile = useProfile();
  const overview = useOverview();
  const achievements = useAchievements();
  const saved = useSavedRoadmaps();

  const roadmaps: Roadmap[] = saved.data ?? [];

  // Completeness is computed from fields that actually exist on the account, so
  // the checklist can never claim a step the backend cannot store.
  const checklist = [
    { label: "Create your account", done: true },
    { label: "Save your first roadmap", done: (overview.data?.savedRoadmaps ?? 0) > 0 },
    { label: "Add your name", done: Boolean(profile.data?.name) },
    { label: "Add your education", done: Boolean(profile.data?.education?.school) },
    { label: "Add skills or interests", done: (profile.data?.skills.length ?? 0) > 0 },
  ];
  const completeness = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100
  );

  const unlockedAchievements = (achievements.data ?? []).filter((a) => a.unlocked);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* ── Main column ──────────────────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-8">
        {/* `?? 0` on a failed query renders a confident, fabricated zero. The
            error branch is rendered instead so a broken request never reads as
            "you have completed nothing". */}
        {overview.isError ? (
          <LoadError what="your learning stats" onRetry={() => void overview.refetch()} />
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {overview.isPending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[7.5rem] rounded-lg" />
              ))
            ) : (
              <>
                <StatCard
                  icon={<BookIcon className="h-5 w-5" />}
                  value={overview.data?.savedRoadmaps ?? 0}
                  label="Saved roadmaps"
                />
                <StatCard
                  icon={<LayersIcon className="h-5 w-5" />}
                  value={overview.data?.unlockedStages ?? 0}
                  label="Stages unlocked"
                />
                <StatCard
                  icon={<TargetIcon className="h-5 w-5" />}
                  value={overview.data?.completedStages ?? 0}
                  label="Stages completed"
                />
                <StatCard
                  icon={<FlameIcon className="h-5 w-5" />}
                  value={overview.data?.currentStreak ?? 0}
                  label="Day streak"
                />
              </>
            )}
          </dl>
        )}

        {/* Continue learning. Deliberately NOT a card: every row below is one,
            and cards must not nest (CLAUDE.md §8). */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Continue learning</Eyebrow>
              <h2 className="mt-1.5 text-title-lg font-medium text-md-on-surface sm:text-headline-sm">
                Your saved roadmaps
              </h2>
            </div>
            <Link
              href="/"
              className="press state-layer inline-flex min-h-touch-min items-center gap-2 rounded-full border border-md-outline px-4 text-label-lg text-md-primary"
            >
              <PlusIcon className="h-4 w-4" />
              Generate a new one
            </Link>
          </div>

          <div className="mt-5">
            <RoadmapProgressList
              roadmaps={roadmaps}
              summary={summary}
              isPending={saved.isPending}
              isError={saved.isError}
              onRetry={() => void saved.refetch()}
            />
          </div>
        </section>
      </div>

      {/* ── Side rail ────────────────────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-4">
        <Panel title="Profile completeness" icon={<TargetIcon className="h-4 w-4" />}>
          <div className="flex items-center gap-4">
            <ProgressRing percent={completeness} size={92} strokeWidth={9} />
            <ul className="min-w-0 flex-1 space-y-2">
              {checklist.map((row) => (
                <CompletenessRow key={row.label} done={row.done} label={row.label} />
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Learning statistics" icon={<ChartIcon className="h-4 w-4" />}>
          {overview.isError ? (
            <LoadError what="your statistics" onRetry={() => void overview.refetch()} />
          ) : overview.isPending ? (
            <Skeleton className="h-28 rounded-md" />
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <dd className="text-title-lg font-medium tabular-nums text-md-on-surface">
                    {overview.data?.completedStages ?? 0}
                  </dd>
                  <dt className="mt-1 text-label-sm text-md-on-surface-variant">
                    Stages completed
                  </dt>
                </div>
                <div>
                  <dd className="text-title-lg font-medium tabular-nums text-md-on-surface">
                    {overview.data?.completedRoadmaps ?? 0}
                  </dd>
                  <dt className="mt-1 text-label-sm text-md-on-surface-variant">
                    Roadmaps finished
                  </dt>
                </div>
                <div>
                  <dd className="text-title-lg font-medium tabular-nums text-md-on-surface">
                    {overview.data?.longestStreak ?? 0}
                  </dd>
                  <dt className="mt-1 text-label-sm text-md-on-surface-variant">Longest streak</dt>
                </div>
              </dl>
              <div className="mt-4 border-t border-md-outline-variant pt-4">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-md-on-surface-variant">Overall progress</span>
                  <span className="text-label-lg tabular-nums text-md-primary">
                    {overview.data?.overallProgress ?? 0}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={overview.data?.overallProgress ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall progress"
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-md-surface-variant"
                >
                  <div
                    className="h-full rounded-full bg-md-primary"
                    style={{ width: `${overview.data?.overallProgress ?? 0}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Achievements" icon={<MedalIcon className="h-4 w-4" />}>
          {achievements.isError ? (
            <LoadError
              what="your achievements"
              onRetry={() => void achievements.refetch()}
            />
          ) : achievements.isPending ? (
            <Skeleton className="h-20 rounded-md" />
          ) : unlockedAchievements.length === 0 ? (
            <p className="text-body-md text-md-on-surface-variant">
              None yet — saving a roadmap and finishing your first stage unlock the first two.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {unlockedAchievements.slice(0, 6).map((a) => {
                const Icon = ACHIEVEMENT_ICONS[a.icon];
                return (
                  <li
                    key={a.key}
                    className="rounded-md bg-md-surface-container-high px-2 py-3 text-center"
                  >
                    <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container">
                      <Icon className="h-5 w-5" />
                    </span>
                    {/* A three-column grid is ~85px wide at 360px, so an
                        unbroken word would spill out of its tile. */}
                    <p className="mt-2 break-words text-label-sm text-md-on-surface">{a.title}</p>
                    <p className="mt-0.5 break-words text-label-sm leading-tight text-md-on-surface-variant">
                      {a.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Skills & interests" icon={<BookIcon className="h-4 w-4" />}>
          {(profile.data?.skills.length ?? 0) === 0 &&
          (profile.data?.interests.length ?? 0) === 0 ? (
            <p className="text-body-md text-md-on-surface-variant">
              Nothing added yet. Add them under{" "}
              <span className="text-md-on-surface">Settings</span> so your profile reflects what
              you are working on.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {[...(profile.data?.skills ?? []), ...(profile.data?.interests ?? [])].map((tag) => (
                <li
                  key={tag}
                  className="inline-flex h-8 items-center rounded-sm border border-md-outline px-3 text-label-lg text-md-on-surface-variant"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
