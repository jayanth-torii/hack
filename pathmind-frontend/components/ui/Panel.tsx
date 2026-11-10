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
 * The block used by every side-rail section, now a Material 3 **outlined
 * card**: the page surface plus a hairline `outline-variant` edge, 12dp
 * corners, no shadow.
 *
 * Outlined rather than elevated on purpose. These panels stack several to a
 * rail and frequently contain cards of their own; elevation is reserved in M3
 * for things that genuinely float above the page, and a column of shadowed
 * boxes reads as noise. The glow that used to sit behind this surface
 * (`shadow-[0_0_50px_-24px_…]` on an accent-tinted border) was decoration
 * standing in for hierarchy — the outline does the job at a fraction of the
 * paint cost.
 *
 * The heading is a real `<h2>` so the rail is navigable by headings.
 */
export function Panel({ title, icon, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section
      className={clsx(
        "overflow-hidden rounded-md border border-md-outline-variant bg-md-surface",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-md-outline-variant px-4 py-3.5 sm:px-5">
        {/* min-w-0 so a long title shrinks and wraps instead of pushing the
            action control out of a 360px panel. */}
        <h2 className="flex min-w-0 items-center gap-2.5 text-title-md text-md-on-surface">
          {icon && <span className="shrink-0 text-md-primary">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className={clsx("px-4 py-4 text-body-md text-md-on-surface-variant sm:px-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
