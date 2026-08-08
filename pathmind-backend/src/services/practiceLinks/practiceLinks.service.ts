import seedData from "./practiceLinks.seed.json";
import type { Difficulty, PracticePlatform } from "../../types/domain";
import type { PracticeLinkEntry } from "../../models/Roadmap";
import {
  checkLinkAlive,
  type LinkCheckResult,
} from "../freshness/linkChecker.service";

interface SeedEntry {
  topicTag: string;
  platform: PracticePlatform;
  problemId: string;
  title: string;
  url: string;
  difficulty: Difficulty;
}

const SEED: SeedEntry[] = seedData as SeedEntry[];

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

function difficultyDistance(a: Difficulty, b: Difficulty): number {
  return Math.abs(DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b));
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

const STOP_TOKENS = new Set(["and", "the", "for", "problem", "problems", "practice"]);

function tokenize(tag: string): string[] {
  return normalizeTag(tag)
    .split("-")
    .filter((t) => t.length > 2 && !STOP_TOKENS.has(t));
}

/** Count of meaningful tokens shared between two kebab-case tags. */
function tokenOverlapScore(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  return tokenize(b).filter((t) => tokensA.has(t)).length;
}

/**
 * This is the "maintained mapping/lookup layer between topic tags and real
 * LeetCode/CodeChef/HackerRank problem IDs" described in the spec. The AI
 * only ever suggests a `tag` + `difficulty`; this module is the sole source
 * of the actual URL, so practice links can never be hallucinated.
 *
 * Resolution order:
 *   1. Exact tag match, closest difficulty
 *   2. Fuzzy (substring) tag match, closest difficulty
 *   3. Fallback: a platform tag-search URL, flagged verified:false
 */
export function resolvePracticeLink(
  tag: string,
  difficulty: Difficulty,
  preferredPlatform?: PracticePlatform
): PracticeLinkEntry {
  const normalized = normalizeTag(tag);

  let candidates = SEED.filter((e) => e.topicTag === normalized);
  if (candidates.length === 0) {
    candidates = SEED.filter(
      (e) => e.topicTag.includes(normalized) || normalized.includes(e.topicTag)
    );
  }
  if (candidates.length === 0) {
    // Token-overlap match: "knapsack-problem" -> seed tag "knapsack",
    // "longest-common-subsequence" -> seed tag "longest-common-subsequence",
    // etc. Keeps AI-suggested tags resolving to curated, verified problems.
    const scored = SEED.map((e) => ({ entry: e, score: tokenOverlapScore(normalized, e.topicTag) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.entry);
    if (scored.length > 0) candidates = scored;
  }

  if (preferredPlatform) {
    const platformMatch = candidates.filter((e) => e.platform === preferredPlatform);
    if (platformMatch.length > 0) candidates = platformMatch;
  }

  if (candidates.length > 0) {
    const best = candidates
      .slice()
      .sort((a, b) => difficultyDistance(a.difficulty, difficulty) - difficultyDistance(b.difficulty, difficulty))[0];
    if (best) {
      return {
        platform: best.platform,
        problemId: best.problemId,
        title: best.title,
        url: best.url,
        difficulty: best.difficulty,
        verified: true,
      };
    }
  }

  return fallbackSearchLink(normalized, difficulty, preferredPlatform ?? "leetcode");
}

function fallbackSearchLink(
  tag: string,
  difficulty: Difficulty,
  platform: PracticePlatform
): PracticeLinkEntry {
  const urls: Record<PracticePlatform, string> = {
    leetcode: `https://leetcode.com/tag/${encodeURIComponent(tag)}/`,
    codechef: `https://www.codechef.com/problems/tags/${encodeURIComponent(tag)}`,
    hackerrank: `https://www.hackerrank.com/domains/tutorials/10-days-of-javascript?filters%5Bsubdomains%5D%5B%5D=${encodeURIComponent(tag)}`,
  };
  return {
    platform,
    problemId: "search",
    title: `Browse ${tag.replace(/-/g, " ")} problems on ${platform}`,
    url: urls[platform],
    difficulty,
    verified: false,
  };
}

export function resolvePracticeLinks(
  tags: Array<{ tag: string; difficulty: Difficulty; platform?: PracticePlatform }>
): PracticeLinkEntry[] {
  return tags.map((t) => resolvePracticeLink(t.tag, t.difficulty, t.platform));
}

/**
 * Liveness-verifies any practice links that resolved to an unverified fallback
 * (e.g. a platform tag-browse page). Real pages flip to verified; genuinely
 * dead URLs stay unverified so the UI keeps flagging them.
 */
export async function verifyPracticeLinks(
  links: PracticeLinkEntry[],
  check: (url: string) => Promise<LinkCheckResult> = checkLinkAlive
): Promise<PracticeLinkEntry[]> {
  return Promise.all(
    links.map(async (link) => {
      if (link.verified) return link;
      const result = await check(link.url);
      return result.alive ? { ...link, verified: true } : link;
    })
  );
}
