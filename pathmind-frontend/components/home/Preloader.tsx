"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap-config";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

/**
 * Landing preloader: the full Vidhyora logo rises and scales in
 * (framer-motion), a lime progress bar fills (GSAP), then the whole overlay
 * slides up off screen (GSAP power4) revealing the page. Skipped entirely
 * for prefers-reduced-motion users.
 */
export function Preloader() {
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHidden(true);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { width: "0%" },
        { width: "100%", duration: 1.15, ease: "power2.inOut" }
      );
      const tl = gsap.timeline({ delay: 1.2, onComplete: () => setHidden(true) });
      tl.to(rootRef.current, { yPercent: -100, duration: 0.9, ease: "power4.inOut" });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#010103]"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_28rem_at_50%_20%,rgba(201,243,29,0.1),transparent_60%)]" />

      {/* Full Vidhyora lockup (icon + wordmark + tagline); blend removes the black box */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/vidhyora.png"
        alt="Vidhyora"
        width={640}
        height={640}
        initial={{ opacity: 0, scale: 0.88, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-56 mix-blend-screen sm:w-72"
      />

      <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div ref={barRef} className="h-full rounded-full bg-accent" style={{ width: "0%" }} />
      </div>
    </div>
  );
}
