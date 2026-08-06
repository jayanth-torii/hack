import seedData from "./practiceLinks.seed.json";
import type { Difficulty, PracticePlatform } from "@/types/domain";
import type { PracticeLinkEntry } from "@/models/Roadmap";

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
