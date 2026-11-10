"use client";

import { clsx } from "@/lib/clsx";

export type IllustrationName =
  | "adventure-map"
  | "authentication"
  | "events-calendar"
  | "no-data"
  | "profile"
  | "progress-overview"
  | "save-to-bookmarks"
  | "secure-login";

interface IllustrationProps {
  name: IllustrationName;
  /** Wrapper classes (size/position). */
  className?: string;
  imgClassName?: string;
  alt?: string;
  /** Soft primary-tinted spotlight behind the frame. */
  glow?: boolean;
}

/**
 * Vidhyora-branded illustration: a vector scene shown inside a soft light
 * "window" frame, so the art reads clearly against the dark canvas. Use in
 * empty states, page heroes and brand panels — never as decoration on every
 * card.
 *
 * The frame is deliberately *light*, and gets that from `inverse-surface`
 * rather than from the three hand-picked off-whites it used to hardcode.
 * That is exactly what the inverse role is for — a surface in the opposite
 * tone to the scheme — so the illustrations keep the bright backing the art
 * needs while still taking their colour from the palette.
 */
export function Illustration({
  name,
  className,
  imgClassName,
  alt = "",
  glow = false,
}: IllustrationProps) {
  return (
    <div className={clsx("relative isolate", className)}>
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-[radial-gradient(circle_at_50%_35%,rgb(var(--md-primary)/0.28),transparent_72%)] blur-2xl"
        />
      )}
      <div className="h-full w-full overflow-hidden rounded-xl bg-md-inverse-surface shadow-inner ring-1 ring-inset ring-md-scrim/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/illustrations/${name}.svg`}
          alt={alt}
          draggable={false}
          className={clsx("h-full w-full select-none", imgClassName)}
        />
      </div>
    </div>
  );
}
