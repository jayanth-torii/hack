import type { SearchResult } from "./webSearch";
import type { StageDraft } from "./AIProvider.interface";

function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "(no search results available)";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join("\n\n");
}

export function buildSyllabusPrompt(topic: string, searchContext: SearchResult[]): string {
  return `You are an expert curriculum designer. Design a difficulty-aware, strictly sequential learning roadmap for the topic: "${topic}".

Requirements:
- Output ordered stages, beginner -> intermediate -> advanced.
- Each stage has a "type" of "learn" or "practice". Alternate learn stages that build theory with practice stages that reinforce it (e.g. for Dynamic Programming: fundamentals/memoization -> knapsack technique -> easy practice -> medium practice -> contest-level practice).
- Every stage except the first must depend on exactly one prior stage (prerequisiteOrder = the 0-based order index of that prior stage). The first stage has prerequisiteOrder = null.
- Provide 5-8 stages total.

Background research for grounding (do not invent facts beyond this):
${formatSearchContext(searchContext)}

Respond with ONLY a JSON array matching this TypeScript type, no prose, no markdown fences:
Array<{
  order: number;
  title: string;
  type: "learn" | "practice";
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisiteOrder: number | null;
  syllabus: string[]; // 3-5 bullet points covered in this stage
  estimatedDays: number; // realistic days at ~1hr/day
}>`;
}

export function buildFreeResourcesPrompt(
  topic: string,
  stage: StageDraft,
  searchContext: SearchResult[]
): string {
  return `For the topic "${topic}", stage "${stage.title}" (difficulty: ${stage.difficulty}), pick the best FREE learning resources (YouTube playlists, official docs, high-quality blogs).

CRITICAL: You may ONLY cite URLs that appear verbatim in the search results below. Never invent or guess a URL. If none of the results fit, return fewer resources rather than fabricating one.

Search results:
${formatSearchContext(searchContext)}

Respond with ONLY a JSON array, no prose:
Array<{ title: string; url: string; type: "video" | "playlist" | "doc" | "blog" }>
Return at most 4 resources.`;
}

export function buildCertificationsPrompt(topic: string, searchContext: SearchResult[]): string {
  return `For the topic "${topic}", rank the best PAID certifications (Coursera/Udemy/AWS/Google/Microsoft-type) by actual learning value, not just popularity.

CRITICAL: Only cite URLs present in the search results below.

Search results:
${formatSearchContext(searchContext)}

Respond with ONLY a JSON array, no prose:
Array<{ title: string; provider: "coursera"|"udemy"|"aws"|"google"|"microsoft"|"other"; url: string; price: number | null; rank: number }>
Return 3-5 certifications, rank 1 = best value.`;
}

export function buildPracticeTagsPrompt(topic: string, stage: StageDraft): string {
  return `For the topic "${topic}", stage "${stage.title}" (type: ${stage.type}, difficulty: ${stage.difficulty}), suggest 2-4 short topic tags (kebab-case, e.g. "dynamic-programming", "binary-search") and a difficulty level that a practice-problem lookup service can resolve to real LeetCode/CodeChef/HackerRank problems. Do NOT invent problem URLs or IDs yourself — only tags.

Respond with ONLY a JSON array, no prose:
Array<{ tag: string; difficulty: "beginner"|"intermediate"|"advanced" }>`;
}

export function buildTimelinePrompt(topic: string, stages: StageDraft[]): string {
  const stageSummary = stages
    .map((s) => `- order ${s.order}: "${s.title}" (${s.difficulty}, ~${s.estimatedDays} days)`)
    .join("\n");
  return `For the topic "${topic}", produce a day-by-day study timeline assuming 1 hour/day, covering these stages in order:
${stageSummary}

Respond with ONLY a JSON array, no prose:
Array<{ day: number; tasks: string[] }>
Each day should reference which stage the student is working on.`;
}
