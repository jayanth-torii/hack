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
import { CalendarIcon, ChartIcon, TargetIcon } from "./ProfileIcons";

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
            <div className="flex gap-1 rounded-full border border-line/15 p-0.5" role="group" aria-label="Chart range">
              {(["week", "month"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  aria-pressed={range === option}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors duration-fast",
                    range === option
                      ? "bg-accent text-on-accent"
                      : "text-muted hover:text-paper"
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
            <p role="alert" className="text-sm text-danger">
              Couldn&apos;t load your activity. Reload to try again.
            </p>
          ) : (
            <ActivityChart buckets={activity.data?.buckets ?? []} range={range} />
          )}
        </Panel>

        <Panel title="Target dates" icon={<CalendarIcon className="h-4 w-4" />}>
          <form onSubmit={onSubmitGoal} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="goal-roadmap" className="text-xs font-medium text-subtle">
                Roadmap
              </label>
              <select
                id="goal-roadmap"
                value={goalRoadmap}
                onChange={(e) => setGoalRoadmap(e.target.value)}
                className="mt-1.5 min-h-touch w-full rounded-sm border border-line/15 bg-ink/50 px-3 text-sm text-paper"
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
              <label htmlFor="goal-date" className="text-xs font-medium text-subtle">
                Finish by
              </label>
              <input
                id="goal-date"
                type="date"
                value={goalDate}
                min={minDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="mt-1.5 min-h-touch w-full rounded-sm border border-line/15 bg-ink/50 px-3 text-sm text-paper"
              />
            </div>
            <button
              type="submit"
              disabled={!goalRoadmap || !goalDate || setGoal.isPending}
              className="press min-h-touch rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
            >
              {setGoal.isPending ? "Saving…" : "Set"}
            </button>
          </form>

          {roadmaps.length === 0 && (
            <p className="mt-3 text-xs text-muted">
              Save a roadmap first — a target date needs something to aim at.
            </p>
          )}

          <ul className="mt-5 space-y-2">
            {goals.isPending && <Skeleton className="h-14 rounded-md" />}
            {!goals.isPending && (goals.data ?? []).length === 0 && (
              <li className="text-sm text-muted">No target dates set.</li>
            )}
            {(goals.data ?? []).map((goal) => {
              const left = daysUntil(goal.targetDate);
              const overdue = left < 0;
              return (
                <li
                  key={goal.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line/12 bg-ink/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-paper">
                      {topicById.get(goal.roadmapId) ?? "Roadmap"}
                    </p>
                    <p className={clsx("mt-0.5 text-xs", overdue ? "text-warning" : "text-muted")}>
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
                    className="press min-h-touch-min shrink-0 rounded-full px-3 text-xs font-semibold text-muted transition-colors duration-fast hover:text-danger"
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
          <div className="flex items-center gap-5">
            <ProgressRing
              percent={overview.data?.overallProgress ?? 0}
              size={108}
              sublabel="of all stages"
            />
            <dl className="min-w-0 flex-1 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Completed</dt>
                <dd className="font-semibold tabular-nums text-paper">
                  {overview.data?.completedStages ?? 0} / {overview.data?.totalStages ?? 0}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Roadmaps finished</dt>
                <dd className="font-semibold tabular-nums text-paper">
                  {overview.data?.completedRoadmaps ?? 0}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Current streak</dt>
                <dd className="font-semibold tabular-nums text-paper">
                  {overview.data?.currentStreak ?? 0}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Longest streak</dt>
                <dd className="font-semibold tabular-nums text-paper">
                  {overview.data?.longestStreak ?? 0}
                </dd>
              </div>
            </dl>
          </div>
        </Panel>
      </div>
    </div>
  );
}
