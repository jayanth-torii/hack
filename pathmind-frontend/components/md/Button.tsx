"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

export type MdButtonVariant = "filled" | "tonal" | "outlined" | "text" | "elevated";
export type MdButtonSize = "sm" | "md" | "lg";

/**
 * Material 3 common buttons.
 *
 * The five variants are an emphasis ladder, not a palette: **filled** for the
 * single most important action on a screen, **tonal** for a secondary action
 * that still needs weight, **elevated** when a button must separate from a
 * patterned background, **outlined** for a neutral alternative, **text** for
 * the lowest emphasis (dialog actions, inline links). Use exactly one filled
 * button per view — if two things look primary, neither is.
 *
 * Hover/focus/press come from `.state-layer`, which tints with `currentColor`,
 * so every variant gets the correct Material feedback without per-variant
 * hover colours. All variants are `rounded-full` (M3's shape for common
 * buttons) and clear the 48px touch target at every size.
 */
/**
 * The single source of truth for M3 common-button styling, shared by
 * `MdButton` (a `<button>`) and `components/home/ActionLink` (an `<a>`).
 *
 * It lives here rather than being copied because the two had already drifted
 * apart once: the link gave `filled` a resting `shadow-e1` and `elevated` a
 * flat `shadow-e2`, when M3 puts a filled button at elevation 0 and an
 * elevated one at level 1 rising to level 2 on hover. One recipe, one chance
 * to be wrong.
 *
 * Disabled styling is kept separate — `:disabled` only matches form controls,
 * so an anchor would silently get none of it.
 */
const VARIANT: Record<MdButtonVariant, string> = {
  filled: "bg-md-primary text-md-on-primary",
  tonal: "bg-md-secondary-container text-md-on-secondary-container",
  elevated: "bg-md-surface-container-low text-md-primary shadow-e1 hover:shadow-e2",
  outlined: "border border-md-outline text-md-primary",
  text: "text-md-primary",
};

const DISABLED: Record<MdButtonVariant, string> = {
  filled: "disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]",
  tonal: "disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]",
  elevated:
    "disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38] disabled:shadow-none",
  outlined: "disabled:border-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]",
  text: "disabled:text-md-on-surface/[0.38]",
};

const BASE =
  "state-layer press inline-flex select-none items-center justify-center rounded-full font-medium transition-[background-color,box-shadow,border-color] duration-fast ease-standard";

/** Build the shared class string. `ActionLink` uses this for its anchor. */
export function mdButtonClasses({
  variant = "filled",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: MdButtonVariant;
  size?: MdButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return clsx(BASE, VARIANT[variant], SIZE[size], fullWidth && "w-full", className);
}

/** Icon sizing, shared so a link's icons match a button's exactly. */
export function mdIconClasses(size: MdButtonSize = "md") {
  return clsx(
    "shrink-0",
    size === "sm"
      ? "[&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem]"
      : "[&>svg]:h-5 [&>svg]:w-5"
  );
}

// M3 heights: 40dp is the spec, but the product's touch floor is 48dp, so the
// medium and large sizes sit on 48/56 and only the small, dense variant uses 40.
const SIZE: Record<MdButtonSize, string> = {
  sm: "min-h-touch-min px-4 text-label-lg gap-1.5",
  md: "min-h-touch px-6 text-label-lg gap-2",
  lg: "min-h-[3.5rem] px-7 text-title-md gap-2.5",
};

export interface MdButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MdButtonVariant;
  size?: MdButtonSize;
  /** Leading icon — 18px on sm, 20px otherwise. Decorative; label carries meaning. */
  icon?: ReactNode;
  /** Stretch to the container. Dialog actions use this on phones. */
  fullWidth?: boolean;
}

export const MdButton = forwardRef<HTMLButtonElement, MdButtonProps>(function MdButton(
  { variant = "filled", size = "md", icon, fullWidth, className, children, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      // Buttons inside a <form> default to submit; an action button that
      // silently submits a form is a classic source of phantom navigations.
      type={type ?? "button"}
      className={clsx(
        mdButtonClasses({ variant, size, fullWidth }),
        "disabled:pointer-events-none",
        DISABLED[variant],
        className
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden className={mdIconClasses(size)}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});
