import { resolvePracticeLink } from "@/services/practiceLinks/practiceLinks.service";

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

  it("falls back to an unverified platform search link when no match exists", () => {
    const link = resolvePracticeLink("quantum-chromodynamics", "advanced");
    expect(link.verified).toBe(false);
    expect(link.url).toMatch(/^https:\/\//);
  });
});
