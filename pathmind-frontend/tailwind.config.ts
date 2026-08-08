import type { Config } from "tailwindcss";

// Theme colors are driven by CSS custom properties (see app/globals.css) so
// the whole site flips between dark (default) and light via a single `light`
// class on <html>. `ink` is the page background, `paper` the primary text,
// `card` raised surfaces, `muted`/`subtle` secondary text and `line` borders.
// Brand/status/surface remain literal accent colors shared with lib/theme.ts
// and the Three.js materials in components/canvas/Node.tsx.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        status: {
          locked: "#475569",
          active: "#38bdf8",
          complete: "#22c55e",
        },
        surface: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          dim: "#101501",
        },
        // Text/borders placed on accent surfaces — always dark regardless of theme
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        // Accent as small text — deeper variant in light mode for contrast
        "accent-text": "rgb(var(--color-accent-text) / <alpha-value>)",
        "cyan-text": "rgb(var(--color-cyan-text) / <alpha-value>)",
        // Semantic theme tokens — flipped by `html.light` in globals.css
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        subtle: "rgb(var(--color-subtle) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Display headings use the same Poppins family (heavier weights +
        // tight tracking in the components) — no second webfont to load.
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        marqueeReverse: "marqueeReverse 38s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        marqueeReverse: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
