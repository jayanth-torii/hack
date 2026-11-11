"use client";

import type { ReactNode } from "react";
import { MdButton } from "@/components/md/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { clsx } from "@/lib/clsx";

/**
 * The pieces every admin section repeats: a section shell, a sparkline, a
 * responsive record list, and paging.
 *
 * They live together because the admin area's real design problem is the one
 * tables cause on a phone. A `<table>` with six columns cannot be made to fit
 * 360px without horizontal scrolling, which CLAUDE.md §3 forbids outright. So
 * there are no tables here: every record is a **card** that reflows, and the
 * column headings that a desktop table would carry are instead labels on each
 * field. The same markup works at both sizes, so there is no second mobile
 * layout to keep in step.
 */

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-title-lg text-md-on-surface">{title}</h2>
          {description && (
            <p className="mt-1 text-body-md text-md-on-surface-variant">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-none flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}

/** A labelled metric. `hint` carries the comparison the number needs to mean anything. */
export function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <div className="min-w-0 rounded-md bg-md-surface-container-high p-4">
      <dt className="truncate text-body-sm text-md-on-surface-variant">{label}</dt>
      <dd
        className={clsx(
          "mt-2 text-headline-sm tabular-nums",
          tone === "warning"
            ? "text-md-warning"
            : tone === "success"
              ? "text-md-success"
              : "text-md-on-surface"
        )}
      >
        {value}
      </dd>
      {hint && <p className="mt-1 text-body-sm text-md-on-surface-variant">{hint}</p>}
    </div>
  );
}

/**
 * A 30-day sparkline drawn as a bar chart.
 *
 * Bars rather than a line: the series is a count per day, and a line between
 * two daily counts implies values at times that do not exist. The maximum is
 * computed from the data and floored at 1, so an all-zero month renders a flat
 * baseline instead of dividing by zero.
 *
 * The whole figure is `aria-hidden` and the real content is the table summary
 * beneath it — a screen reader gets the totals, not 30 unlabelled bars.
 */
export function Sparkline({
  data,
  label,
}: {
  data: Array<{ date: string; count: number }>;
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((n, d) => n + d.count, 0);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0] ?? { date: "", count: 0 });

  return (
    <figure className="min-w-0 rounded-md bg-md-surface-container-high p-4">
      <figcaption className="text-body-sm text-md-on-surface-variant">{label}</figcaption>
      <div aria-hidden className="mt-3 flex h-20 items-end gap-[2px]">
        {data.map((d) => (
          <span
            key={d.date}
            title={`${d.date}: ${d.count}`}
            className="min-w-0 flex-1 rounded-t-[2px] bg-md-primary"
            style={{
              // A day with activity never renders as nothing: 4% is the floor
              // so "1" is visibly different from "0".
              height: d.count === 0 ? "2px" : `${Math.max(4, (d.count / max) * 100)}%`,
              opacity: d.count === 0 ? 0.25 : 1,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-body-sm text-md-on-surface-variant">
        {total} in 30 days
        {peak.count > 0 && ` · busiest day ${peak.count}`}
      </p>
    </figure>
  );
}

/** One field inside a record card: a label above its value. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("min-w-0", className)}>
      <dt className="text-body-sm text-md-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 truncate text-body-md text-md-on-surface">{children}</dd>
    </div>
  );
}

/** A record card — the admin area's row. Reflows instead of scrolling sideways. */
export function RecordCard({
  title,
  subtitle,
  badges,
  fields,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <li className="min-w-0 rounded-md border border-md-outline-variant bg-md-surface-container-low p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="min-w-0 break-words text-title-sm text-md-on-surface">{title}</div>
          {subtitle && (
            <div className="mt-0.5 break-words text-body-sm text-md-on-surface-variant">
              {subtitle}
            </div>
          )}
          {badges && <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div>}
        </div>
        {actions && (
          <div className="flex flex-none flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        )}
      </div>
      {fields && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-md-outline-variant/60 pt-3 sm:grid-cols-4">
          {fields}
        </dl>
      )}
    </li>
  );
}

export function RecordListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <span className="sr-only">Loading records</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-md border border-md-outline-variant p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Pager({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) {
    return (
      <p className="mt-4 text-body-sm text-md-on-surface-variant" aria-live="polite">
        {total} record{total === 1 ? "" : "s"}
      </p>
    );
  }
  return (
    <nav aria-label="Pages" className="mt-5 flex items-center justify-between gap-3">
      <MdButton variant="outlined" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </MdButton>
      <p className="text-body-sm text-md-on-surface-variant" aria-live="polite">
        Page {page} of {pages} · {total} total
      </p>
      <MdButton
        variant="outlined"
        size="sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </MdButton>
    </nav>
  );
}

/** Relative time for log entries, with the absolute date as the tooltip. */
export function TimeAgo({ iso }: { iso: string }) {
  const date = new Date(iso);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  let text: string;
  if (seconds < 60) text = "just now";
  else if (seconds < 3600) text = `${Math.floor(seconds / 60)}m ago`;
  else if (seconds < 86400) text = `${Math.floor(seconds / 3600)}h ago`;
  else if (seconds < 2_592_000) text = `${Math.floor(seconds / 86400)}d ago`;
  else text = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <time dateTime={iso} title={date.toLocaleString()}>
      {text}
    </time>
  );
}
