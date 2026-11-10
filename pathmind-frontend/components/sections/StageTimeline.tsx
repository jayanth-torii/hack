"use client";

import { clsx } from "@/lib/clsx";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

/** Chip tone per state — always paired with an icon and a word, never colour alone. */
const STATE_TONE: Record<StageState, "success" | "brand" | "neutral"> = {
  completed: "success",
  active: "brand",
  locked: "neutral",
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
 * Material 3: each stage is a card whose **tone** carries its state — the
 * active one sits on the highest container step behind a primary outline, a
 * finished one a step lower, a locked one flat on the page surface. That
 * replaces the old accent glow: emphasis comes from the tonal ramp, and
 * elevation stays reserved for surfaces that genuinely float.
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
        className="absolute bottom-10 left-6 top-10 w-px -translate-x-1/2 bg-md-outline-variant lg:left-1/2"
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
            className="relative scroll-mt-4 pb-6 pl-14 last:pb-0 sm:pl-16 lg:px-0 lg:pb-10"
          >
            {/* Numbered node — on the spine at every breakpoint. */}
            <span
              aria-hidden
              className={clsx(
                "absolute left-0 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-label-lg font-bold lg:left-1/2 lg:-translate-x-1/2",
                state === "completed"
                  ? "border-md-success bg-md-success-container text-md-on-success-container"
                  : state === "active"
                    ? "border-md-primary bg-md-primary text-md-on-primary"
                    : "border-md-outline-variant bg-md-surface text-md-on-surface-variant"
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20">
              {/* ── Stage card ─────────────────────────────────────── */}
              <article
                className={clsx(
                  "rounded-lg border p-4 transition-colors duration-base ease-standard sm:p-5",
                  cardOnLeft ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1",
                  state === "active"
                    ? "border-md-primary bg-md-surface-container-highest"
                    : state === "completed"
                      ? "border-md-outline-variant bg-md-surface-container"
                      : "border-md-outline-variant bg-md-surface"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-label-lg font-bold text-md-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="min-w-0 break-words text-title-md font-medium text-md-on-surface sm:text-title-lg">
                      {stage.title}
                    </h2>
                  </div>

                  {/* Status is a labelled chip with an icon, never colour alone. */}
                  <Badge
                    tone={STATE_TONE[badgeLabel]}
                    className="shrink-0"
                    icon={
                      badgeLabel === "completed" ? (
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                      ) : badgeLabel === "active" ? (
                        <PlayIcon className="h-3.5 w-3.5" />
                      ) : state === "locked" ? (
                        <LockIcon className="h-3.5 w-3.5" />
                      ) : (
                        <CircleIcon className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {STATE_LABEL[badgeLabel]}
                  </Badge>
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-md-on-surface-variant">
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

                {/* M3 linear progress: primary fill on the highest container
                    step. Decorative — the count above says the same in words. */}
                {itemCount > 0 && (
                  <div
                    aria-hidden
                    className="mt-3 h-1 overflow-hidden rounded-full bg-md-surface-container-highest"
                  >
                    <div
                      className="h-full rounded-full bg-md-primary transition-[width] duration-base ease-standard"
                      style={{ width: `${Math.round((tickedCount / itemCount) * 100)}%` }}
                    />
                  </div>
                )}

                {/* ── Lessons — M3 list items with a leading checkbox ── */}
                {itemCount > 0 && (
                  <ul className="mt-4">
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
                              "state-layer flex min-h-touch-min w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left",
                              "transition-colors duration-fast ease-standard",
                              locked
                                ? "cursor-not-allowed text-md-on-surface-variant"
                                : "text-md-on-surface disabled:opacity-60"
                            )}
                          >
                            {done ? (
                              <CheckCircleIcon className="h-[1.125rem] w-[1.125rem] shrink-0 text-md-primary" />
                            ) : (
                              <CircleIcon className="h-[1.125rem] w-[1.125rem] shrink-0 text-md-on-surface-variant" />
                            )}
                            <span
                              className={clsx(
                                "min-w-0 flex-1 break-words text-body-lg",
                                done && "line-through decoration-md-outline"
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

                {/* ── Actions — exactly one filled button per card ──── */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {state !== "locked" && itemCount > 0 && nextUnticked >= 0 && (
                    <Button
                      variant="accent"
                      disabled={isSaving}
                      aria-busy={isSaving}
                      onClick={() => onToggleItem(stage, nextUnticked, true)}
                    >
                      <PlayIcon className="h-4 w-4" />
                      {tickedCount === 0
                        ? "Start stage"
                        : `Continue (${tickedCount}/${itemCount})`}
                    </Button>
                  )}

                  {/* A stage with no syllabus has nothing to tick, so the only
                      way to finish it is the whole-stage action. */}
                  {state === "active" && itemCount === 0 && (
                    <Button
                      variant="accent"
                      disabled={isSaving}
                      aria-busy={isSaving}
                      onClick={() => onMarkComplete(stage)}
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Mark complete
                    </Button>
                  )}

                  {stage.resources.length > 0 && (
                    // Not a popup: this switches the screen's Resources tab,
                    // an inline destination on the same page.
                    <Button variant="outlined" onClick={onShowResources}>
                      <BookIcon className="h-4 w-4" />
                      {stage.resources.length} resources
                    </Button>
                  )}

                  {state === "locked" && (
                    <span className="text-body-sm text-md-on-surface-variant">
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
