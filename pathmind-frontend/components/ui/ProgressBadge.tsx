import type { ReactNode } from "react";
import { Badge } from "./Badge";

export type NodeState = "locked" | "active" | "completed";

/**
 * Stage state as an M3 assist chip.
 *
 * The icons are inline SVG on the project's 24px / 1.8-stroke grid — the
 * emoji they replaced (a padlock, a ring, a tick) rendered in the OS font at a
 * size and weight nobody controls, and sat badly against the Material type
 * scale. Each chip keeps its written label as well, so the state never
 * depends on colour or glyph alone.
 */
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InProgressIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CONFIG: Record<
  NodeState,
  { tone: "neutral" | "brand" | "success"; label: string; icon: ReactNode }
> = {
  locked: { tone: "neutral", label: "Locked", icon: <LockIcon /> },
  active: { tone: "brand", label: "In progress", icon: <InProgressIcon /> },
  completed: { tone: "success", label: "Completed", icon: <CheckIcon /> },
};

export function ProgressBadge({ state }: { state: NodeState }) {
  const { tone, label, icon } = CONFIG[state];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}
