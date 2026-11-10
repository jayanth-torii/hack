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

/** Inline SVG on the 24px / 1.8-stroke grid — replaces the ✓ and ⚠ glyphs. */
function VerifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8.5 12.2 2.4 2.4 4.6-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UnverifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5 2.8 20h18.4L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Directly surfaces the backend freshness-worker's `lastVerifiedAt` stamp so
 * students can trust a resource link isn't a stale "best of" list —
 * addresses the spec's "known pain point with static resource lists".
 * `verified=false` (practice-link fallback / no live match found) renders a
 * distinct warning tone instead of claiming freshness that wasn't checked.
 *
 * Both states say in words what they mean, with the icon and the tone as
 * redundant cues — colour alone never carries the status.
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
      <Badge tone="warning" icon={<UnverifiedIcon />}>
        unverified link
      </Badge>
    );
  }
  return (
    <Badge tone="success" shimmer icon={<VerifiedIcon />}>
      {timeAgo(lastVerifiedAt)}
    </Badge>
  );
}
