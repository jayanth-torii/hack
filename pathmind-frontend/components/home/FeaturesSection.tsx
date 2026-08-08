"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { TextReveal } from "./TextReveal";
import { GeometryShapes } from "./GeometryShapes";

// "Why Vidhyora": a sticky heading + four feature cards whose icons float on
// *animated* glowing backgrounds (breathing blobs, alternating lime/cyan).
// Below the grid, the product video runs edge-to-edge as a fullscreen band
// with a dark gradient and overlay copy. Reduced-motion users get static,
// fully-visible states.

interface Feature {
  icon: ReactNode;
  title: string;
  copy: string;
  /** tailwind classes for the animated glow behind the icon */
  glowBg: string;
  /** literal tailwind class for the pulsing ring (must be static for Tailwind) */
  ringBorder: string;
  iconColor: string;
}

const FEATURES: Feature[] = [
  {
    icon: <SparklesIcon />,
    title: "AI-generated syllabus",
    copy: "5–8 difficulty-sequenced stages built around your exact topic — theory alternates with practice, beginner to advanced.",
    glowBg: "bg-accent/25",
    ringBorder: "border-accent/50",
    iconColor: "text-accent",
  },
  {
    icon: <ShieldIcon />,
    title: "Freshness-verified resources",
    copy: "Every free resource is link-checked by a nightly worker. Dead links are replaced automatically, so the list never rots.",
    glowBg: "bg-cyan-400/25",
    ringBorder: "border-cyan-400/50",
    iconColor: "text-cyan-400",
  },
  {
    icon: <TargetIcon />,
    title: "Real practice arena",
    copy: "Curated LeetCode, CodeChef and HackerRank problems resolved from a maintained seed map — the AI never invents URLs.",
    glowBg: "bg-accent/25",
    ringBorder: "border-accent/50",
    iconColor: "text-accent",
  },
  {
    icon: <CalendarIcon />,
    title: "Calendar export",
    copy: "Push your day-by-day plan straight into Google Calendar, or download an .ics that imports into any calendar app.",
    glowBg: "bg-cyan-400/25",
    ringBorder: "border-cyan-400/50",
    iconColor: "text-cyan-400",
  },
];

const LINK_ICON = (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
    <path d="M1.01301 10.9362L10.9225 1.65031L3.41074 2.83889" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="relative overflow-hidden bg-ink py-28">
      <GeometryShapes variant="features" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
              {"// Why Vidhyora"}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-paper md:text-4xl">
              <TextReveal
                lines={["Everything you need", "to actually finish", "a roadmap"]}
              />
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Static resource lists die the moment they&apos;re published. Vidhyora keeps every
              link alive, sequences everything by difficulty, and makes progress stick.
            </p>
          </Reveal>

          <Reveal
            stagger={0.12}
            className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-8"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group border-t border-line/10 pt-8 transition-colors hover:border-accent/60"
              >
                {/* Icon on an animated glowing background */}
                <div className="relative flex h-14 w-14 items-center justify-center">
                  {/* breathing glow blob */}
                  <motion.span
                    aria-hidden
                    className={`absolute inset-0 rounded-2xl blur-md ${feature.glowBg}`}
                    animate={
                      reduce
                        ? undefined
                        : { opacity: [0.45, 1, 0.45], scale: [0.85, 1.2, 0.85] }
                    }
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* soft ring pulse */}
                  <motion.span
                    aria-hidden
                    className={`absolute inset-0 rounded-2xl border ${feature.ringBorder}`}
                    animate={
                      reduce ? undefined : { scale: [1, 1.25], opacity: [0.6, 0] }
                    }
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                  />
                  <span className={`relative transition-colors duration-300 group-hover:text-on-accent ${feature.iconColor}`}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-medium text-paper">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{feature.copy}</p>
                <Link
                  href="#start"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-subtle transition-colors hover:text-accent"
                >
                  <span className="border-b border-current pb-0.5">Try it</span>
                  <span className="transition-transform group-hover:translate-x-1">{LINK_ICON}</span>
                </Link>
              </motion.div>
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
        className="relative mt-24 h-[72vh] w-full overflow-hidden border-y border-white/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/45 to-[#010103]/25" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.04]" />

        {/* overlay content */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {"// See it in action"}
          </p>
          <h3 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight text-paper md:text-5xl">
            From topic to{" "}
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              full roadmap
            </span>{" "}
            in seconds
          </h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-subtle md:text-base">
            Type a topic. Vidhyora sequences it into stages, resources and a daily plan —
            then walks with you, stage by stage.
          </p>
          <a
            href="#start"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold tracking-tight text-on-accent transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30"
          >
            Build your path
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>

        {/* bottom-left badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#010103]/70 px-3.5 py-1.5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
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
