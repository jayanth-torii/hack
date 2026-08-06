import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type BadgeTone = "brand" | "success" | "warning" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand-500/15 text-brand-400 ring-1 ring-inset ring-brand-500/30",
  success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/30",
  neutral: "bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30",
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}

// Magic-UI-style "shimmer badge" adapted to Tailwind — used for freshness,
// certification, and practice tags described in the spec.
export function Badge({ tone = "neutral", icon, children, className, shimmer }: BadgeProps) {
  return (
    <span
      className={clsx(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {shimmer && (
        <span
          className="pointer-events-none absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent,45%,rgba(255,255,255,0.25),55%,transparent)] bg-[length:200%_100%]"
          aria-hidden
        />
      )}
      {icon}
      {children}
    </span>
  );
}
