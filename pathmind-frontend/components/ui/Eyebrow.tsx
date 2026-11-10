import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type Tone = "accent" | "cyan" | "muted";

interface EyebrowProps extends Omit<ComponentPropsWithoutRef<"p">, "children"> {
  children: ReactNode;
  /** `center` mirrors the hairline on both sides of the label. */
  align?: "start" | "center";
  tone?: Tone;
  /** Adds a small live dot before the label — for "available now" copy only. */
  live?: boolean;
  className?: string;
}

const TONE: Record<Tone, string> = {
  accent: "text-md-primary",
  cyan: "text-md-tertiary",
  muted: "text-md-on-surface-variant",
};

/**
 * Section eyebrow: a short accent hairline followed by a tracked, uppercase
 * label.
 *
 * This replaced a `{"// Label"}` code-comment affectation that was repeated
 * across fourteen screens. The rule carries the same "this is a kicker, not a
 * heading" signal without borrowing syntax from a different medium, and it
 * reads as deliberate typography rather than a leftover from an editor.
 *
 * The rules are `currentColor`, so tone changes recolour the whole unit.
 */
export function Eyebrow({
  children,
  align = "start",
  tone = "accent",
  live = false,
  className,
  ...rest
}: EyebrowProps) {
  const rule = "h-px w-7 shrink-0 bg-current opacity-45 sm:w-9";

  return (
    <p
      className={clsx(
        // Label Small, then widened: the wide tracking is the whole point of
        // an eyebrow, so this is one of the few places the type scale's own
        // letter-spacing is deliberately overridden.
        "flex items-center gap-3 text-label-sm uppercase tracking-[0.26em] sm:text-label-md sm:tracking-[0.3em]",
        align === "center" && "justify-center",
        TONE[tone],
        className
      )}
      {...rest}
    >
      {align === "center" ? (
        <span aria-hidden className={clsx(rule, "bg-gradient-to-l from-current to-transparent")} />
      ) : (
        <span aria-hidden className={rule} />
      )}

      {live && (
        <span aria-hidden className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}

      <span>{children}</span>

      {align === "center" && (
        <span aria-hidden className={clsx(rule, "bg-gradient-to-r from-current to-transparent")} />
      )}
    </p>
  );
}
