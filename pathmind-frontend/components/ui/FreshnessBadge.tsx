"use client";

import { Badge } from "./Badge";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "verified today";
  if (days === 1) return "verified 1 day ago";
  if (days < 30) return `verified ${days} days ago`;
  const months = Math.floor(days / 30);
  return `verified ${months} mo ago`;
}

/**
 * Directly surfaces the backend freshness-worker's `lastVerifiedAt` stamp so
 * students can trust a resource link isn't a stale "best of" list —
 * addresses the spec's "known pain point with static resource lists".
 * `verified=false` (practice-link fallback / no live match found) renders a
 * distinct warning tone instead of claiming freshness that wasn't checked.
 */
export function FreshnessBadge({
  lastVerifiedAt,
  verified = true,
}: {
  lastVerifiedAt: string;
  verified?: boolean;
}) {
  if (!verified) {
    return (
      <Badge tone="warning" icon={<span aria-hidden>⚠</span>}>
        unverified link
      </Badge>
    );
  }
  return (
    <Badge tone="success" shimmer icon={<span aria-hidden>✓</span>}>
      {timeAgo(lastVerifiedAt)}
    </Badge>
  );
}
