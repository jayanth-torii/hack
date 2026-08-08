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
  /** Soft lime spotlight behind the frame. */
  glow?: boolean;
}

/**
 * Vidhyora-branded illustration: a recolored (lime/cyan) vector scene shown
 * inside a soft light "window" frame, so the art reads clearly on both the
 * dark and light site themes. Use in empty states, page heroes, and brand
 * panels — never as decoration on every card.
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
          className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,rgba(201,243,29,0.28),transparent_72%)] blur-2xl"
        />
      )}
      <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#f0f2f8] via-[#f8f9fc] to-[#e6e9f2] shadow-inner ring-1 ring-inset ring-black/[0.06]">
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
