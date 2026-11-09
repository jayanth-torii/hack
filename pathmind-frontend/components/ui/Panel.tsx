import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

interface PanelProps {
  title: string;
  icon?: ReactNode;
  /** Right-aligned control: a link, a range switch, an edit button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * The glass panel used by every side-rail block, so the rails stay one
 * consistent surface instead of each section inventing its own padding and
 * border. The heading is a real `<h2>` so the rail is navigable by headings.
 */
export function Panel({ title, icon, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-accent/20 bg-card/40 shadow-[0_0_50px_-24px_rgb(var(--color-accent)/0.6)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line/10 px-4 py-3.5 sm:px-5">
        <h2 className="flex items-center gap-2.5 font-display text-sm font-bold tracking-tight text-paper sm:text-base">
          {icon && <span className="text-accent-text">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className={clsx("px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}
