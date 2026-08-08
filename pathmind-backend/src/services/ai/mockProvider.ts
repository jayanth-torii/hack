import type {
  AIProvider,
  CertificationDraft,
  FreeResourceDraft,
  PracticeTagSuggestion,
  StageDraft,
  TimelineDayDraft,
} from "./AIProvider.interface";
import type { SearchResult } from "./webSearch";

// A generic, topic-agnostic curriculum shape that still demonstrates real
// difficulty-aware sequencing (learn -> learn -> practice -> learn ->
// practice, beginner -> advanced), matching the spec's DP example structure:
// fundamentals/memoization -> applied technique -> medium practice ->
// contest-level practice.
const STAGE_TEMPLATE: Array<Pick<StageDraft, "title" | "type" | "difficulty" | "estimatedDays">> = [
  { title: "Fundamentals & Core Concepts", type: "learn", difficulty: "beginner", estimatedDays: 3 },
  { title: "Core Technique Deep Dive", type: "learn", difficulty: "beginner", estimatedDays: 4 },
  { title: "Guided Practice — Easy Problems", type: "practice", difficulty: "beginner", estimatedDays: 3 },
  { title: "Applied Patterns & Intermediate Theory", type: "learn", difficulty: "intermediate", estimatedDays: 5 },
  { title: "Practice Arena — Medium Problems", type: "practice", difficulty: "intermediate", estimatedDays: 4 },
  { title: "Advanced Topics & System-Level Thinking", type: "learn", difficulty: "advanced", estimatedDays: 5 },
  { title: "Contest-Level & Advanced Practice", type: "practice", difficulty: "advanced", estimatedDays: 4 },
];

function titleCase(topic: string): string {
  return topic
    .split(" ")
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export class MockAIProvider implements AIProvider {
  async generateSyllabus(topic: string): Promise<StageDraft[]> {
    const nice = titleCase(topic);
    return STAGE_TEMPLATE.map((s, index) => ({
      order: index,
      title: `${s.title}: ${nice}`,
      type: s.type,
      difficulty: s.difficulty,
      prerequisiteOrder: index === 0 ? null : index - 1,
      estimatedDays: s.estimatedDays,
      syllabus: mockSyllabusItems(nice, s.difficulty, s.type),
    }));
  }

  async generateFreeResources(
    topic: string,
    stage: StageDraft,
    searchContext: SearchResult[]
  ): Promise<FreeResourceDraft[]> {
    // Only ever cite URLs present in the (mock or real) search context —
    // this is the "don't hallucinate URLs" guarantee exercised even in mock
    // mode. Types are derived from the URL shape (a watch?v= link is a video,
    // a playlist?list= link is a playlist, everything else is a doc) so the
    // mock path mirrors what the real provider is instructed to emit.
    return searchContext.slice(0, 3).map((r) => ({
      title: `${r.title} — for ${stage.title}`,
      url: r.url,
      type: r.url.includes("youtube.com")
        ? r.url.includes("/playlist")
          ? "playlist"
          : "video"
        : "doc",
    }));
  }

  async generateCertifications(
    topic: string,
    searchContext: SearchResult[]
  ): Promise<CertificationDraft[]> {
    const nice = titleCase(topic);
    const providers: CertificationDraft["provider"][] = ["coursera", "udemy", "aws", "google"];
    return providers.map((provider, i) => ({
      title: `${nice} Professional Certificate (${provider.toUpperCase()})`,
      provider,
      url: searchContext[i % searchContext.length]?.url ?? "https://www.coursera.org/",
      price: provider === "coursera" ? 49 : provider === "udemy" ? 19 : provider === "aws" ? 150 : 99,
      rank: i + 1,
    }));
  }

  async suggestPracticeTags(topic: string, stage: StageDraft): Promise<PracticeTagSuggestion[]> {
    const base = topic.trim().toLowerCase().replace(/\s+/g, "-");
    // For a "practice" stage, prefer topic-derived tags; for "learn" stages
    // still surface a light warm-up tag at the same difficulty.
    const tags = stage.type === "practice" ? [base, "dynamic-programming", "arrays"] : [base];
    return tags.map((tag) => ({ tag, difficulty: stage.difficulty }));
  }

  async generateTimeline(topic: string, stages: StageDraft[]): Promise<TimelineDayDraft[]> {
    const totalDays = stages.reduce((sum, s) => sum + s.estimatedDays, 0);
    const days: TimelineDayDraft[] = [];
    let stageIdx = 0;
    let remainingInStage = stages[0]?.estimatedDays ?? 1;
    for (let day = 1; day <= totalDays; day++) {
      while (remainingInStage <= 0 && stageIdx < stages.length - 1) {
        stageIdx++;
        remainingInStage = stages[stageIdx]?.estimatedDays ?? 1;
      }
      const stage = stages[stageIdx];
      days.push({
        day,
        tasks: stage
          ? [`1hr: ${stage.title} (${stage.difficulty})`]
          : [`1hr: Review ${titleCase(topic)}`],
      });
      remainingInStage--;
    }
    return days;
  }
}

function mockSyllabusItems(nice: string, difficulty: string, type: string): string[] {
  if (type === "practice") {
    return [
      `Warm-up problems on ${nice}`,
      `Timed problem-solving session (${difficulty})`,
      `Review solutions & complexity analysis`,
    ];
  }
  return [
    `What is ${nice}? Core intuition`,
    `Key terminology & building blocks`,
    `Worked examples at ${difficulty} level`,
    `Common pitfalls & how to avoid them`,
  ];
}
