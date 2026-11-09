"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { useAuthStore } from "@/store/authStore";
import { gsap } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

/* ── Icons ──────────────────────────────────────────────────────────────
   Inline SVG on the project's 24px grid with round caps. No icon library —
   see CLAUDE.md section 1. */

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" fill="currentColor" />
      <path
        d="M18.5 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"
        fill="currentColor"
        opacity=".6"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 2.5L4.8 13.2a.6.6 0 00.48.97H11l-.9 7.33 8.2-10.7a.6.6 0 00-.48-.97H12.1L13 2.5z"
        fill="currentColor"
      />
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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.25" y="5.25" width="17.5" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17M8 3.5v3.5M16 3.5v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7" y="13" width="3" height="3" rx="0.9" fill="currentColor" />
      <rect x="12.5" y="13" width="3" height="3" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9.5 7.8v8.4a.6.6 0 00.92.5l6.3-4.2a.6.6 0 000-1l-6.3-4.2a.6.6 0 00-.92.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 12.5l4.2 4.2 8.8-9.4"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Content ────────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: BoltIcon, line1: "Personalized", line2: "Roadmap" },
  { icon: ChartIcon, line1: "Track", line2: "Your Progress" },
  { icon: CalendarIcon, line1: "Sync", line2: "Assignments" },
];

/** The sequence shown in the floating card — illustrative, not live data. */
const SEQUENCE = [
  { label: "Learn Basics", state: "done" as const },
  { label: "Build Projects", state: "current" as const },
  { label: "Get Job Ready", state: "todo" as const },
];

/**
 * Closing CTA, directly above the footer.
 *
 * A badge, a two-line display headline whose second line sits on a solid
 * accent highlight, the value line, a three-up capability row and a
 * primary/secondary action pair — set beside the learner photo, which floats
 * under a warm disc with three glass cards previewing the product surface.
 *
 * The entire right-hand composition is `aria-hidden`: the cards are a stylised
 * mock-up of the app, and everything they claim is already said in the
 * headline and capability row, so announcing them again is pure noise.
 *
 * Motion split per CLAUDE.md section 7:
 *  - GSAP drives the masked headline reveal and the scrubbed glow parallax.
 *  - Framer Motion drives the per-card float loop and the progress fill.
 * Both no-op under prefers-reduced-motion, leaving the final layout visible.
 */
export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const user = useAuthStore((state) => state.user);
  const reduce = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reduceMotion) {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: section, start: "top 72%" },
        });
        tl.from("[data-cta-badge]", { y: 16, autoAlpha: 0, duration: 0.55 })
          .from(
            "[data-cta-line] > span",
            { yPercent: 118, duration: 0.9, stagger: 0.14, ease: "power4.out" },
            "-=0.2"
          )
          .from("[data-cta-sub]", { y: 20, autoAlpha: 0, duration: 0.6 }, "-=0.45")
          .from(
            "[data-cta-feature]",
            { y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.09 },
            "-=0.35"
          )
          .from("[data-cta-action]", { y: 20, autoAlpha: 0, duration: 0.6 }, "-=0.3")
          .from(
            "[data-cta-photo]",
            { scale: 0.94, autoAlpha: 0, duration: 1, ease: "power2.out" },
            "-=1.1"
          )
          .from("[data-cta-card]", { y: 24, autoAlpha: 0, duration: 0.65, stagger: 0.12 }, "-=0.55");
      }

      gsap.to("[data-cta-glow]", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  /** Gentle float for a glass card; a no-op when the user wants less motion. */
  const float = (duration: number, delay: number) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -10, 0] },
          transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const },
        };

  const seeHowItWorks = (
    <a
      href="#how"
      className="press group inline-flex min-h-touch items-center justify-center gap-3 rounded-full text-sm font-semibold text-subtle transition-colors duration-fast hover:text-accent-text sm:justify-start"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/50 text-accent-text transition-colors duration-fast group-hover:bg-accent/12">
        <PlayIcon className="h-5 w-5 translate-x-px" />
      </span>
      See how it works
    </a>
  );

  return (
    <section
      ref={sectionRef}
      id="start"
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
    >
      {/* Warm ambient glow + film grain */}
      <div
        data-cta-glow
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_34rem_at_8%_-8%,rgb(var(--color-accent)/0.14),transparent_62%),radial-gradient(52rem_40rem_at_88%_30%,rgb(var(--color-accent)/0.16),transparent_64%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-6">
          <div
            data-cta-badge
            className="inline-flex items-center gap-2.5 rounded-full border border-accent/40 bg-accent/[0.07] py-2 pl-3.5 pr-4 text-accent-text"
          >
            <SparkleIcon className="h-4 w-4 shrink-0" />
            <span className="text-[0.8125rem] font-semibold tracking-tight sm:text-sm">
              AI-Powered Learning Roadmap
            </span>
          </div>

          <h2 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.02] tracking-tight text-paper sm:text-6xl xl:text-7xl">
            <span data-cta-line className="block overflow-hidden pb-1.5">
              <span className="block will-change-transform">Ready to learn</span>
            </span>
            <span data-cta-line className="block overflow-hidden pb-2 pt-1">
              <span className="block will-change-transform">
                <span className="inline-block rounded-lg bg-accent px-3 pb-1.5 pt-0.5 text-on-accent shadow-e2 sm:px-4 sm:pb-2">
                  in sequence?
                </span>
              </span>
            </span>
          </h2>

          <p data-cta-sub className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            {user
              ? "Outline a personalized curriculum with verified courses, official docs and practice sets — then track every stage."
              : "Sign in to generate tailored roadmaps, save and track your stages, and sync assignments to your calendar."}
          </p>

          {/* Capability row */}
          <ul className="mt-10 flex flex-wrap items-start gap-x-7 gap-y-6 sm:gap-x-10">
            {FEATURES.map(({ icon: Icon, line1, line2 }, i) => (
              <li
                key={line1}
                data-cta-feature
                className={i > 0 ? "border-line/10 pl-7 sm:border-l sm:pl-10" : undefined}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/12 text-accent-text">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug text-paper">
                  {line1}
                  <br />
                  {line2}
                </p>
              </li>
            ))}
          </ul>

          {/* Actions — signed-out gets the login path, signed-in gets the search bar */}
          <div data-cta-action className="mt-10">
            {user ? (
              <div className="flex flex-col gap-5">
                <SearchBar />
                <div className="w-fit">{seeHowItWorks}</div>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
                <a
                  href="/auth/login"
                  className="press group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full bg-accent px-8 text-base font-bold tracking-tight text-on-accent shadow-e2 transition-colors duration-fast hover:bg-accent-hover"
                >
                  Login to build your path
                  <span aria-hidden className="transition-transform duration-base group-hover:translate-x-1">
                    →
                  </span>
                </a>
                {seeHowItWorks}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: photo + floating product cards ─────────────── */}
        <div aria-hidden className="relative mx-auto w-full max-w-xl lg:col-span-6 lg:max-w-none">
          {/* Warm disc behind the learner — a soft core plus a crisper rim, so
              it reads as a lit backdrop rather than an even wash. */}
          <div className="pointer-events-none absolute left-1/2 top-[6%] aspect-square w-[62%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-accent)/0.95)_0%,rgb(var(--color-accent)/0.80)_54%,rgb(var(--color-accent)/0)_68%)] blur-md" />
          <div className="pointer-events-none absolute left-1/2 top-[2%] aspect-square w-[74%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-accent)/0.30),rgb(var(--color-accent)/0.06)_58%,transparent_74%)] blur-3xl" />

          {/* Decorative accent arcs, echoing the reference composition */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full text-accent"
          >
            <path
              d="M8 62 Q 4 50 10 40"
              stroke="currentColor"
              strokeWidth="1.1"
              fill="none"
              strokeLinecap="round"
              opacity=".75"
            />
            <path
              d="M93 58 Q 97 48 92 39"
              stroke="currentColor"
              strokeWidth="1.1"
              fill="none"
              strokeLinecap="round"
              opacity=".6"
            />
          </svg>

          <div data-cta-photo className="relative">
            <Image
              src="/people/learner-hero.png"
              alt=""
              width={1200}
              height={880}
              sizes="(max-width: 1024px) 92vw, 46vw"
              // The cut-out includes the desk surface, which would otherwise
              // stop in a hard horizontal edge; the mask dissolves it into the
              // section background instead.
              // A heavy drop-shadow here sat on top of the warm disc and
              // greyed it out, so this stays deliberately light.
              className="relative z-10 h-auto w-full select-none drop-shadow-[0_14px_28px_rgb(0_0_0/0.4)] [mask-image:linear-gradient(to_bottom,#000_78%,transparent_97%)]"
            />
          </div>

          {/* Card — learning sequence */}
          <motion.div
            data-cta-card
            {...float(5.4, 0)}
            className="absolute left-0 top-[6%] z-20 w-[11.5rem] rounded-xl border border-accent/25 bg-card/50 p-3.5 shadow-e3 backdrop-blur-xl sm:w-[14rem] sm:p-4 lg:left-[-2%]"
          >
            <p className="text-[0.6875rem] font-semibold tracking-tight text-paper sm:text-sm">
              Your Learning Sequence
            </p>
            <ul className="mt-3 space-y-2.5">
              {SEQUENCE.map((step, i) => (
                <li key={step.label} className="relative flex items-center gap-2.5">
                  {i < SEQUENCE.length - 1 && (
                    <span className="absolute left-[8px] top-[18px] h-[14px] w-px bg-accent/40 sm:left-[10px] sm:top-[21px]" />
                  )}
                  <span
                    className={
                      step.state === "done"
                        ? "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent sm:h-[22px] sm:w-[22px]"
                        : step.state === "current"
                          ? "h-[18px] w-[18px] shrink-0 rounded-full bg-accent sm:h-[22px] sm:w-[22px]"
                          : "h-[18px] w-[18px] shrink-0 rounded-full border-2 border-accent/70 sm:h-[22px] sm:w-[22px]"
                    }
                  >
                    {step.state === "done" && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span className="text-[0.6875rem] leading-tight text-subtle sm:text-xs">
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card — progress */}
          <motion.div
            data-cta-card
            {...float(6.2, 0.6)}
            className="absolute right-0 top-0 z-20 w-[9.5rem] rounded-xl border border-accent/25 bg-card/50 p-3.5 shadow-e3 backdrop-blur-xl sm:w-[12rem] sm:p-4 lg:right-[-1%]"
          >
            <div className="flex items-start justify-between gap-2">
              <ChartIcon className="h-5 w-5 shrink-0 text-accent-text sm:h-6 sm:w-6" />
              <div className="text-right">
                <p className="text-[0.625rem] leading-none text-muted sm:text-xs">Progress</p>
                <p className="font-display text-xl font-bold leading-tight tabular-nums text-paper sm:text-2xl">
                  72%
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/12">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={reduce ? false : { width: "0%" }}
                whileInView={{ width: "72%" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Card — calendar sync */}
          <motion.div
            data-cta-card
            {...float(5.8, 1.1)}
            className="absolute right-0 top-[34%] z-20 hidden w-[11rem] items-center gap-3 rounded-xl border border-accent/25 bg-card/50 p-3.5 shadow-e3 backdrop-blur-xl sm:flex sm:w-[13rem] sm:p-4 lg:right-[-4%]"
          >
            <CalendarIcon className="h-7 w-7 shrink-0 text-accent-text" />
            <p className="text-xs font-semibold leading-snug text-paper sm:text-sm">
              Assignments
              <br />
              <span className="inline-flex items-center gap-1.5">
                Synced
                <CheckIcon className="h-3.5 w-3.5 text-success" />
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
