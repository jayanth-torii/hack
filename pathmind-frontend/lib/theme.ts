// JS-side mirror of tailwind.config.ts's color tokens, for use inside the
// Three.js scene (materials take real hex values, not Tailwind classes).
export const THEME = {
  brand400: "#38bdf8",
  brand500: "#0ea5e9",
  status: {
    locked: "#475569",
    active: "#38bdf8",
    complete: "#22c55e",
  },
  surface900: "#0f172a",
  surface950: "#020617",
} as const;
