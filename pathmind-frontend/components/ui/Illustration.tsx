"use client";

import { clsx } from "@/lib/clsx";

/**
 * Semantic art slots. The name says what the art is *for*, never which file it
 * is, so a slot can be repointed at a better render without touching call
 * sites.
 */
export type IllustrationName =
  | "adventure-map"
  | "authentication"
  | "events-calendar"
  | "no-data"
  | "profile"
  | "progress-overview"
  | "save-to-bookmarks"
  | "secure-login"
  // Added with the 3D switch — slots the generic SVG set never had.
  | "practice"
  | "resources"
  | "generate"
  | "export"
  | "certificate";

interface Art {
  src: string;
  /** Intrinsic size, so a caller only ever has to choose a width. */
  w: number;
  h: number;
  /**
   * True when the render is **opaque** — it has its own dark backdrop baked
   * in rather than an alpha channel.
   *
   * This is not a style preference. The four `step-*` renders ship fully
   * opaque (alpha 255 everywhere) while the other nine are cut out, so
   * floating a `step-*` on the page draws a hard-edged rectangle of
   * not-quite-surface colour. Framed, the same edge reads as a deliberate
   * card. Check the alpha channel before adding a render here.
   */
  framed?: boolean;
}

/**
 * Slot → branded render in `public/3d`.
 *
 * The mapping is deliberately not 1:1: `authentication` and `secure-login`
 * are the same idea seen from two call sites, so they share `step-unlock`.
 * Pointing two slots at one file is fine; inventing a slot that means "this
 * particular png" is not.
 */
const ART: Record<IllustrationName, Art> = {
  "adventure-map": { src: "/3d/layers.png", w: 259, h: 263 },
  "events-calendar": { src: "/3d/calendar.png", w: 512, h: 496 },
  profile: { src: "/3d/desk-scene.png", w: 981, h: 653 },
  "progress-overview": { src: "/3d/slide-structured.png", w: 1400, h: 918 },
  "save-to-bookmarks": { src: "/3d/slide-certified.png", w: 963, h: 896 },
  certificate: { src: "/3d/slide-certified.png", w: 963, h: 896 },
  practice: { src: "/3d/code.png", w: 512, h: 368 },
  resources: { src: "/3d/link-check.png", w: 315, h: 263 },
  // Opaque, wide renders — framed.
  authentication: { src: "/3d/step-unlock.png", w: 592, h: 270, framed: true },
  "secure-login": { src: "/3d/step-unlock.png", w: 592, h: 270, framed: true },
  "no-data": { src: "/3d/step-search.png", w: 592, h: 244, framed: true },
  generate: { src: "/3d/step-ai.png", w: 593, h: 244, framed: true },
  export: { src: "/3d/step-export.png", w: 593, h: 270, framed: true },
};

interface IllustrationProps {
  name: IllustrationName;
  /** Wrapper classes (size/position). */
  className?: string;
  imgClassName?: string;
  alt?: string;
  /** Soft primary-tinted spotlight behind the art. */
  glow?: boolean;
}

/**
 * Vidhyora brand art: a 3D render sitting directly on the dark canvas.
 *
 * This used to be a flat vector scene inside a deliberately *light* frame,
 * because the generic illustration set was drawn for white backgrounds and
 * vanished without one. The result was a bright rectangle punched into every
 * dark screen — most visibly a white card on the study calendar — and art that
 * looked nothing like the landing page it sat two clicks away from.
 *
 * The renders in `public/3d` are lit for a dark scene and carry their own
 * transparency, so they need no frame at all. Losing the frame is the whole
 * point: the art now shares a surface with everything around it.
 */
export function Illustration({
  name,
  className,
  imgClassName,
  alt = "",
  glow = false,
}: IllustrationProps) {
  const art = ART[name];

  return (
    <div className={clsx("relative isolate", className)}>
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgb(var(--md-source)/0.30),transparent_70%)] blur-3xl"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.src}
        alt={alt}
        width={art.w}
        height={art.h}
        draggable={false}
        // `h-auto` with the intrinsic ratio means a caller picks a width and
        // the art keeps its own proportions. A fixed height on the wrapper
        // still caps it through `max-h-full`, so existing call sites that size
        // both axes letterbox rather than stretch.
        style={{ aspectRatio: `${art.w} / ${art.h}` }}
        className={clsx(
          "h-auto max-h-full w-full select-none object-contain",
          art.framed
            ? "rounded-lg shadow-e2 ring-1 ring-md-outline-variant/60"
            : "drop-shadow-[0_18px_40px_rgb(0_0_0/0.45)]",
          imgClassName
        )}
      />
    </div>
  );
}
