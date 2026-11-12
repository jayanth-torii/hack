import {
  buildStageCertifications,
  certificationsMatch,
  syncStageCertifications,
  type CertifiableStage,
} from "@/utils/seedCourses";
import type { Course } from "@/schemas/course.schema";

/**
 * Covers the in-place certification sync the seeder runs over courses that
 * already exist in Mongo — the path that exists so a field change never has to
 * go through `--force`, which would mint new stage `_id`s and orphan progress.
 */

const certs: Course["certifications"] = [
  {
    title: "Cert One",
    provider: "coursera",
    url: "https://example.com/cert-one",
    price: 49,
  },
  {
    title: "Cert Two",
    provider: "google",
    url: "https://example.com/cert-two",
    price: null,
  },
];

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    topic: "Test Topic",
    category: "Testing",
    summary: "A fixture course.",
    certifications: certs,
    stages: [
      {
        title: "Basics",
        type: "learn",
        difficulty: "beginner",
        estimatedDays: 2,
        syllabus: ["a"],
        resources: [{ title: "Docs", url: "https://example.com/docs", type: "doc" }],
      },
      {
        title: "Advanced",
        type: "learn",
        difficulty: "advanced",
        estimatedDays: 1,
        syllabus: ["b"],
        resources: [{ title: "Guide", url: "https://example.com/guide", type: "doc" }],
      },
    ],
    ...overrides,
  };
}

/** Stands in for the stages of a roadmap already stored in Mongo. */
function storedStages(count = 2): CertifiableStage[] {
  return Array.from({ length: count }, (_, order) => ({ order, certifications: [] }));
}

describe("buildStageCertifications", () => {
  it("ranks by the authored order and stamps lastVerifiedAt", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const built = buildStageCertifications(makeCourse(), now);
    expect(built.map((c) => c.rank)).toEqual([0, 1]);
    expect(built.map((c) => c.title)).toEqual(["Cert One", "Cert Two"]);
    expect(built[0]!.price).toBe(49);
    expect(built[1]!.price).toBeNull();
    expect(built.every((c) => c.lastVerifiedAt === now)).toBe(true);
  });
});

describe("certificationsMatch", () => {
  it("ignores lastVerifiedAt so a re-run is not a change", () => {
    const a = buildStageCertifications(makeCourse(), new Date("2026-01-01"));
    const b = buildStageCertifications(makeCourse(), new Date("2026-06-30"));
    expect(certificationsMatch(a, b)).toBe(true);
  });

  it("notices an authored field moving", () => {
    const a = buildStageCertifications(makeCourse());
    const b = buildStageCertifications(
      makeCourse({ certifications: [{ ...certs[0]!, price: 99 }, certs[1]!] })
    );
    expect(certificationsMatch(a, b)).toBe(false);
  });

  it("notices a reorder", () => {
    const a = buildStageCertifications(makeCourse());
    const b = buildStageCertifications(makeCourse({ certifications: [certs[1]!, certs[0]!] }));
    expect(certificationsMatch(a, b)).toBe(false);
  });
});

describe("syncStageCertifications", () => {
  it("writes the certifications onto the last stage", () => {
    const stages = storedStages();
    expect(syncStageCertifications(stages, makeCourse())).toBe(true);
    expect(stages[0]!.certifications).toEqual([]);
    expect(stages[1]!.certifications.map((c) => c.title)).toEqual(["Cert One", "Cert Two"]);
    expect(stages[1]!.certifications.map((c) => c.rank)).toEqual([0, 1]);
  });

  it("is idempotent — a second run reports no change", () => {
    const stages = storedStages();
    expect(syncStageCertifications(stages, makeCourse())).toBe(true);
    expect(syncStageCertifications(stages, makeCourse())).toBe(false);
    expect(syncStageCertifications(stages, makeCourse())).toBe(false);
  });

  it("clears a stale copy left on another stage", () => {
    const stages = storedStages();
    stages[0]!.certifications = buildStageCertifications(makeCourse());
    expect(syncStageCertifications(stages, makeCourse())).toBe(true);
    expect(stages[0]!.certifications).toEqual([]);
    expect(stages[1]!.certifications).toHaveLength(2);
  });

  it("matches the stage by stored order, not array position", () => {
    // Same stages, shuffled in the array: order 1 is still the target.
    const stages: CertifiableStage[] = [
      { order: 1, certifications: [] },
      { order: 0, certifications: [] },
    ];
    expect(syncStageCertifications(stages, makeCourse())).toBe(true);
    expect(stages[0]!.certifications).toHaveLength(2);
    expect(stages[1]!.certifications).toEqual([]);
  });

  it("falls back to the final stage when no order matches", () => {
    const stages: CertifiableStage[] = [
      { order: 7, certifications: [] },
      { order: 8, certifications: [] },
    ];
    expect(syncStageCertifications(stages, makeCourse())).toBe(true);
    expect(stages[1]!.certifications).toHaveLength(2);
  });

  it("clears every stage when a course drops its certifications", () => {
    const stages = storedStages();
    syncStageCertifications(stages, makeCourse());
    expect(syncStageCertifications(stages, makeCourse({ certifications: [] }))).toBe(true);
    expect(stages.every((s) => s.certifications.length === 0)).toBe(true);
    expect(syncStageCertifications(stages, makeCourse({ certifications: [] }))).toBe(false);
  });

  it("leaves nothing to do for a course with no stored stages", () => {
    expect(syncStageCertifications([], makeCourse())).toBe(false);
  });
});
