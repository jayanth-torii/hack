import { getAIProvider, resetAIProviderCache } from "@/services/ai/aiService";
import { MockAIProvider } from "@/services/ai/mockProvider";
import type { AIProvider } from "@/services/ai/AIProvider.interface";

describe("aiService factory", () => {
  afterEach(() => resetAIProviderCache());

  it("returns the mock provider when MOCK_MODE=true (the test default)", () => {
    const provider = getAIProvider();
    expect(provider).toBeInstanceOf(MockAIProvider);
  });

  it("memoizes the provider instance across calls", () => {
    const a = getAIProvider();
    const b = getAIProvider();
    expect(a).toBe(b);
  });
});

describe("MockAIProvider — difficulty-aware sequencing", () => {
  const provider: AIProvider = new MockAIProvider();

  it("generates stages in ascending order with a valid prerequisite chain", async () => {
    const stages = await provider.generateSyllabus("Dynamic Programming", []);
    expect(stages.length).toBeGreaterThanOrEqual(5);
    expect(stages[0]!.prerequisiteOrder).toBeNull();

    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]!.prerequisiteOrder).toBe(i - 1);
      expect(stages[i]!.order).toBe(i);
    }

    // Difficulty should be non-decreasing across the sequence.
    const rank = { beginner: 0, intermediate: 1, advanced: 2 } as const;
    for (let i = 1; i < stages.length; i++) {
      expect(rank[stages[i]!.difficulty]).toBeGreaterThanOrEqual(rank[stages[i - 1]!.difficulty]);
    }
  });

  it("includes at least one distinct practice-type stage", async () => {
    const stages = await provider.generateSyllabus("System Design", []);
    expect(stages.some((s) => s.type === "practice")).toBe(true);
  });

  it("only cites resource URLs present in the provided search context", async () => {
    const stages = await provider.generateSyllabus("React", []);
    const searchContext = [{ title: "Real Docs", url: "https://real-docs.example.com", snippet: "" }];
    const resources = await provider.generateFreeResources("React", stages[0]!, searchContext);
    for (const r of resources) {
      expect(searchContext.map((s) => s.url)).toContain(r.url);
    }
  });

  it("produces a timeline covering every stage's estimated days", async () => {
    const stages = await provider.generateSyllabus("Kubernetes", []);
    const timeline = await provider.generateTimeline("Kubernetes", stages);
    const totalDays = stages.reduce((sum, s) => sum + s.estimatedDays, 0);
    expect(timeline.length).toBe(totalDays);
  });
});
