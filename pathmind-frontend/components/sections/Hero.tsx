"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { clsx } from "@/lib/clsx";
import { SearchBar } from "@/components/ui/SearchBar";
import { ActionLink, ArrowForwardIcon } from "@/components/home/ActionLink";
import { useAuthStore } from "@/store/authStore";

/* ── Icons ──────────────────────────────────────────────────────────────
   Inline SVG on the project's 24px grid. No icon library — CLAUDE.md §1. */

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2.5l2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2 2-5.6z" fill="currentColor" />
      <path d="M19 15.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" fill="currentColor" opacity=".65" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3.2l8.4 4.3-8.4 4.3-8.4-4.3L12 3.2z" fill="currentColor" />
      <path d="M4.2 12.1l7.8 4 7.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.2 16.3l7.8 4 7.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M13 2.5L4.8 13.2a.6.6 0 00.48.97H11l-.9 7.33 8.2-10.7a.6.6 0 00-.48-.97H12.1L13 2.5z" fill="currentColor" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="13" width="4" height="7.5" rx="1.2" fill="currentColor" />
      <rect x="10" y="8.5" width="4" height="12" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="3.5" width="4" height="17" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3.6 5.2A14.6 14.6 0 0112 4a14.6 14.6 0 018.4 1.2v13A14.6 14.6 0 0012 17a14.6 14.6 0 00-8.4 1.2v-13z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 4.6v12.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9.2 7.5L4.6 12l4.6 4.5M14.8 7.5L19.4 12l-4.6 4.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 4.2h10v4.3a5 5 0 11-10 0V4.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 5.6H4.4v1.6A3.2 3.2 0 007.2 10.3M17 5.6h2.6v1.6a3.2 3.2 0 01-2.8 3.1M9.6 19.8h4.8M12 13.6v6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9.5 7.8v8.4a.6.6 0 00.92.5l6.3-4.2a.6.6 0 000-1l-6.3-4.2a.6.6 0 00-.92.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="8" y="6.5" width="2.8" height="11" rx="1" fill="currentColor" />
      <rect x="13.2" y="6.5" width="2.8" height="11" rx="1" fill="currentColor" />
    </svg>
  );
}

/* ── Slide content ──────────────────────────────────────────────────────── */

/** An accent word with the self-drawing underline used across all three slides. */
function Underlined({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block text-md-primary">
      {children}
      {/* preserveAspectRatio="none" stretches the stroke, so a wide phrase
          needs a thinner nominal width to land at the same visual weight. */}
      <svg
        aria-hidden
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        className="absolute -bottom-1 left-0 h-[0.4rem] w-full overflow-visible"
      >
        <path
          data-hero-underline
          d="M3 8.5Q 54 2.6 104 6.2T 197 4.2"
          stroke="currentColor"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="260"
        />
      </svg>
    </span>
  );
}

/** Each headline line is masked and revealed on its own, so `lines` stays flat. */
interface Slide {
  id: string;
  label: string;
  badge?: string;
  lines: ReactNode[];
  body: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  extras: "chips" | "steps" | null;
  art: { src: string; width: number; height: number };
}

const CHIPS = [
  { icon: LayersIcon, label: "Personalised Path" },
  { icon: BoltIcon, label: "Verified Resources" },
  { icon: ChartIcon, label: "Track Progress" },
];

const STEPS = [
  { icon: TargetIcon, label: "Plan" },
  { icon: BookIcon, label: "Learn" },
  { icon: CodeIcon, label: "Practice" },
  { icon: TrophyIcon, label: "Achieve" },
];

const SLIDES: Slide[] = [
  {
    id: "roadmap",
    label: "Turn any topic into a sequenced learning roadmap",
    badge: "AI-Powered Learning Roadmaps",
    lines: [
      <>Turn any topic into a</>,
      <>
        sequenced <Underlined>learning</Underlined>
      </>,
      <span className="text-md-primary" key="roadmap">
        roadmap
        <SparkIcon className="ml-1 inline-block h-5 w-5 align-super sm:h-6 sm:w-6" />
      </span>,
    ],
    body: "Syllabus, free resources, certifications, practice problems and a day-by-day timeline — difficulty-ordered, freshness-verified, and unlocked one stage at a time.",
    primary: { label: "Login to build your path", href: "/auth/login" },
    secondary: { label: "See how it works", href: "#how" },
    extras: "chips",
    art: { src: "/3d/hero-scene.png", width: 1344, height: 868 },
  },
  {
    id: "certified",
    label: "Plan, learn, practice and get certified",
    badge: "All-in-One Learning Platform",
    lines: [
      <>Plan · Learn · Practice ·</>,
      <Underlined key="certified">Get Certified</Underlined>,
    ],
    body: "Everything you need to learn a new skill — from syllabus and verified resources to hands-on practice and industry-recognised certifications.",
    primary: { label: "Build Your Roadmap", href: "/auth/login" },
    secondary: { label: "Watch Demo", href: "#demo" },
    extras: null,
    art: { src: "/3d/slide-certified.png", width: 963, height: 896 },
  },
  {
    id: "structured",
    label: "Learn in a structured way",
    lines: [<>Learn in a</>, <Underlined key="structured">Structured Way</Underlined>],
    body: "Get a step-by-step roadmap, curated resources, practice problems, and track your progress — all in one place.",
    primary: { label: "Build Your Roadmap", href: "/auth/login" },
    secondary: { label: "See how it works", href: "#how" },
    extras: "steps",
    art: { src: "/3d/slide-structured.png", width: 1400, height: 918 },
  },
];

const ADVANCE_MS = 7000;

/**
 * Home hero — a three-slide carousel.
 *
 * Each slide pairs copy (badge, masked display headline with a self-drawing
 * accent underline, body, action pair, and either capability chips or a
 * four-step flow) with a 3D scene on the right.
 *
 * All motion is GSAP so the hero stays on one library end to end
 * (CLAUDE.md §1): the entrance timeline re-runs on every slide change, the
 * underline draws itself, and the scene floats on an inner wrapper while the
 * scroll parallax drives the outer one, so the two never fight over the same
 * transform.
 *
 * Auto-advance is paused by pointer hover, by keyboard focus inside the hero,
 * by the explicit pause control (WCAG 2.2.2 — auto-updating content needs a
 * mechanism to stop it) and entirely under prefers-reduced-motion, where every
 * entrance and loop is skipped and the slide simply appears.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const user = useAuthStore((state) => state.user);

  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const playing = !userPaused && !interacting && !reduceMotion;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      ADVANCE_MS
    );
    return () => window.clearInterval(id);
  }, [playing]);

  const go = useCallback((next: number) => {
    setActive(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const onDotKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(active - 1);
    }
  };

  // Entrance timeline — re-runs whenever the active slide changes.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from("[data-hero-badge]", { y: -18, autoAlpha: 0, duration: 0.5 })
          .from(
            "[data-hero-line] > span",
            { yPercent: 118, duration: 0.85, stagger: 0.12, ease: "power4.out" },
            "-=0.2"
          )
          .from("[data-hero-sub]", { y: 22, autoAlpha: 0, duration: 0.6 }, "-=0.4")
          .from("[data-hero-cta]", { y: 18, autoAlpha: 0, duration: 0.55 }, "-=0.4")
          .from(
            "[data-hero-chip]",
            { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.1 },
            "-=0.35"
          )
          .from(
            "[data-hero-scene]",
            { x: 70, scale: 0.92, autoAlpha: 0, duration: 1.1, ease: "power2.out" },
            "-=1.15"
          );

        gsap.fromTo(
          "[data-hero-underline]",
          { strokeDashoffset: 260 },
          { strokeDashoffset: 0, duration: 0.95, delay: 0.85, ease: "power2.inOut" }
        );

        gsap.to("[data-hero-float]", {
          y: -14,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to("[data-hero-ambient]", {
          opacity: 0.85,
          scale: 1.12,
          duration: 3.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      gsap.to("[data-hero-glow]", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-scene]", {
        y: -64,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
    }, section);

    return () => ctx.revert();
  }, [active]);

  // SLIDES is a non-empty literal, so this never falls through — the guard is
  // only here to satisfy noUncheckedIndexedAccess without an assertion. Every
  // hook above runs before it, so the early return is safe.
  const slide = SLIDES[active] ?? SLIDES[0];
  if (!slide) return null;

  // Lowest emphasis of the pair — M3 text button, so the filled primary beside
  // it is unmistakably the one action of this view.
  const secondaryAction = (
    <ActionLink href={slide.secondary.href} variant="text" size="lg" icon={<PlayIcon />}>
      {slide.secondary.label}
    </ActionLink>
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-roledescription="carousel"
      aria-label="Vidhyora highlights"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      // min-h-screen-safe uses 100svh: 100vh ignores the mobile browser
      // chrome, so the hero used to jump as the URL bar collapsed.
      className="min-h-screen-safe relative flex items-center overflow-hidden bg-md-surface pt-[calc(var(--app-bar-h)+var(--safe-top)+1.5rem)] sm:pt-24"
    >
      {/* Ambient warmth + film grain. The gradients carry the vivid brand
          source colour rather than the M3 primary role: they sit on their own
          dark field, which is exactly the case `--md-source` is kept for. */}
      <div
        data-hero-glow
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_32rem_at_6%_-10%,rgb(var(--md-source)/0.12),transparent_62%),radial-gradient(54rem_40rem_at_92%_34%,rgb(var(--md-source)/0.16),transparent_64%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />

      <div
        key={slide.id}
        role="group"
        aria-roledescription="slide"
        aria-label={`${active + 1} of ${SLIDES.length}: ${slide.label}`}
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-24 pt-6 sm:px-6 sm:pb-28 lg:grid-cols-12 lg:gap-6"
      >
        {/* ── Copy ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6">
          {slide.badge && (
            <div
              data-hero-badge
              // M3 suggestion chip: a tonal container, not an outlined accent
              // pill, so the badge sits one step above the surface instead of
              // competing with the primary CTA.
              className="inline-flex min-h-[2rem] items-center gap-2 rounded-sm bg-md-primary-container py-1.5 pl-3 pr-3.5 text-md-on-primary-container"
            >
              <SparkIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              <span className="text-label-lg">{slide.badge}</span>
            </div>
          )}

          <h1
            className={clsx(
              // M3 display scale. The 1.875rem floor is the phone minimum the
              // mobile pass landed on and must not creep back up; above `sm`
              // the real Display Medium/Large steps take over.
              "text-md-on-surface",
              "text-[1.875rem] sm:text-display-md xl:text-display-lg",
              // The scale's own line-heights are set for a single line; these
              // headlines run to three masked lines, so they are tightened
              // deliberately — and tracked in, as M3 does at display sizes.
              "leading-[1.18] tracking-[-0.01em] sm:leading-[1.1] xl:leading-[1.06]",
              slide.badge ? "mt-6" : "mt-0"
            )}
          >
            {slide.lines.map((line, i) => (
              <span
                key={i}
                data-hero-line
                className="block overflow-hidden pb-1 last:pb-2"
              >
                <span className="block will-change-transform">{line}</span>
              </span>
            ))}
          </h1>

          <p data-hero-sub className="mt-7 max-w-xl text-body-lg text-md-on-surface-variant">
            {slide.body}
          </p>

          <div data-hero-cta className="mt-9">
            {user ? (
              <div className="flex flex-col gap-5">
                <SearchBar />
                <div className="w-fit">{secondaryAction}</div>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                {/* The one filled button on the landing page. */}
                <ActionLink
                  href={slide.primary.href}
                  variant="filled"
                  size="lg"
                  fullWidth
                  className="sm:w-auto"
                  trailingIcon={<ArrowForwardIcon />}
                >
                  {slide.primary.label}
                </ActionLink>
                {secondaryAction}
              </div>
            )}
          </div>

          {slide.extras === "chips" && (
            <ul className="mt-10 flex flex-wrap gap-3">
              {CHIPS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  data-hero-chip
                  // M3 assist chip — 8dp corner, outlined, label-large.
                  className="flex min-h-[2rem] items-center gap-2 rounded-sm border border-md-outline-variant bg-md-surface-container px-3.5 py-1.5 text-label-lg text-md-on-surface-variant"
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-md-primary" />
                  {label}
                </li>
              ))}
            </ul>
          )}

          {slide.extras === "steps" && (
            <ol className="mt-10 flex flex-wrap items-start gap-x-2 gap-y-4 sm:gap-x-3">
              {STEPS.map(({ icon: Icon, label }, i) => (
                <li key={label} data-hero-chip className="flex items-center gap-2 sm:gap-3">
                  <span className="flex flex-col items-center gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-md-primary-container text-md-on-primary-container">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-label-lg text-md-on-surface">{label}</span>
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="mb-6 text-md-outline">
                      <ArrowForwardIcon className="h-5 w-5" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Scene ───────────────────────────────────────────────────── */}
        <div
          data-hero-scene
          aria-hidden
          className="relative mx-auto w-full max-w-2xl lg:col-span-6 lg:max-w-none"
        >
          <div
            data-hero-ambient
            className="pointer-events-none absolute left-1/2 top-[22%] aspect-square w-[72%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.34),rgb(var(--md-source)/0.06)_58%,transparent_74%)] opacity-60 blur-3xl"
          />
          <div data-hero-float data-scene-stage className="relative">
            <Image
              src={slide.art.src}
              alt=""
              width={slide.art.width}
              height={slide.art.height}
              priority={active === 0}
              sizes="(max-width: 1024px) 94vw, 50vw"
              // Alpha is baked into these assets — a blend mode would be scoped
              // to the GSAP transform's stacking context and show the frame.
              className="h-auto w-full select-none"
            />
          </div>
        </div>
      </div>

      {/* ── Slide controls ────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-7 z-20 flex items-center justify-center gap-4 sm:bottom-9">
        <div
          className="flex items-center gap-2.5"
          role="tablist"
          aria-label="Choose slide"
          onKeyDown={onDotKeyDown}
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}: ${s.label}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => go(i)}
              // The visible bar is small, so the button grows its hit area
              // with padding and pulls it back with an equal negative margin:
              // 44px tall, and as wide as the gap allows without the three
              // targets overlapping each other.
              className="group -mx-2 -my-[1.1875rem] px-2 py-[1.1875rem]"
            >
              <span
                className={clsx(
                  "block h-1.5 rounded-full transition-all duration-base ease-emphasized",
                  i === active
                    ? "w-7 bg-md-primary"
                    : "w-1.5 bg-md-outline-variant group-hover:bg-md-outline"
                )}
              />
            </button>
          ))}
        </div>

        {!reduceMotion && (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            aria-label={userPaused ? "Resume slideshow" : "Pause slideshow"}
            className="press state-layer flex h-11 w-11 items-center justify-center rounded-full border border-md-outline-variant text-md-on-surface-variant transition-colors duration-fast"
          >
            {userPaused ? <PlayIcon className="h-4 w-4 translate-x-px" /> : <PauseIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </section>
  );
}
