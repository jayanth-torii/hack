"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * "From curiosity to competence" — the four-step journey.
 *
 * Layout: a header (eyebrow, headline, value line, CTA) beside the desk
 * scene, then four wide step cards hung off a vertical timeline rail. Each
 * card carries its step label, a title whose final word is accented, the
 * explanation, a journey meter and a 3D illustration, with a ghost numeral
 * behind it.
 *
 * Motion is GSAP throughout (CLAUDE.md §1 — this section is entirely
 * scroll-driven, so it stays on one library): the rail fill and traveller dot
 * scrub with scroll position, cards rise as they enter, and each meter fills
 * once. Under prefers-reduced-motion nothing animates and the final state
 * renders directly.
 */

const STEPS = [
  {
    n: "01",
    title: "Type any",
    accent: "topic",
    copy: "Dynamic Programming, System Design, Sanskrit, Piano — just type what you want to master.",
    percent: 25,
    art: "/3d/step-search.png",
    artW: 526,
    artH: 230,
  },
  {
    n: "02",
    title: "AI builds your",
    accent: "path",
    copy: "A syllabus, free resources, certifications, practice problems and a daily timeline — all sequenced by difficulty.",
    percent: 50,
    art: "/3d/step-ai.png",
    artW: 593,
    artH: 244,
  },
  {
    n: "03",
    title: "Learn &",
    accent: "unlock",
    copy: "Finish a stage to unlock the next. Progress is enforced server-side, so it always sticks — no cheating your twin.",
    percent: 75,
    art: "/3d/step-unlock.png",
    artW: 592,
    artH: 267,
  },
  {
    n: "04",
    title: "Export &",
    accent: "track",
    copy: "Push the plan to your calendar, revisit your roadmap, and watch your progress dashboard fill up in real time.",
    percent: 100,
    art: "/3d/step-export.png",
    artW: 593,
    artH: 267,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const scrub = {
        trigger: "[data-rail]",
        start: "top 70%",
        end: "bottom 75%",
        scrub: 0.6,
      };

      // The rail fills and the traveller rides it, both driven by scroll.
      // Transform-only (scaleY / y) so neither touches layout.
      gsap.fromTo(
        "[data-rail-fill]",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", transformOrigin: "top center", scrollTrigger: scrub }
      );
      gsap.fromTo(
        "[data-rail-dot]",
        { y: 0 },
        {
          // Function-based so a resize recomputes the travel distance instead
          // of leaving the dot short of the end of the rail.
          y: () => document.querySelector("[data-rail-track]")?.clientHeight ?? 0,
          ease: "none",
          scrollTrigger: { ...scrub, invalidateOnRefresh: true },
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-step-card]").forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-meter]").forEach((meter) => {
        gsap.fromTo(
          meter,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "power2.out",
            transformOrigin: "left center",
            scrollTrigger: { trigger: meter, start: "top 92%" },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative overflow-hidden bg-ink py-20 text-paper sm:py-24"
    >
      {/* Corner swooshes — warm light bleeding in from the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--color-accent)/0.26),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-36 h-[26rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(var(--color-accent)/0.20),transparent_70%)] blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow>How it works</Eyebrow>

            <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              From curiosity to
              <br />
              <span className="text-accent">competence in four steps</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              One stage at a time — each step unlocks the next, so your momentum compounds
              and you never feel lost.
            </p>

            <a
              href="#start"
              className="press group mt-8 inline-flex min-h-touch items-center gap-2.5 rounded-full bg-accent px-7 text-sm font-bold tracking-tight text-on-accent shadow-[0_8px_30px_rgb(var(--color-accent)/0.25)] transition-colors duration-fast hover:bg-accent-hover"
            >
              Start now
              <span aria-hidden className="transition-transform duration-base group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>

          <div aria-hidden data-scene-stage className="relative lg:col-span-5">
            <Image
              src="/3d/how-header.png"
              alt=""
              width={846}
              height={356}
              sizes="(max-width: 1024px) 80vw, 38vw"
              className="mx-auto h-auto w-full max-w-sm select-none lg:max-w-none"
            />
          </div>
        </div>

        {/* ── Steps ──────────────────────────────────────────────────── */}
        <div data-rail className="relative mt-14 sm:mt-16">
          {/* Timeline rail — desktop only. On phones the step label carries the
              sequence, so the rail would be redundant decoration. */}
          <div aria-hidden className="absolute bottom-10 left-[27px] top-10 hidden w-px lg:block">
            <div data-rail-track className="relative h-full w-px bg-accent/20">
              <div
                data-rail-fill
                className="absolute inset-0 w-px bg-gradient-to-b from-accent to-accent-hover"
              />
              <span
                data-rail-dot
                className="absolute -left-[3px] top-0 h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_12px_3px_rgb(var(--color-accent)/0.55)]"
              />
            </div>
          </div>

          <ol className="space-y-5 sm:space-y-6">
            {STEPS.map((step) => (
              <li key={step.n} className="relative lg:pl-24">
                {/* Rail node */}
                <span
                  aria-hidden
                  className="absolute left-0 top-9 hidden h-14 w-14 items-center justify-center rounded-full border border-accent/50 bg-ink font-display text-sm font-bold text-accent shadow-[0_0_22px_rgb(var(--color-accent)/0.28)] lg:flex"
                >
                  {step.n}
                </span>

                <article
                  data-step-card
                  className="relative overflow-hidden rounded-xl border border-accent/20 bg-card/40 p-5 shadow-[0_0_60px_-20px_rgb(var(--color-accent)/0.5)] backdrop-blur-sm transition-colors duration-base hover:border-accent/45 sm:p-7"
                >
                  {/* Ghost numeral */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-3 right-4 select-none font-display text-6xl font-bold leading-none text-paper/[0.05] sm:text-7xl lg:text-8xl"
                  >
                    {step.n}
                  </span>

                  <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-subtle">
                          Step {step.n}
                        </span>
                        <span aria-hidden className="h-px w-5 bg-line/20" />
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </div>

                      <h3 className="mt-2.5 font-display text-xl font-bold tracking-tight sm:text-2xl">
                        {step.title} <span className="text-accent">{step.accent}</span>
                      </h3>

                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                        {step.copy}
                      </p>

                      {/* Journey meter — how far through the four steps this
                          stage sits, not a live reading of the user's own
                          progress. The label says "journey" for that reason. */}
                      <div className="mt-5 max-w-md">
                        <div className="flex items-center justify-between text-[0.625rem] font-bold uppercase tracking-[0.2em]">
                          <span className="text-subtle">Journey progress</span>
                          <span className="text-accent">{step.percent}%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/12">
                          <div
                            data-meter
                            className="h-full rounded-full bg-gradient-to-r from-accent-hover to-accent"
                            style={{ width: `${step.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step illustration */}
                    <div
                      aria-hidden
                      data-scene-stage
                      className="relative mx-auto w-44 shrink-0 sm:w-52 lg:w-64"
                    >
                      <Image
                        src={step.art}
                        alt=""
                        width={step.artW}
                        height={step.artH}
                        sizes="(max-width: 640px) 40vw, 14rem"
                        className="h-auto w-full select-none"
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
