"use client";

// Adapted from ui.aceternity.com's Spotlight effect: a large soft radial
// glow fixed behind hero content. Pure CSS/SVG, no JS pointer-tracking, so
// it's cheap and respects prefers-reduced-motion trivially (no animation to
// disable — the glow is static).
export function Spotlight({ className }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute -z-10 h-[60rem] w-[60rem] opacity-40 blur-3xl ${className ?? ""}`}
      viewBox="0 0 200 200"
      aria-hidden
    >
      <defs>
        <radialGradient id="spotlight-gradient" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#spotlight-gradient)" />
    </svg>
  );
}
