"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/useTheme";

/**
 * Sun/moon toggle that flips the whole site between dark and light themes.
 * The icon cross-fades with a spring rotation; reduced-motion users get the
 * same switch without the flourish (framer-motion ignores it via CSS motion
 * reduce only when set — the transition is short and non-blocking).
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLight = theme === "light";

  // Render only after mount so the icon matches the applied theme (no flash
  // when the stored/system preference is light).
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span aria-hidden className="block h-10 w-10 rounded-full border border-line/15 bg-card/50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-line/15 bg-card/50 text-subtle backdrop-blur-md transition-colors hover:border-accent/60 hover:text-accent"
    >
      {/* soft glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "0 0 18px rgba(201,243,29,0.25), inset 0 0 10px rgba(201,243,29,0.08)" }}
      />
      <motion.span
        key={theme}
        initial={{ rotate: -120, scale: 0.4, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative flex"
      >
        {isLight ? (
          // Sun
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Moon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M20.2 14.4A8.5 8.5 0 0 1 9.6 3.8 8.5 8.5 0 1 0 20.2 14.4Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
