"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Intro strip right under the hero: the Vidhyora intro reel plays
 * (muted, looped, inline — never fullscreen) in a glowing glass frame
 * beside a short brand message. Framer-motion reveals the panel and the
 * text when the section scrolls into view.
 */
export function IntroVideo() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-ink py-20 md:py-24">
      {/* Ambient glow echoing the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_30rem_at_15%_10%,rgba(201,243,29,0.08),transparent_60%),radial-gradient(40rem_28rem_at_90%_90%,rgba(56,189,248,0.07),transparent_60%)]"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12 lg:gap-16">
        {/* Video panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -48, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <div className="group relative overflow-hidden rounded-3xl border border-line/10 bg-black shadow-2xl shadow-black/40">
            {/* Lime glow ring on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                boxShadow: "0 0 60px rgba(201,243,29,0.18), inset 0 0 30px rgba(201,243,29,0.06)",
              }}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <video
              className="aspect-video w-full object-cover"
              src="/videos/intro.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Vidhyora introduction"
            />

            {/* Bottom-left badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#010103]/70 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
            {"// Meet Vidhyora"}
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-paper md:text-4xl">
            Your AI twin.{" "}
            <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
              Your learning journey.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
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
                <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
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
                  <p className="text-sm font-semibold text-paper">{item.t}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.d}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <motion.a
            href="#how"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-bold tracking-tight text-on-accent transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30"
          >
            See how it works
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
