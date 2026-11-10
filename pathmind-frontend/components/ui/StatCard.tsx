import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  className?: string;
}

/**
 * One headline number with its icon and caption, as a Material 3 **filled
 * card** — `surface-container-highest`, 12dp corners, no shadow.
 *
 * Filled rather than outlined because these sit in a row of four on the page
 * surface: the tonal step is what separates them, so four hairlines aren't
 * needed, and nothing here floats. The accent glow and tinted border this
 * card used to carry were decoration; the tonal step is the hierarchy.
 *
 * The value renders as a `<dd>`/`<dt>` pair so a row of these is a real
 * description list, not four visually-similar divs — a screen reader reads
 * "Saved roadmaps: 1" rather than two disconnected strings.
 */
export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <div
      className={clsx("rounded-md bg-md-surface-container-highest p-4 sm:p-5", className)}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-md-primary-container text-md-on-primary-container">
        {icon}
      </span>
      <dd className="mt-3 text-headline-sm tabular-nums text-md-on-surface sm:text-headline-md">
        {value}
      </dd>
      <dt className="mt-1.5 text-body-sm text-md-on-surface-variant sm:text-body-md">{label}</dt>
    </div>
  );
}
