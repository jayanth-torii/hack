import { Badge } from "./Badge";
import type { PracticePlatform } from "@/types/resource";

const PLATFORM_LABEL: Record<PracticePlatform, string> = {
  leetcode: "LeetCode",
  codechef: "CodeChef",
  hackerrank: "HackerRank",
};

/** Terminal prompt — "this link is somewhere you write code". */
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m9 8.5-3.5 3.5L9 15.5M15 8.5l3.5 3.5L15 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9.5" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 14v6l3-1.8 3 1.8v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The practice platform a link points at, as an M3 assist chip. */
export function PracticeBadge({ platform }: { platform: PracticePlatform }) {
  return (
    <Badge tone="brand" icon={<CodeIcon />}>
      {PLATFORM_LABEL[platform]}
    </Badge>
  );
}

export function CertBadge() {
  return (
    <Badge tone="warning" icon={<CertificateIcon />}>
      certification
    </Badge>
  );
}
