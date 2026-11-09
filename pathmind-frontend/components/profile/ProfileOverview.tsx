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
  ArrowRightIcon,
  BookIcon,
  CheckCircleIcon,
  CircleIcon,
  ChartIcon,
  ClockIcon,
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
    <li className="flex items-center gap-2.5 text-sm">
      {done ? (
        <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <CircleIcon className="h-4 w-4 shrink-0 text-muted" />
      )}
      <span className={done ? "text-subtle" : "text-muted"}>{label}</span>
    </li>
  );
}

export function ProfileOverview({ summary }: ProfileOverviewProps) {
  const profile = useProfile();
  const overview = useOverview();
  const achievements = useAchievements();
  const saved = useSavedRoadmaps();

  const roadmaps: Roadmap[] = saved.data ?? [];
  const percentByRoadmap = new Map(summary.map((s) => [s.roadmapId, s]));

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
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {overview.isPending ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[7.5rem] rounded-xl" />
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
                label={
                  (overview.data?.currentStreak ?? 0) === 1 ? "Day streak" : "Day streak"
                }
              />
            </>
          )}
        </dl>

        {/* Continue learning */}
        <section className="rounded-xl border border-accent/20 bg-card/40 p-5 shadow-[0_0_50px_-24px_rgb(var(--color-accent)/0.6)] backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Continue learning</Eyebrow>
              <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-paper sm:text-2xl">
                Your saved roadmaps
              </h2>
            </div>
            <Link
              href="/"
              className="press inline-flex min-h-touch-min items-center gap-2 rounded-full border border-accent/45 px-4 text-sm font-semibold text-accent-text transition-colors duration-fast hover:bg-accent/12"
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
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dd className="font-display text-xl font-bold tabular-nums text-paper">
                {overview.data?.completedStages ?? 0}
              </dd>
              <dt className="mt-1 text-[0.6875rem] leading-tight text-muted">Stages completed</dt>
            </div>
            <div>
              <dd className="font-display text-xl font-bold tabular-nums text-paper">
                {overview.data?.completedRoadmaps ?? 0}
              </dd>
              <dt className="mt-1 text-[0.6875rem] leading-tight text-muted">Roadmaps finished</dt>
            </div>
            <div>
              <dd className="font-display text-xl font-bold tabular-nums text-paper">
                {overview.data?.longestStreak ?? 0}
              </dd>
              <dt className="mt-1 text-[0.6875rem] leading-tight text-muted">Longest streak</dt>
            </div>
          </dl>
          <div className="mt-4 border-t border-line/10 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Overall progress</span>
              <span className="font-semibold tabular-nums text-accent">
                {overview.data?.overallProgress ?? 0}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-hover to-accent"
                style={{ width: `${overview.data?.overallProgress ?? 0}%` }}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Achievements" icon={<MedalIcon className="h-4 w-4" />}>
          {achievements.isPending ? (
            <Skeleton className="h-20 rounded-md" />
          ) : unlockedAchievements.length === 0 ? (
            <p className="text-sm text-muted">
              None yet — saving a roadmap and finishing your first stage unlock the first two.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {unlockedAchievements.slice(0, 6).map((a) => {
                const Icon = ACHIEVEMENT_ICONS[a.icon];
                return (
                  <li key={a.key} className="rounded-md bg-ink/40 px-2 py-3 text-center">
                    <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-accent/35 bg-accent/[0.10] text-accent-text">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="mt-2 text-[0.6875rem] font-semibold leading-tight text-paper">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-[0.625rem] leading-tight text-muted">
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
            <p className="text-sm text-muted">
              Nothing added yet. Add them under <span className="text-subtle">Settings</span> so
              your profile reflects what you are working on.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {[...(profile.data?.skills ?? []), ...(profile.data?.interests ?? [])].map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-accent/30 bg-accent/[0.08] px-3 py-1.5 text-xs font-medium text-accent-text"
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
