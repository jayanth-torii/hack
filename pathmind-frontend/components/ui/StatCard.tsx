import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  className?: string;
}

/**
 * One headline number with its icon and caption.
 *
 * The value renders as a `<dd>`/`<dt>` pair so a row of these is a real
 * description list, not four visually-similar divs — a screen reader reads
 * "Saved roadmaps: 1" rather than two disconnected strings.
 */
export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-accent/20 bg-card/40 p-4 shadow-[0_0_40px_-22px_rgb(var(--color-accent)/0.6)] backdrop-blur-sm sm:p-5",
        className
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/30 bg-accent/[0.10] text-accent-text">
        {icon}
      </span>
      <dd className="mt-3 font-display text-2xl font-bold leading-none tabular-nums text-paper sm:text-3xl">
        {value}
      </dd>
      <dt className="mt-1.5 text-xs leading-snug text-muted sm:text-sm">{label}</dt>
    </div>
  );
}
