"use client";

import { motion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { Spotlight } from "@/components/ui/Spotlight";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Spotlight className="left-1/2 top-0 -translate-x-1/2" />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-400"
      >
        PathMind — your AI digital twin for learning
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl"
      >
        Turn any topic into a
        <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
          {" "}
          sequenced learning roadmap
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 max-w-xl text-slate-400"
      >
        Syllabus, free resources, certifications, practice problems, and a day-by-day timeline —
        difficulty-ordered, freshness-verified, and unlocked one stage at a time.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex w-full justify-center"
      >
        <SearchBar />
      </motion.div>
    </section>
  );
}
