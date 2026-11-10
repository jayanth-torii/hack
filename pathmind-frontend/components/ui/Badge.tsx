import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type BadgeTone = "brand" | "success" | "warning" | "neutral";

/**
 * Tones are role **pairs**, never a tint of a raw hue: each one puts its
 * `on-*-container` text on its `*-container` background, so contrast is
 * guaranteed by the palette rather than by eyeballing an opacity. `neutral`
 * is the true M3 assist chip — a transparent container with an outline.
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "border-transparent bg-md-primary-container text-md-on-primary-container",
  success: "border-transparent bg-md-success-container text-md-on-success-container",
  warning: "border-transparent bg-md-warning-container text-md-on-warning-container",
  neutral: "border-md-outline-variant bg-md-surface-container text-md-on-surface-variant",
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}

/**
 * Material 3 **assist chip**: 32dp tall, 8dp corners, Label Large, with an
 * optional 18dp leading icon.
 *
 * Every badge in the product carries a word as well as a colour — freshness,
 * difficulty, stage state — so status is never signalled by hue alone
 * (CLAUDE.md §6). The icon, when present, is a redundant cue on top of that,
 * not a replacement for the label.
 *
 * `shimmer` keeps the sweep the freshness badge uses, now drawn in
 * `currentColor` so it reads on every tone instead of assuming a white
 * highlight on a dark chip.
 */
export function Badge({ tone = "neutral", icon, children, className, shimmer }: BadgeProps) {
  return (
    <span
      className={clsx(
        "relative inline-flex h-8 shrink-0 items-center gap-1.5 overflow-hidden rounded-sm border px-3 text-label-lg",
        TONE_CLASSES[tone],
        className
      )}
    >
      {shimmer && (
        <span
          className="pointer-events-none absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent,45%,currentColor,55%,transparent)] bg-[length:200%_100%] opacity-20"
          aria-hidden
        />
      )}
      {icon && (
        <span
          aria-hidden
          className="relative flex shrink-0 items-center [&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem]"
        >
          {icon}
        </span>
      )}
      <span className="relative truncate">{children}</span>
    </span>
  );
}
