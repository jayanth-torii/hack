"use client";

import { useReducedMotion } from "framer-motion";
import type { ActivityBucket } from "@/types/profile";

interface ActivityChartProps {
  buckets: ActivityBucket[];
  range: "week" | "month";
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(iso: string, range: "week" | "month"): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (range === "week") return WEEKDAY[d.getUTCDay()] ?? "";
  return String(d.getUTCDate());
}

/**
 * Stage completions per day.
 *
 * Two things worth knowing about the data: every day in the window is present
 * (the API fills zeros), so a flat stretch means "studied nothing", not
 * "missing data"; and bars are drawn from the window's own maximum, so the
 * chart is a shape, with the real counts given as text on hover and to
 * assistive tech through the table below.
 */
export function ActivityChart({ buckets, range }: ActivityChartProps) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  if (total === 0) {
    return (
      <div className="py-5 text-center">
        <p className="text-sm text-subtle">
          No stages completed in the last {range === "week" ? "7" : "30"} days.
        </p>
        <p className="mt-1 text-xs text-muted">
          Finish a stage and it shows up here the same day.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-28 items-end gap-1 sm:gap-1.5" aria-hidden>
        {buckets.map((bucket, i) => {
          const height = bucket.count === 0 ? 3 : Math.max(8, (bucket.count / max) * 100);
          return (
            <div key={bucket.date} className="group relative flex h-full flex-1 items-end">
              <div
                title={`${bucket.date}: ${bucket.count} ${bucket.count === 1 ? "stage" : "stages"}`}
                className={
                  bucket.count === 0
                    ? "w-full rounded-sm bg-line/15"
                    : "w-full rounded-sm bg-gradient-to-t from-accent-hover to-accent"
                }
                style={{
                  height: `${height}%`,
                  transition: reduce ? undefined : "height 600ms var(--ease-emphasized)",
                  transitionDelay: reduce ? undefined : `${i * 18}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div aria-hidden className="mt-2 flex gap-1 sm:gap-1.5">
        {buckets.map((bucket, i) => (
          <span
            key={bucket.date}
            className="flex-1 text-center text-[0.5625rem] leading-none text-muted"
          >
            {/* A 30-day axis cannot fit 30 labels, so show every fifth. */}
            {range === "week" || i % 5 === 0 ? dayLabel(bucket.date, range) : ""}
          </span>
        ))}
      </div>

      {/* The same numbers, readable by a screen reader. */}
      <table className="sr-only">
        <caption>
          Stages completed per day over the last {range === "week" ? "7" : "30"} days
        </caption>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.date}>
              <th scope="row">{bucket.date}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-muted">
        <span className="font-semibold text-paper tabular-nums">{total}</span>{" "}
        {total === 1 ? "stage" : "stages"} in the last {range === "week" ? "7" : "30"} days
      </p>
    </div>
  );
}
