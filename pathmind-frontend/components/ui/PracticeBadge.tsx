import { Badge } from "./Badge";
import type { PracticePlatform } from "@/types/resource";

const PLATFORM_LABEL: Record<PracticePlatform, string> = {
  leetcode: "LeetCode",
  codechef: "CodeChef",
  hackerrank: "HackerRank",
};

export function PracticeBadge({ platform }: { platform: PracticePlatform }) {
  return <Badge tone="brand">{PLATFORM_LABEL[platform]}</Badge>;
}

export function CertBadge() {
  return <Badge tone="warning">certification</Badge>;
}
