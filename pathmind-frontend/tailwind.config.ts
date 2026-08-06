import type { Config } from "tailwindcss";

// These hex values are shared verbatim with lib/theme.ts and the Three.js
// materials in components/canvas/Node.tsx — so the 2D badges/UI and the 3D
// node colors always match exactly.
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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
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
      },
    },
  },
  plugins: [],
};

export default config;
