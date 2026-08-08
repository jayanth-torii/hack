"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { clsx } from "@/lib/clsx";
import { SearchBar } from "@/components/ui/SearchBar";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { useAuthStore } from "@/store/authStore";

const HeroScene3D = dynamic(() => import("@/components/home/HeroScene3D"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-72 animate-pulse rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(201,243,29,0.14),transparent_65%)]" />
  ),
});

const HEADLINE = ["Turn any topic", "into a sequenced", "learning roadmap"];

const HERO_STATS = [
  { value: "5–8", label: "difficulty-sequenced stages" },
  { value: "3", label: "difficulty tiers" },
  { value: "0", label: "AI-invented links" },
];

/**
 * Home hero, restyled on the Acjon "Digital Agency" landing (index.html):
 * near-black canvas, `// eyebrow`, a huge display headline, the lime CTA
 * search bar, a stat row and a floating 3D roadmap preview.
 *
 * Animation split per the site's motion stack:
 *  - GSAP: a mount timeline (masked line-by-line headline reveal, stagger of
 *    the remaining blocks) + scroll-scrubbed parallax on the glows and the
 *    3D panel (ScrollTrigger, scrub:true).
 *  - Framer Motion: the bouncing "scroll to explore" hint.
 * Both are skipped/never-blocking under prefers-reduced-motion.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const user = useAuthStore((state) => state.user);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reduceMotion) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-eyebrow]", { y: 16, autoAlpha: 0, duration: 0.6 })
          .from(
            "[data-hero-line] > span",
            { yPercent: 118, duration: 0.95, stagger: 0.14, ease: "power4.out" },
            "-=0.25"
          )
          .from("[data-hero-sub]", { y: 20, autoAlpha: 0, duration: 0.7 }, "-=0.5")
          .from("[data-hero-search]", { y: 26, autoAlpha: 0, duration: 0.7 }, "-=0.5")
          .from("[data-hero-stats]", { y: 22, autoAlpha: 0, duration: 0.7 }, "-=0.55")
          .from(
            "[data-hero-scene]",
            { scale: 0.94, autoAlpha: 0, duration: 1.1, ease: "power2.out" },
            "-=0.8"
          );
      }

      // Scroll-scrubbed parallax: glows drift down while the 3D panel floats up.
      gsap.to("[data-hero-glow]", {
        yPercent: 32,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-scene]", {
        y: -72,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden bg-ink pt-24"
    >
      {/* Ambient glows + film-grain noise (Acjon hero texture equivalent) */}
      <div
        data-hero-glow
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_36rem_at_12%_-10%,rgba(201,243,29,0.12),transparent_60%),radial-gradient(44rem_32rem_at_100%_20%,rgba(56,189,248,0.1),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05]" />


      {/* Floating geometry fills the empty corners of the hero */}
      <GeometryShapes variant="hero" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-24 pt-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p
            data-hero-eyebrow
            className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-accent-text"
          >
            {"// AI digital twin for learning"}
          </p>

          <h1 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight text-paper sm:text-5xl xl:text-6xl">
            {HEADLINE.map((line, lineIdx) => (
              <span key={line} data-hero-line className="block overflow-hidden pb-1">
                <span className={clsx("block will-change-transform", lineIdx === HEADLINE.length - 1 && "text-accent")}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-sub
            className="mt-6 max-w-xl text-base leading-relaxed text-muted"
          >
            Syllabus, free resources, certifications, practice problems and a day-by-day
            timeline — difficulty-ordered, freshness-verified, and unlocked one stage at a time.
          </p>

          <div data-hero-search className="mt-9">
            {user ? (
              <SearchBar />
            ) : (
              <div className="flex flex-col items-start gap-4">
                <p className="text-sm text-subtle">Login to start building your path.</p>
                <a
                  href="/auth/login"
                  className="inline-block rounded-full bg-accent px-7 py-3 text-sm font-bold tracking-tight text-on-accent transition-colors hover:bg-accent/90"
                >
                  Login to build your path
                </a>
              </div>
            )}
          </div>

          <dl
            data-hero-stats
            className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line/10 pt-8"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-2xl font-semibold text-accent sm:text-3xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs leading-snug text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Floating 3D roadmap preview — desktop only (hidden on <lg) */}
        <div
          data-hero-scene
          className="relative hidden h-[30rem] lg:col-span-5 lg:block xl:h-[34rem]"
          aria-hidden
        >
          <div className="absolute inset-0">
            <HeroScene3D />
          </div>
        </div>
      </div>

      {/* Scroll hint — framer-motion bounce */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-muted"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-accent to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
