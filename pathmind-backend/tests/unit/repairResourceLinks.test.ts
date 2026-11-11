import { searchSubject } from "@/utils/repairResourceLinks";

describe("searchSubject", () => {
  it("strips the trailing topic a generated stage title repeats", () => {
    expect(
      searchSubject("Dynamic Programming", "Core Technique Deep Dive: Dynamic Programming")
    ).toBe("Dynamic Programming Core Technique Deep Dive");
  });

  it("falls back to the topic alone when the title is only the topic", () => {
    expect(searchSubject("React", "React")).toBe("React");
  });

  it("does not prepend a topic the title already contains", () => {
    expect(searchSubject("React", "Advanced React Patterns")).toBe("Advanced React Patterns");
  });

  it("joins topic and title when they do not overlap", () => {
    expect(searchSubject("Rust", "Ownership and Borrowing")).toBe(
      "Rust Ownership and Borrowing"
    );
  });

  it("ignores a colon that is not followed by the topic", () => {
    expect(searchSubject("Rust", "Traits: A Deep Dive")).toBe("Rust Traits: A Deep Dive");
  });

  it("is case-insensitive about the repetition", () => {
    expect(searchSubject("machine learning", "Fundamentals: Machine Learning")).toBe(
      "machine learning Fundamentals"
    );
  });
});
