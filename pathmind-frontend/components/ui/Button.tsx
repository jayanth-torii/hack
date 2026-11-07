"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
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
 * Variants now map to the semantic token layer rather than hardcoded
 * slate/brand hex, so every one of them works in both themes. Previously
 * `primary`, `secondary` and `ghost` baked in dark-mode slate colours and
 * rendered as low-contrast grey-on-white in light mode.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  // Signature lime CTA — the one primary action on a screen.
  accent:
    "bg-accent text-on-accent font-bold tracking-tight shadow-e2 hover:bg-accent-hover active:bg-accent-hover disabled:bg-line/15 disabled:text-muted disabled:shadow-none",
  primary:
    "bg-brand-500 text-white font-semibold shadow-e2 hover:bg-brand-600 disabled:bg-line/15 disabled:text-muted disabled:shadow-none",
  // Tonal — a secondary action that still needs presence.
  tonal:
    "bg-accent/12 text-accent-text font-semibold hover:bg-accent/20 disabled:bg-line/10 disabled:text-muted",
  outlined:
    "border border-line/20 bg-transparent text-subtle font-medium hover:border-accent/50 hover:text-accent disabled:border-line/10 disabled:text-muted",
  ghost:
    "bg-transparent text-subtle font-medium hover:bg-line/8 hover:text-paper disabled:text-muted",
  danger:
    "bg-danger text-white font-semibold shadow-e2 hover:brightness-110 disabled:bg-line/15 disabled:text-muted disabled:shadow-none",
};

/**
 * Heights hit the 48px comfortable touch target at `md` and the 44px iOS
 * floor at `sm`. `lg` is for the single hero CTA on a screen.
 */
const SIZE_CLASSES: Record<Size, string> = {
  sm: "min-h-touch-min px-4 text-sm rounded-sm gap-1.5",
  md: "min-h-touch px-5 text-sm rounded-sm gap-2",
  lg: "min-h-[3.25rem] px-7 text-base rounded-md gap-2",
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
    <button
      ref={ref}
      type={type}
      // Disabling while loading is what actually prevents the double
      // submission; aria-busy tells assistive tech why nothing responds.
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={clsx(
        "press inline-flex select-none items-center justify-center whitespace-nowrap transition-colors duration-fast ease-standard",
        "disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  )
);
Button.displayName = "Button";
