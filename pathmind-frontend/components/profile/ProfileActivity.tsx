"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useActivity } from "@/hooks/useProfileQuery";
import type { ActivityType } from "@/types/profile";
import {
  BookIcon,
  CheckCircleIcon,
  HistoryIcon,
  MedalIcon,
  TargetIcon,
  TrophyIcon,
} from "./ProfileIcons";

const TYPE_META: Record<ActivityType, { icon: typeof BookIcon; label: string }> = {
  stage_completed: { icon: CheckCircleIcon, label: "Stage completed" },
  roadmap_saved: { icon: BookIcon, label: "Roadmap saved" },
  roadmap_generated: { icon: TargetIcon, label: "Roadmap generated" },
  certificate_earned: { icon: MedalIcon, label: "Certificate earned" },
  achievement_unlocked: { icon: TrophyIcon, label: "Achievement unlocked" },
  goal_set: { icon: TargetIcon, label: "Target date set" },
};

/** "2 hours ago" / "3 days ago", falling back to a date beyond a week. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days <= 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Recent activity timeline.
 *
 * Every entry is a real recorded event — there is no synthesised history here,
 * which is why an account created before the activity log existed starts empty
 * rather than back-filling plausible-looking rows.
 */
export function ProfileActivity() {
  const activity = useActivity("month");
  const feed = activity.data?.feed ?? [];

  if (activity.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    );
  }

  if (activity.isError) {
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-6">
        <p className="text-sm font-semibold text-danger">Couldn&apos;t load your activity</p>
        <p className="mt-1 text-sm text-muted">Reload the page to try again.</p>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card/40 px-6 py-14 text-center backdrop-blur-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-accent/30 bg-accent/[0.10] text-accent-text">
          <HistoryIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-paper">Nothing here yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Saving a roadmap or completing a stage shows up here straight away.
        </p>
        <Link
          href="/saved"
          className="press mt-5 inline-flex min-h-touch items-center rounded-full border border-accent/45 px-5 text-sm font-semibold text-accent-text transition-colors duration-fast hover:bg-accent/12"
        >
          Go to your roadmaps
        </Link>
      </div>
    );
  }

  return (
    <ol className="relative space-y-1 pl-8">
      {/* The spine stops short at both ends so it reads as connecting the
          entries rather than running off the panel. */}
      <span aria-hidden className="absolute bottom-5 left-[15px] top-5 w-px bg-accent/20" />

      {feed.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <li key={item.id} className="relative py-2.5">
            <span
              aria-hidden
              className="absolute -left-8 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-accent/35 bg-ink text-accent-text"
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="rounded-md border border-line/12 bg-ink/40 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-paper">{item.title ?? meta.label}</p>
                <time dateTime={item.createdAt} className="text-xs text-muted">
                  {relativeTime(item.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {meta.label}
                {item.subtitle ? ` · ${item.subtitle}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
