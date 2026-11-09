"use client";

import { clsx } from "@/lib/clsx";
import { VideoPreview, isVideoUrl } from "@/components/ui/VideoPreview";
import type { Stage } from "@/types/roadmap";
import {
  BookIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  LockIcon,
  PlayIcon,
} from "@/components/profile/ProfileIcons";

export type StageState = "completed" | "active" | "locked";

const STATE_LABEL: Record<StageState, string> = {
  completed: "Completed",
  active: "In progress",
  locked: "Not started",
};

interface StageTimelineProps {
  stages: Stage[];
  stateOf: (stage: Stage) => StageState;
  /** Ticked syllabus indexes per stage id, straight from the server. */
  completedItems: Record<string, number[]>;
  onToggleItem: (stage: Stage, index: number, done: boolean) => void;
  /** Fallback for a stage with no syllabus — nothing to tick, so no way in. */
  onMarkComplete: (stage: Stage) => void;
  isSaving: boolean;
  onShowResources: () => void;
}

/**
 * The stage timeline: an alternating two-column track either side of a centre
 * spine, with each stage's card on one side and a video preview on the other.
 *
 * The alternation is desktop-only. Below `lg` the spine moves to the left edge
 * and everything stacks in one column — a zig-zag at phone width would be two
 * half-width columns of nothing, and the numbered node already carries the
 * sequence.
 *
 * DOM order is always card-then-video regardless of which visual side each
 * lands on, so a screen reader and the keyboard both follow the real sequence;
 * the sides are swapped with `col-start` / `row-start`, not with source order.
 */
export function StageTimeline({
  stages,
  stateOf,
  completedItems,
  onToggleItem,
  onMarkComplete,
  isSaving,
  onShowResources,
}: StageTimelineProps) {
  return (
    <ol className="relative mt-6">
      {/* The spine stops short at both ends so it reads as connecting the
          stages rather than running off the list. */}
      <span
        aria-hidden
        className="absolute bottom-10 left-[23px] top-10 w-px bg-accent/20 lg:left-1/2 lg:-translate-x-1/2"
      />

      {stages.map((stage, index) => {
        const state = stateOf(stage);
        const ticked = new Set(completedItems[stage.id] ?? []);
        const itemCount = stage.syllabus.length;
        const tickedCount = state === "completed" ? itemCount : ticked.size;

        // Wording and icon are decided separately. A stage nobody has started
        // reads "Not started" even when the server has it unlocked — but only a
        // genuinely locked one gets the padlock, because an unlocked stage can
        // be worked on right now and a padlock would say otherwise.
        const started = tickedCount > 0;
        const badgeLabel: StageState =
          state === "active" && !started ? "locked" : state;

        // Card on the left for even stages, right for odd — the zig-zag.
        const cardOnLeft = index % 2 === 0;

        const video = stage.resources.find(
          (resource) =>
            (resource.type === "video" || resource.type === "playlist") && isVideoUrl(resource.url)
        );

        const nextUnticked = stage.syllabus.findIndex((_, i) => !ticked.has(i));

        return (
          <li
            key={stage.id}
            id={`stage-${stage.id}`}
            className="relative scroll-mt-24 pb-6 pl-14 last:pb-0 sm:pl-16 lg:px-0 lg:pb-10"
          >
            {/* Numbered node — on the spine at every breakpoint. */}
            <span
              aria-hidden
              className={clsx(
                "absolute left-0 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-ink font-display text-sm font-bold lg:left-1/2 lg:-translate-x-1/2",
                state === "completed"
                  ? "border-success/60 text-success"
                  : state === "active"
                    ? "border-accent text-accent shadow-[0_0_24px_rgb(var(--color-accent)/0.45)]"
                    : "border-line/25 text-muted"
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20">
              {/* ── Stage card ─────────────────────────────────────── */}
              <article
                className={clsx(
                  "rounded-xl border bg-card/40 p-5 backdrop-blur-sm transition-colors duration-base",
                  cardOnLeft ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1",
                  state === "locked"
                    ? "border-line/12"
                    : "border-accent/25 shadow-[0_0_50px_-26px_rgb(var(--color-accent)/0.6)]"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-display text-sm font-bold text-accent-text">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="min-w-0 font-display text-base font-bold tracking-tight text-paper sm:text-lg">
                      {stage.title}
                    </h2>
                  </div>

                  {/* Status is a labelled chip, never colour alone. */}
                  <span
                    className={clsx(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
                      badgeLabel === "completed"
                        ? "bg-success/12 text-success"
                        : badgeLabel === "active"
                          ? "bg-accent/12 text-accent-text"
                          : "bg-line/10 text-muted"
                    )}
                  >
                    {badgeLabel === "completed" ? (
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                    ) : badgeLabel === "active" ? (
                      <PlayIcon className="h-3.5 w-3.5" />
                    ) : state === "locked" ? (
                      <LockIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CircleIcon className="h-3.5 w-3.5" />
                    )}
                    {STATE_LABEL[badgeLabel]}
                  </span>
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="capitalize">{stage.difficulty}</span>
                  {stage.estimatedDays > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5" />~{stage.estimatedDays} days
                      </span>
                    </>
                  )}
                  {itemCount > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">
                        {tickedCount}/{itemCount} done
                      </span>
                    </>
                  )}
                </p>

                {/* ── Lessons ──────────────────────────────────────── */}
                {itemCount > 0 && (
                  <ul className="mt-4 space-y-1">
                    {stage.syllabus.map((item, itemIndex) => {
                      const done = state === "completed" || ticked.has(itemIndex);
                      const locked = state === "locked";
                      return (
                        <li key={`${stage.id}-${itemIndex}`}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            disabled={locked || isSaving}
                            onClick={() => onToggleItem(stage, itemIndex, !done)}
                            className={clsx(
                              "press flex min-h-touch-min w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast",
                              locked
                                ? "cursor-not-allowed text-muted"
                                : "hover:bg-accent/[0.07] disabled:opacity-60"
                            )}
                          >
                            {done ? (
                              <CheckCircleIcon className="h-[1.125rem] w-[1.125rem] shrink-0 text-success" />
                            ) : (
                              <CircleIcon className="h-[1.125rem] w-[1.125rem] shrink-0 text-muted" />
                            )}
                            <span
                              className={clsx(
                                "min-w-0 flex-1",
                                done ? "text-subtle line-through decoration-success/40" : "text-subtle",
                                locked && "text-muted"
                              )}
                            >
                              {item}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* ── Actions ──────────────────────────────────────── */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {state !== "locked" && itemCount > 0 && nextUnticked >= 0 && (
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-busy={isSaving}
                      onClick={() => onToggleItem(stage, nextUnticked, true)}
                      className="press inline-flex min-h-touch items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
                    >
                      <PlayIcon className="h-4 w-4" />
                      {tickedCount === 0
                        ? "Start stage"
                        : `Continue (${tickedCount}/${itemCount})`}
                    </button>
                  )}

                  {/* A stage with no syllabus has nothing to tick, so the only
                      way to finish it is the whole-stage action. */}
                  {state === "active" && itemCount === 0 && (
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-busy={isSaving}
                      onClick={() => onMarkComplete(stage)}
                      className="press inline-flex min-h-touch items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Mark complete
                    </button>
                  )}

                  {stage.resources.length > 0 && (
                    <button
                      type="button"
                      onClick={onShowResources}
                      className="press inline-flex min-h-touch items-center gap-2 rounded-full border border-line/20 px-4 text-sm font-semibold text-subtle transition-colors duration-fast hover:border-accent/50 hover:text-accent-text"
                    >
                      <BookIcon className="h-4 w-4" />
                      {stage.resources.length} resources
                    </button>
                  )}

                  {state === "locked" && (
                    <span className="text-xs text-muted">
                      Finish the previous stage to unlock this one.
                    </span>
                  )}
                </div>
              </article>

              {/* ── Video, opposite side ───────────────────────────── */}
              {video && (
                <div
                  className={clsx(
                    "mt-4 lg:mt-0",
                    cardOnLeft ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1"
                  )}
                >
                  <VideoPreview
                    url={video.url}
                    title={video.title}
                    type={video.type}
                    className={state === "locked" ? "opacity-60" : undefined}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
