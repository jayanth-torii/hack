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
        // Semantic status roles — always paired with an icon or label in the
        // UI so status is never communicated by colour alone.
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        // ── Material 3 role set ────────────────────────────────────────
        // New work addresses these directly (`bg-md-surface-container`,
        // `text-md-on-surface-variant`). The legacy names above are aliases
        // onto the same roles, so both resolve to one source of truth.
        md: {
          "primary": "rgb(var(--md-primary) / <alpha-value>)",
          "on-primary": "rgb(var(--md-on-primary) / <alpha-value>)",
          "primary-container": "rgb(var(--md-primary-container) / <alpha-value>)",
          "on-primary-container": "rgb(var(--md-on-primary-container) / <alpha-value>)",
          "inverse-primary": "rgb(var(--md-inverse-primary) / <alpha-value>)",
          "secondary": "rgb(var(--md-secondary) / <alpha-value>)",
          "on-secondary": "rgb(var(--md-on-secondary) / <alpha-value>)",
          "secondary-container": "rgb(var(--md-secondary-container) / <alpha-value>)",
          "on-secondary-container": "rgb(var(--md-on-secondary-container) / <alpha-value>)",
          "tertiary": "rgb(var(--md-tertiary) / <alpha-value>)",
          "on-tertiary": "rgb(var(--md-on-tertiary) / <alpha-value>)",
          "tertiary-container": "rgb(var(--md-tertiary-container) / <alpha-value>)",
          "on-tertiary-container": "rgb(var(--md-on-tertiary-container) / <alpha-value>)",
          "error": "rgb(var(--md-error) / <alpha-value>)",
          "on-error": "rgb(var(--md-on-error) / <alpha-value>)",
          "error-container": "rgb(var(--md-error-container) / <alpha-value>)",
          "on-error-container": "rgb(var(--md-on-error-container) / <alpha-value>)",
          "success": "rgb(var(--md-success) / <alpha-value>)",
          "on-success": "rgb(var(--md-on-success) / <alpha-value>)",
          "success-container": "rgb(var(--md-success-container) / <alpha-value>)",
          "on-success-container": "rgb(var(--md-on-success-container) / <alpha-value>)",
          "warning": "rgb(var(--md-warning) / <alpha-value>)",
          "on-warning": "rgb(var(--md-on-warning) / <alpha-value>)",
          "warning-container": "rgb(var(--md-warning-container) / <alpha-value>)",
          "on-warning-container": "rgb(var(--md-on-warning-container) / <alpha-value>)",
          "info": "rgb(var(--md-info) / <alpha-value>)",
          "on-info": "rgb(var(--md-on-info) / <alpha-value>)",
          "info-container": "rgb(var(--md-info-container) / <alpha-value>)",
          "on-info-container": "rgb(var(--md-on-info-container) / <alpha-value>)",
          "surface": "rgb(var(--md-surface) / <alpha-value>)",
          "surface-dim": "rgb(var(--md-surface-dim) / <alpha-value>)",
          "surface-bright": "rgb(var(--md-surface-bright) / <alpha-value>)",
          "surface-container-lowest": "rgb(var(--md-surface-container-lowest) / <alpha-value>)",
          "surface-container-low": "rgb(var(--md-surface-container-low) / <alpha-value>)",
          "surface-container": "rgb(var(--md-surface-container) / <alpha-value>)",
          "surface-container-high": "rgb(var(--md-surface-container-high) / <alpha-value>)",
          "surface-container-highest": "rgb(var(--md-surface-container-highest) / <alpha-value>)",
          "on-surface": "rgb(var(--md-on-surface) / <alpha-value>)",
          "surface-variant": "rgb(var(--md-surface-variant) / <alpha-value>)",
          "on-surface-variant": "rgb(var(--md-on-surface-variant) / <alpha-value>)",
          "inverse-surface": "rgb(var(--md-inverse-surface) / <alpha-value>)",
          "inverse-on-surface": "rgb(var(--md-inverse-on-surface) / <alpha-value>)",
          "outline": "rgb(var(--md-outline) / <alpha-value>)",
          "outline-variant": "rgb(var(--md-outline-variant) / <alpha-value>)",
          "scrim": "rgb(var(--md-scrim) / <alpha-value>)",
          "source": "rgb(var(--md-source) / <alpha-value>)",
        },
      },
      // Shape scale — see --radius-* in globals.css.
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },
      // Elevation scale — hierarchy, not decoration.
      boxShadow: {
        e1: "var(--elev-1)",
        e2: "var(--elev-2)",
        e3: "var(--elev-3)",
        e4: "var(--elev-4)",
        e5: "var(--elev-5)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
        decelerate: "var(--ease-decelerate)",
        accelerate: "var(--ease-accelerate)",
      },
      // Material 3 type scale — [size, {lineHeight, letterSpacing, weight}].
      // Display for hero moments, headline for screen titles, title for
      // section and card headers, body for prose, label for controls.
      fontSize: {
        "display-lg": ["3.5625rem", { lineHeight: "4rem", letterSpacing: "-0.015625rem", fontWeight: "400" }],
        "display-md": ["2.8125rem", { lineHeight: "3.25rem", letterSpacing: "0", fontWeight: "400" }],
        "display-sm": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-lg": ["2rem", { lineHeight: "2.5rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-md": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-sm": ["1.5rem", { lineHeight: "2rem", letterSpacing: "0", fontWeight: "400" }],
        "title-lg": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "0", fontWeight: "400" }],
        "title-md": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.009375rem", fontWeight: "500" }],
        "title-sm": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem", fontWeight: "500" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.03125rem", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.015625rem", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025rem", fontWeight: "400" }],
        "label-lg": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem", fontWeight: "500" }],
        "label-md": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.03125rem", fontWeight: "500" }],
        "label-sm": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.03125rem", fontWeight: "500" }],
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
      },
      // Fixed-chrome metrics + safe-area insets, so spacing utilities can
      // reference them directly (e.g. `h-app-bar`, `pb-safe-bottom`).
      spacing: {
        "app-bar": "var(--app-bar-h)",
        "bottom-nav": "var(--bottom-nav-h)",
        "safe-top": "var(--safe-top)",
        "safe-bottom": "var(--safe-bottom)",
        // Minimum comfortable touch target (48px) and the iOS floor (44px).
        touch: "3rem",
        "touch-min": "2.75rem",
      },
      minHeight: {
        touch: "3rem",
        "touch-min": "2.75rem",
      },
      minWidth: {
        touch: "3rem",
        "touch-min": "2.75rem",
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
