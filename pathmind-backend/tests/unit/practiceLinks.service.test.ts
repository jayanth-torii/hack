import {
  resolvePracticeLink,
  verifyPracticeLinks,
} from "@/services/practiceLinks/practiceLinks.service";

describe("practiceLinks.service", () => {
  it("resolves an exact tag match to a verified, real URL", () => {
    const link = resolvePracticeLink("dynamic-programming", "beginner");
    expect(link.verified).toBe(true);
    expect(link.url).toMatch(/^https:\/\//);
  });

  it("prefers the closest difficulty tier among matches", () => {
    const link = resolvePracticeLink("dynamic-programming", "advanced");
    expect(link.verified).toBe(true);
    // The advanced-tagged DP entries (LCS, CodeChef Knapsack) should win over the beginner ones.
    expect(["advanced", "intermediate"]).toContain(link.difficulty);
  });

  it("respects a preferred platform when a match exists on it", () => {
    const link = resolvePracticeLink("dynamic-programming", "advanced", "codechef");
    expect(link.platform).toBe("codechef");
  });

  it("fuzzy-matches a tag that partially overlaps a known tag", () => {
    const link = resolvePracticeLink("array", "beginner"); // "arrays" is the seeded tag
    expect(link.verified).toBe(true);
  });

  it("resolves DP technique tags to curated verified problems", () => {
    expect(resolvePracticeLink("memoization", "beginner").url).toBe(
      "https://leetcode.com/problems/fibonacci-number/"
    );
    expect(resolvePracticeLink("tabulation", "beginner").verified).toBe(true);
    expect(resolvePracticeLink("0-1-knapsack", "intermediate").url).toBe(
      "https://leetcode.com/problems/partition-equal-subset-sum/"
    );
    expect(resolvePracticeLink("unbounded-knapsack", "intermediate").url).toBe(
      "https://leetcode.com/problems/coin-change/"
    );
    expect(resolvePracticeLink("bitmasking", "advanced").url).toBe(
      "https://leetcode.com/problems/partition-to-k-equal-sum-subsets/"
    );
    expect(resolvePracticeLink("shortest-paths", "intermediate").url).toBe(
      "https://leetcode.com/problems/network-delay-time/"
    );
    expect(resolvePracticeLink("matrix-chain-multiplication", "advanced").url).toBe(
      "https://leetcode.com/problems/burst-balloons/"
    );
  });

  it("token-matches plural/variant tags like knapsack-problems", () => {
    const link = resolvePracticeLink("knapsack-problems", "intermediate");
    expect(link.verified).toBe(true);
    expect(link.url).toContain("partition-equal-subset-sum");
  });

  it("resolves machine-learning to a curated HackerRank domain", () => {
    const link = resolvePracticeLink("machine-learning", "intermediate");
    expect(link.verified).toBe(true);
    expect(link.url).toBe("https://www.hackerrank.com/domains/ai/machine-learning");
  });

  it("falls back to an unverified platform search link when no match exists", () => {
    const link = resolvePracticeLink("quantum-chromodynamics", "advanced");
    expect(link.verified).toBe(false);
    expect(link.url).toMatch(/^https:\/\//);
  });
});

describe("verifyPracticeLinks", () => {
  it("flips live fallback links to verified and leaves dead ones unverified", async () => {
    const fakeCheck = async (url: string) =>
      url.includes("alive") ? { alive: true, status: 200 } : { alive: false, status: 404 };

    const out = await verifyPracticeLinks(
      [
        { platform: "leetcode", problemId: "search", title: "a", url: "https://x/alive", difficulty: "beginner", verified: false },
        { platform: "leetcode", problemId: "search", title: "b", url: "https://x/dead", difficulty: "beginner", verified: false },
        { platform: "leetcode", problemId: "1", title: "c", url: "https://x/ok", difficulty: "beginner", verified: true },
      ],
      fakeCheck
    );

    expect(out[0]!.verified).toBe(true);
    expect(out[1]!.verified).toBe(false);
    expect(out[2]!.verified).toBe(true);
  });
});
