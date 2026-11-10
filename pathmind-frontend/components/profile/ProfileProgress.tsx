"use client";

import { useState } from "react";
import { ActivityChart } from "@/components/ui/ActivityChart";
import { Panel } from "@/components/ui/Panel";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { clsx } from "@/lib/clsx";
import {
  useActivity,
  useDeleteGoal,
  useGoals,
  useOverview,
  useSetGoal,
} from "@/hooks/useProfileQuery";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { AlertIcon, CalendarIcon, ChartIcon, TargetIcon } from "./ProfileIcons";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Whole days from today until the target; negative once it has passed. */
function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Shared field shape for the two target-date controls. */
const FIELD =
  "mt-1.5 min-h-touch w-full rounded-xs border border-md-outline bg-md-surface-container-low px-3 text-md-on-surface";

/** Learning activity chart plus the learner's own target dates. */
export function ProfileProgress() {
  const [range, setRange] = useState<"week" | "month">("week");
  const activity = useActivity(range);
  const overview = useOverview();
  const goals = useGoals();
  const saved = useSavedRoadmaps();
  const setGoal = useSetGoal();
  const deleteGoal = useDeleteGoal();

  const [goalRoadmap, setGoalRoadmap] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const roadmaps = saved.data ?? [];
  const topicById = new Map(roadmaps.map((r) => [r.id, r.topic]));

  // The picker only offers dates from tomorrow on, matching the server rule
  // that a target must be in the future.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  const onSubmitGoal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalRoadmap || !goalDate) return;
    setGoal.mutate(
      { roadmapId: goalRoadmap, targetDate: new Date(`${goalDate}T12:00:00`).toISOString() },
      {
        onSuccess: () => {
          setGoalRoadmap("");
          setGoalDate("");
        },
      }
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <Panel
          title="Learning activity"
          icon={<ChartIcon className="h-4 w-4" />}
          action={
            <div
              className="flex shrink-0 gap-1 rounded-full border border-md-outline p-0.5"
              role="group"
              aria-label="Chart range"
            >
              {(["week", "month"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  aria-pressed={range === option}
                  className={clsx(
                    // 28px tall was below the 44px floor on touch. Raised on
                    // phones only so the desktop panel header keeps its height.
                    "press state-layer inline-flex min-h-touch-min items-center rounded-full px-3 py-1.5 text-label-md capitalize transition-colors duration-fast ease-standard sm:min-h-0",
                    range === option
                      ? "bg-md-secondary-container text-md-on-secondary-container"
                      : "text-md-on-surface-variant"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          {activity.isPending ? (
            <Skeleton className="h-36 rounded-md" />
          ) : activity.isError ? (
            <p role="alert" className="flex items-center gap-2 text-body-md text-md-error">
              <AlertIcon className="h-4 w-4 shrink-0" />
              Couldn&apos;t load your activity. Reload to try again.
            </p>
          ) : (
            <ActivityChart buckets={activity.data?.buckets ?? []} range={range} />
          )}
        </Panel>

        <Panel title="Target dates" icon={<CalendarIcon className="h-4 w-4" />}>
          <form onSubmit={onSubmitGoal} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="goal-roadmap" className="text-label-lg text-md-on-surface-variant">
                Roadmap
              </label>
              <select
                id="goal-roadmap"
                value={goalRoadmap}
                onChange={(e) => setGoalRoadmap(e.target.value)}
                className={FIELD}
              >
                <option value="">Choose a roadmap…</option>
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.topic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal-date" className="text-label-lg text-md-on-surface-variant">
                Finish by
              </label>
              <input
                id="goal-date"
                type="date"
                value={goalDate}
                min={minDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className={FIELD}
              />
            </div>
            <button
              type="submit"
              disabled={!goalRoadmap || !goalDate || setGoal.isPending}
              className="press state-layer min-h-touch rounded-full bg-md-primary px-6 text-label-lg text-md-on-primary disabled:pointer-events-none disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]"
            >
              {setGoal.isPending ? "Saving…" : "Set"}
            </button>
          </form>

          {roadmaps.length === 0 && (
            <p className="mt-3 text-body-sm text-md-on-surface-variant">
              Save a roadmap first — a target date needs something to aim at.
            </p>
          )}

          <ul className="mt-5 space-y-2">
            {goals.isPending && <Skeleton className="h-14 rounded-md" />}
            {goals.isError && (
              <li
                role="alert"
                className="flex items-center gap-2 rounded-md bg-md-error-container px-4 py-3 text-body-md text-md-on-error-container"
              >
                <AlertIcon className="h-4 w-4 shrink-0" />
                Couldn&apos;t load your target dates. Reload to try again.
              </li>
            )}
            {!goals.isPending && !goals.isError && (goals.data ?? []).length === 0 && (
              <li className="text-body-md text-md-on-surface-variant">No target dates set.</li>
            )}
            {(goals.data ?? []).map((goal) => {
              const left = daysUntil(goal.targetDate);
              const overdue = left < 0;
              return (
                <li
                  key={goal.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-md-surface-container-high px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-title-sm text-md-on-surface">
                      {topicById.get(goal.roadmapId) ?? "Roadmap"}
                    </p>
                    <p
                      className={clsx(
                        "mt-0.5 flex items-center gap-1.5 text-body-sm",
                        overdue ? "text-md-warning" : "text-md-on-surface-variant"
                      )}
                    >
                      {/* Overdue is never signalled by colour alone. */}
                      {overdue && <AlertIcon className="h-3.5 w-3.5 shrink-0" />}
                      {formatDate(goal.targetDate)} ·{" "}
                      {overdue
                        ? `${Math.abs(left)} ${Math.abs(left) === 1 ? "day" : "days"} past target`
                        : left === 0
                          ? "due today"
                          : `${left} ${left === 1 ? "day" : "days"} left`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteGoal.mutate(goal.roadmapId)}
                    className="press state-layer min-h-touch-min shrink-0 rounded-full px-3 text-label-lg text-md-on-surface-variant"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="space-y-5 lg:col-span-5">
        <Panel title="Overall progress" icon={<TargetIcon className="h-4 w-4" />}>
          {overview.isError ? (
            <p
              role="alert"
              className="flex items-center gap-2 text-body-md text-md-on-surface-variant"
            >
              <AlertIcon className="h-4 w-4 shrink-0 text-md-error" />
              Couldn&apos;t load your totals. Reload to try again.
            </p>
          ) : overview.isPending ? (
            <Skeleton className="h-28 rounded-md" />
          ) : (
            <div className="flex items-center gap-5">
              <ProgressRing
                percent={overview.data?.overallProgress ?? 0}
                size={108}
                sublabel="of all stages"
              />
              <dl className="min-w-0 flex-1 space-y-2.5 text-body-md">
                <div className="flex justify-between gap-3">
                  <dt className="text-md-on-surface-variant">Completed</dt>
                  <dd className="tabular-nums text-md-on-surface">
                    {overview.data?.completedStages ?? 0} / {overview.data?.totalStages ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-md-on-surface-variant">Roadmaps finished</dt>
                  <dd className="tabular-nums text-md-on-surface">
                    {overview.data?.completedRoadmaps ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-md-on-surface-variant">Current streak</dt>
                  <dd className="tabular-nums text-md-on-surface">
                    {overview.data?.currentStreak ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-md-on-surface-variant">Longest streak</dt>
                  <dd className="tabular-nums text-md-on-surface">
                    {overview.data?.longestStreak ?? 0}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
