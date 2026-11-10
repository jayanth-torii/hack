"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { ActionLink, ArrowForwardIcon } from "./ActionLink";
import { Eyebrow } from "@/components/ui/Eyebrow";

// "Why Vidhyora": a left rail (eyebrow, headline, value line, 3D desk scene)
// beside a 2x2 grid of glass cards. Each card carries a solid accent icon tile,
// a "Try it" affordance, and a 3D product glyph bleeding out of its bottom-right
// corner. Below the grid, the product video still runs edge-to-edge as a
// fullscreen band. Reduced-motion users get static, fully-visible states.

interface Feature {
  icon: ReactNode;
  title: string;
  copy: string;
  /** 3D glyph in the card's bottom-right corner (public/3d) */
  art: string;
  /** How far the glyph is scaled up relative to the card */
  artClass: string;
}

const FEATURES: Feature[] = [
  {
    icon: <SparklesIcon />,
    title: "AI-generated syllabus",
    copy: "5–8 difficulty-sequenced stages built around your exact topic — theory alternates with practice, beginner to advanced.",
    art: "/3d/layers.png",
    artClass: "w-32 sm:w-36",
  },
  {
    icon: <ShieldIcon />,
    title: "Freshness-verified resources",
    copy: "Every free resource is link-checked by a nightly worker. Dead links are replaced automatically, so the list never rots.",
    art: "/3d/link-check.png",
    artClass: "w-28 sm:w-32",
  },
  {
    icon: <TargetIcon />,
    title: "Real practice arena",
    copy: "Curated LeetCode, CodeChef and HackerRank problems resolved from a maintained seed map — the AI never invents URLs.",
    art: "/3d/code.png",
    artClass: "w-32 sm:w-36",
  },
  {
    icon: <CalendarIcon />,
    title: "Calendar export",
    copy: "Push your day-by-day plan straight into Google Calendar, or download an .ics that imports into any calendar app.",
    art: "/3d/calendar.png",
    artClass: "w-28 sm:w-32",
  },
];

const ARROW_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4.5 12h14m0 0l-5.2-5.2M18.5 12l-5.2 5.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="relative overflow-hidden bg-md-surface py-24 sm:py-28">
      {/* Corner swooshes — warm light bleeding in from the edges, carried by
          the vivid brand source rather than the M3 primary role. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-[28rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.28),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.20),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-40 h-[26rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.16),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Left rail ──────────────────────────────────────────────── */}
          <Reveal className="lg:col-span-4">
            <Eyebrow>Why Vidhyora</Eyebrow>

            <h2 className="mt-5 text-headline-md leading-[1.2] text-md-on-surface sm:text-headline-lg sm:leading-[1.18] xl:text-display-sm xl:leading-[1.16]">
              Everything you need
              <br />
              to actually <span className="text-md-primary">finish</span>
              <br />
              <span className="relative inline-block">
                a <span className="text-md-primary">roadmap</span>
                <svg
                  aria-hidden
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-2 w-full text-md-primary"
                >
                  <path
                    d="M3 7.2Q 52 1.8 104 5.2T 197 4"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            <p className="mt-8 max-w-sm text-body-lg text-md-on-surface-variant">
              Static resource lists die the moment they&apos;re published. Vidhyora keeps every
              link alive, sequences everything by difficulty, and makes progress stick.
            </p>

            {/* 3D desk scene — the rail's anchor image */}
            <div aria-hidden data-scene-stage className="relative mt-10 lg:mt-14">
              <Image
                src="/3d/desk-scene.png"
                alt=""
                width={1000}
                height={653}
                sizes="(max-width: 1024px) 92vw, 30vw"
                // Alpha is baked into the asset; the mask only feathers the
                // lit desk reflection along the bottom edge.
                className="h-auto w-full max-w-md select-none [mask-image:linear-gradient(to_bottom,#000_84%,transparent_99%)] lg:max-w-none"
              />
            </div>
          </Reveal>

          {/* ── Card grid ──────────────────────────────────────────────── */}
          <Reveal stagger={0.12} className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            {FEATURES.map((feature) => (
              <motion.article
                key={feature.title}
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container p-6 shadow-e1 transition-colors duration-base ease-standard hover:bg-md-surface-container-high sm:p-7"
              >
                {/* 3D glyph bleeding out of the corner. Alpha is baked into the
                    asset: a blend mode would be scoped to the card's own
                    stacking context and leave a visible frame. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={feature.art}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  data-scene-glyph
                  className={`pointer-events-none absolute -bottom-5 -right-4 select-none ${feature.artClass}`}
                />

                <span className="relative flex h-12 w-12 items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container">
                  {feature.icon}
                </span>

                <h3 className="relative mt-5 text-title-lg text-md-on-surface">
                  {feature.title}
                </h3>

                <p className="relative mt-2.5 max-w-[23rem] text-body-md text-md-on-surface-variant">
                  {feature.copy}
                </p>

                {/* Lowest emphasis — one of four repeated affordances, so an
                    M3 text button rather than four outlined ones. */}
                <div className="relative mt-5 -ml-4">
                  <ActionLink
                    href="#start"
                    variant="text"
                    size="sm"
                    trailingIcon={ARROW_ICON}
                  >
                    Try it
                  </ActionLink>
                </div>
              </motion.article>
            ))}
          </Reveal>
        </div>
      </div>

      {/* Fullscreen video band — edge to edge */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1 }}
        className="relative mt-24 h-[72vh] w-full overflow-hidden border-y border-md-outline-variant"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/features.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Vidhyora in action"
        />

        {/* readability overlays */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-md-surface via-md-surface/45 to-md-surface/25"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.04]" />

        {/* overlay content */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center sm:px-6"
        >
          <Eyebrow align="center">See it in action</Eyebrow>
          <h3 className="mt-5 max-w-3xl text-headline-md leading-[1.2] text-md-on-surface md:text-display-md md:leading-[1.14]">
            From topic to <span className="text-md-primary">full roadmap</span> in seconds
          </h3>
          <p className="mt-4 max-w-md text-body-lg text-md-on-surface-variant">
            Type a topic. Vidhyora sequences it into stages, resources and a daily plan —
            then walks with you, stage by stage.
          </p>
          {/* M3's elevated button is the variant for a button that has to
              separate itself from a patterned background — here, moving video. */}
          <ActionLink
            href="#start"
            variant="elevated"
            size="lg"
            className="mt-9"
            trailingIcon={<ArrowForwardIcon />}
          >
            Build your path
          </ActionLink>
        </motion.div>

        {/* bottom-left badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-md-scrim/70 px-3.5 py-1.5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-md-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-md-primary" />
          </span>
          <span className="text-label-sm uppercase tracking-[0.2em] text-md-on-surface">
            Vidhyora in action
          </span>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Animated icons (framer-motion; transform-box keeps the spin/ripple centered) ---------- */

const SVG_ORIGIN = { transformBox: "fill-box" as const, transformOrigin: "center" };

function SparklesIcon() {
  const reduce = useReducedMotion();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.path
        d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { rotate: 360, scale: [1, 1.12, 1] }}
        transition={{
          rotate: { duration: 14, repeat: Infinity, ease: "linear" },
          scale: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.path
        d="M18.5 15.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"
        fill="currentColor"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="4.5"
        cy="4.5"
        r="1.1"
        fill="currentColor"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { opacity: [0.15, 0.9, 0.15] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
    </svg>
  );
}

function ShieldIcon() {
  const reduce = useReducedMotion();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <motion.path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M8.5 12l2.3 2.3 4.7-4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.35 }}
      />
    </svg>
  );
}

function TargetIcon() {
  const reduce = useReducedMotion();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      {[0, 1].map((i) => (
        <motion.circle
          key={i}
          cx="12"
          cy="12"
          r="5"
          stroke="currentColor"
          strokeWidth="1.2"
          style={SVG_ORIGIN}
          animate={reduce ? undefined : { scale: [1, 2.6], opacity: [0.6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 1.2 }}
        />
      ))}
      <motion.circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { scale: [1, 1.7], opacity: [1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

function CalendarIcon() {
  const reduce = useReducedMotion();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <motion.rect
        x="12"
        y="13"
        width="4"
        height="4"
        rx="0.8"
        fill="currentColor"
        style={SVG_ORIGIN}
        animate={reduce ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M8 15l2.5 2.5L16 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
      />
    </svg>
  );
}
