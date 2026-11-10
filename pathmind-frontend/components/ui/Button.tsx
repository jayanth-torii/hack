"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { MdButton, type MdButtonVariant } from "@/components/md/Button";
import { clsx } from "@/lib/clsx";

type Variant = "accent" | "primary" | "tonal" | "outlined" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  /** Visible label replaced by a spinner while loading; announced to
   *  assistive tech via aria-busy either way. */
  loadingLabel?: string;
  fullWidth?: boolean;
}

/**
 * The product's button, now a thin adapter over `md/Button`.
 *
 * The six names this component has always exported are a *palette*; Material's
 * five are an *emphasis ladder*. Mapping one onto the other is the whole job
 * here, so that every existing call site keeps its prop names while the pixels
 * become M3 — one source of truth for shape, state layers, elevation and
 * motion, instead of a second parallel button implementation.
 *
 *   accent · primary → filled    (the one key action on a screen)
 *   tonal            → tonal     (secondary action that still needs weight)
 *   outlined         → outlined  (neutral alternative)
 *   ghost            → text      (lowest emphasis)
 *   danger           → filled, recoloured onto the `error` role
 *
 * `danger` is built on the **text** variant plus explicit error colours rather
 * than on `filled`: that way there is no `bg-md-primary` for `bg-md-error` to
 * have to out-order in the stylesheet, and the destructive button's colour is
 * decided here rather than by Tailwind's class sort.
 */
const VARIANT_MAP: Record<Variant, MdButtonVariant> = {
  accent: "filled",
  primary: "filled",
  tonal: "tonal",
  outlined: "outlined",
  ghost: "text",
  danger: "text",
};

/**
 * M3's disabled recipe is the content colour at 12% (container) and 38%
 * (label). Those two percentages are **not** in Tailwind's default opacity
 * scale, so `/12` and `/38` compile to nothing at all and a disabled button
 * would keep its full-strength enabled colours. The bracket form is the one
 * that actually emits a rule.
 */
const DISABLED_CONTAINER = "disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]";
const DISABLED_LABEL = "disabled:text-md-on-surface/[0.38]";

const VARIANT_EXTRA: Record<Variant, string> = {
  accent: DISABLED_CONTAINER,
  primary: DISABLED_CONTAINER,
  tonal: DISABLED_CONTAINER,
  danger: `bg-md-error text-md-on-error ${DISABLED_CONTAINER}`,
  // M3's text button is `primary`-coloured; the product's `ghost` is a quiet
  // neutral control, so it keeps the on-surface-variant role.
  ghost: `text-md-on-surface-variant ${DISABLED_LABEL}`,
  outlined: `text-md-on-surface disabled:border-md-on-surface/[0.12] ${DISABLED_LABEL}`,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "accent",
      size = "md",
      isLoading = false,
      loadingLabel,
      fullWidth,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => (
    <MdButton
      ref={ref}
      type={type}
      variant={VARIANT_MAP[variant]}
      size={size}
      fullWidth={fullWidth}
      // Disabling while loading is what actually prevents the double
      // submission; aria-busy tells assistive tech why nothing responds.
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      icon={
        isLoading ? (
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : undefined
      }
      className={clsx("disabled:cursor-not-allowed", VARIANT_EXTRA[variant], className)}
      {...props}
    >
      {isLoading && loadingLabel ? loadingLabel : children}
    </MdButton>
  )
);
Button.displayName = "Button";
