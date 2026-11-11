"use client";

import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Material **filter chip** row. One row per dimension, horizontally
 * scrollable on a phone rather than wrapped into four lines — `px-4` gutters
 * are preserved by padding the scroller, and `snap-x` keeps a chip from
 * resting half-visible at the edge.
 *
 * Lives here rather than beside the catalog because two screens pick a
 * category now: the catalog filters its grid, and `/build` filters the topic
 * suggestions it offers. A second copy with slightly different padding is
 * exactly the drift CLAUDE.md §8 forbids.
 */
export function ChipRow({
  label,
  wrap = false,
  children,
}: {
  label: string;
  /**
   * Wrap onto multiple lines from `sm` up instead of scrolling.
   *
   * A scroller is right when the row spans the page, because a phone can't
   * show eight chips and the cut edge is the affordance. In a narrow column
   * it is wrong: on /build the row sits in a 7-of-12 column and clipped
   * "Web Development" to "Web D" with nothing to suggest it scrolled.
   * Phones keep the scroller either way — six long chips stacked is worse.
   */
  wrap?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h2 className="sr-only">{label}</h2>
      {/* -mx-4/px-4 lets the row bleed to the screen edge while its first and
          last chips still sit on the page gutter. Wrapping cancels the bleed,
          or the first chip of each line would hang outside the container. */}
      <div
        className={clsx(
          "-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          wrap && "sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0"
        )}
        role="group"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "state-layer press inline-flex min-h-touch-min flex-none snap-start items-center gap-1.5 rounded-sm border px-4 text-label-lg",
        "transition-[background-color,border-color] duration-fast ease-standard",
        selected
          ? "border-transparent bg-md-secondary-container text-md-on-secondary-container"
          : "border-md-outline text-md-on-surface-variant"
      )}
    >
      {/* M3 puts a check in the leading slot of a *selected* filter chip —
          the second, non-colour cue that this chip is on. */}
      {selected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
