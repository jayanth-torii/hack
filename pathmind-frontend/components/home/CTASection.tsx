"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { GeometryShapes } from "./GeometryShapes";
import { useAuthStore } from "@/store/authStore";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { clsx } from "@/lib/clsx";

gsap.registerPlugin(ScrollTrigger);

/**
 * Premium open-concept CTA Section for Vidhyora.
 * Keeps the spacious, high-end look of the Acjon digital agency landing page.
 * Uses character/word-level GSAP animations, a self-drawing SVG underline, 
 * and custom scroll parallax on ambient glows. Bypasses boxed card layouts for a clean flow.
 */
export function CTASection() {
  const user = useAuthStore((state) => state.user);
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  
  const reduceMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const heading = headingRef.current;
    if (!container || reduceMotion) return;

    const ctx = gsap.context(() => {
      // 1. Word-by-word reveal for the heading
      if (heading) {
        const words = heading.querySelectorAll(".cta-word");
        gsap.fromTo(
          words,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
            },
          }
        );
      }

      // 2. Self-drawing path animation for the accent underline
      gsap.fromTo(
        ".cta-underline-path",
        { strokeDasharray: 200, strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "power2.inOut",
          delay: 0.4,
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
          },
        }
      );

      // 3. Parallax scroll effect on the ambient glow background
      gsap.to(".cta-ambient-glow", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, container);

    return () => ctx.revert();
  }, [reduceMotion]);

  // Split heading into words for the animate-reveal effect
  const firstLine = "Ready to learn".split(" ");

  return (
    <section 
      ref={containerRef}
      id="start" 
      className="relative overflow-hidden bg-ink py-32 sm:py-40 md:py-48"
    >
      {/* Interactive Ambient Parallax Glows */}
      <div 
        className="cta-ambient-glow pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(55rem_34rem_at_50%_100%,rgba(201,243,29,0.14),transparent_65%)]"
        aria-hidden
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise opacity-[0.04] z-0" />

      {/* Floating geometry shapes */}
      <GeometryShapes variant="cta" />

      {/* Main Centered Content (Open Layout) */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        
        {/* Monospace Eyebrow Badge */}
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-card/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-accent-text"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
          </span>
          {"// Start free"}
        </motion.span>

        {/* Huge Headline with custom word mask styling */}
        <h2 
          ref={headingRef}
          className="mt-6 font-display text-5xl font-bold tracking-tight text-paper sm:text-7xl md:text-8xl lg:text-9xl leading-none"
        >
          <span className="block overflow-hidden pb-2">
            {firstLine.map((word, idx) => (
              <span 
                key={idx} 
                className="cta-word mr-[0.22em] inline-block will-change-transform"
              >
                {word}
              </span>
            ))}
          </span>
          <span className="block overflow-hidden py-2">
            <span className="cta-word relative inline-block text-accent will-change-transform">
              in sequence?
              
              {/* Hand-drawn style animated underline path */}
              <svg 
                className="absolute -bottom-3 left-0 w-full h-4 text-accent/80" 
                viewBox="0 0 200 12" 
                preserveAspectRatio="none" 
                fill="none"
                aria-hidden
              >
                <path 
                  className="cta-underline-path"
                  d="M4,7 C60,2 140,2 196,7 Q100,12 4,7" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
              </svg>
            </span>
          </span>
        </h2>

        {/* Subtext description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 max-w-xl text-base sm:text-lg leading-relaxed text-muted"
        >
          {user
            ? "Instantly outline a personalized learning curriculum with verified YouTube courses, official docs, and practice tags."
            : "Sign in to generate tailored roadmaps, save and track your stages, and sync assignments to your calendar."}
        </motion.p>

        {/* Interactive Action Searchbar / Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-12 w-full flex justify-center"
        >
          {user ? (
            <div className="w-full flex justify-center scale-100 sm:scale-105 origin-center">
              <SearchBar />
            </div>
          ) : (
            <motion.a 
              href="/auth/login" 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={clsx(
                "group relative inline-flex items-center gap-3 rounded-full bg-accent px-10 py-5 text-base sm:text-lg font-bold tracking-tight text-on-accent",
                "shadow-[0_0_30px_rgba(201,243,29,0.25)] transition-all hover:shadow-[0_0_40px_rgba(201,243,29,0.45)]"
              )}
            >
              Login to build your path
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </motion.a>
          )}
        </motion.div>
      </div>
    </section>
  );
}
