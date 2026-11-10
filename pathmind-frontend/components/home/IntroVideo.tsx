"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ActionLink, ArrowForwardIcon } from "./ActionLink";

/**
 * Intro strip right under the hero: the Vidhyora intro reel plays
 * (muted, looped, inline — never fullscreen) in a glowing glass frame
 * beside a short brand message. Framer-motion reveals the panel and the
 * text when the section scrolls into view.
 */
export function IntroVideo() {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  // WCAG 2.2.2: anything that auto-plays and loops for more than five
  // seconds needs a pause control. Reduced-motion users get it paused from
  // the start — the reel is still here and still playable, just not forced.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !reduce) return;
    el.pause();
    setPlaying(false);
  }, [reduce]);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <section
      id="demo"
      // One step down the surface-container ladder from the hero, so the band
      // reads as a recessed layer rather than more of the same black field.
      className="relative overflow-hidden bg-md-surface-container-lowest py-14 sm:py-20 md:py-24"
    >
      {/* Ambient glow echoing the hero — brand source + tertiary role. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_30rem_at_15%_10%,rgb(var(--md-source)/0.09),transparent_60%),radial-gradient(40rem_28rem_at_90%_90%,rgb(var(--md-tertiary)/0.07),transparent_60%)]"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 sm:gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Video panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -48, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <div className="group relative overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container-lowest shadow-e2 sm:rounded-xl">
            {/* Warm glow ring on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-lg opacity-0 transition-opacity duration-slow ease-standard group-hover:opacity-100 sm:rounded-xl"
              style={{
                boxShadow:
                  "0 0 60px rgb(var(--md-source)/0.18), inset 0 0 30px rgb(var(--md-source)/0.06)",
              }}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              src="/videos/intro.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Vidhyora introduction"
            />

            {/* Play / pause — keeps the auto-looping reel WCAG-compliant */}
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause the intro video" : "Play the intro video"}
              className="press state-layer absolute bottom-3 right-3 flex h-touch w-touch items-center justify-center rounded-full bg-md-scrim/70 text-md-on-surface backdrop-blur-md transition-colors duration-fast sm:bottom-4 sm:right-4"
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="7" y="5" width="3.5" height="14" rx="1" />
                  <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              )}
            </button>

            {/* Bottom-left badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-md-scrim/70 px-3 py-1.5 backdrop-blur-md sm:bottom-4 sm:left-4 sm:px-3.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-md-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-md-primary" />
              </span>
              <span className="text-label-sm uppercase tracking-[0.2em] text-md-on-surface">
                Vidhyora intro
              </span>
            </div>
          </div>
        </motion.div>

        {/* Text panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <Eyebrow>Meet Vidhyora</Eyebrow>
          <h2 className="mt-4 text-headline-md text-md-on-surface sm:text-headline-lg md:text-display-sm">
            Your AI twin.{" "}
            <span className="bg-gradient-to-r from-md-primary to-md-tertiary bg-clip-text text-transparent">
              Your learning journey.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-body-lg text-md-on-surface-variant">
            Vidhyora turns any topic into a difficulty-sequenced roadmap — then walks
            beside you, stage by stage, until curiosity becomes competence.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { t: "Personalized syllabus", d: "Sequenced by difficulty, not guesswork." },
              { t: "Fresh, verified resources", d: "Zero AI-invented links — ever." },
              { t: "Unlock as you grow", d: "Each stage opens the next, server-side." },
            ].map((item, i) => (
              <motion.li
                key={item.t}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                className="flex items-start gap-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-md-primary-container text-md-on-primary-container">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2 6.5l2.7 2.7L10 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-title-sm text-md-on-surface">{item.t}</p>
                  <p className="mt-0.5 text-body-md text-md-on-surface-variant">{item.d}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Secondary to the hero's filled CTA — tonal keeps the emphasis
              ladder intact across the page. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            className="mt-8"
          >
            <ActionLink
              href="#how"
              variant="tonal"
              fullWidth
              className="sm:w-auto"
              trailingIcon={<ArrowForwardIcon />}
            >
              See how it works
            </ActionLink>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
