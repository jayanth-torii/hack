import fs from "fs";
import os from "os";
import path from "path";
import {
  buildTimeline,
  courseToRoadmapInput,
  distribute,
  loadCourses,
  parseArgs,
  CatalogError,
} from "@/utils/seedCourses";
import { courseFileSchema, courseSchema } from "@/schemas/course.schema";
import type { Course } from "@/schemas/course.schema";

/** Tiny fixture — the real catalog lives in src/data/courses/*.json. */
const fixture: Course = {
  // Required since certifications became part of the course contract.
  certifications: [],
  topic: "Test Topic",
  category: "Testing",
  summary: "A fixture course.",
  stages: [
    {
      title: "Basics",
      type: "learn",
      difficulty: "beginner",
      estimatedDays: 2,
      syllabus: ["a", "b", "c"],
      resources: [{ title: "Docs", url: "https://example.com/docs", type: "doc" }],
    },
    {
      title: "Drills",
      type: "practice",
      difficulty: "intermediate",
      estimatedDays: 3,
      syllabus: ["d", "e"],
      resources: [{ title: "Blog", url: "https://example.com/blog", type: "blog" }],
      practiceTags: ["arrays", "dynamic-programming"],
    },
    {
      title: "Advanced",
      type: "learn",
      difficulty: "advanced",
      estimatedDays: 1,
      syllabus: ["f", "g", "h", "i"],
      resources: [{ title: "Guide", url: "https://example.com/guide", type: "doc" }],
    },
  ],
};

describe("distribute", () => {
  it("splits evenly when it divides", () => {
    expect(distribute([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("front-loads the remainder", () => {
    expect(distribute([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it("leaves trailing buckets empty when there are fewer items than buckets", () => {
    expect(distribute([1], 3)).toEqual([[1], [], []]);
  });
});

describe("courseToRoadmapInput", () => {
  const input = courseToRoadmapInput(fixture);

  it("sets the template metadata", () => {
    expect(input.topic).toBe("Test Topic");
    expect(input.normalizedTopic).toBe("test topic");
    expect(input.slug).toBe("test-topic");
    expect(input.isPublicTemplate).toBe(true);
    expect(input.sourceModel).toBe("curated");
  });

  it("orders stages 0-based in catalog order", () => {
    expect(input.stages.map((s) => s.order)).toEqual([0, 1, 2]);
    expect(input.stages.map((s) => s.title)).toEqual(["Basics", "Drills", "Advanced"]);
  });

  it("chains prerequisiteStageId from null through each previous stage _id", () => {
    expect(input.stages[0]!.prerequisiteStageId).toBeNull();
    for (let i = 1; i < input.stages.length; i++) {
      expect(String(input.stages[i]!.prerequisiteStageId)).toBe(String(input.stages[i - 1]!._id));
    }
    const ids = input.stages.map((s) => String(s._id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks every free resource verified with a lastVerifiedAt date", () => {
    for (const stage of input.stages) {
      expect(stage.certifications).toEqual([]);
      for (const r of stage.freeResources) {
        expect(r.verified).toBe(true);
        expect(r.lastVerifiedAt).toBeInstanceOf(Date);
      }
    }
  });

  it("resolves practice links only for practice stages with tags", () => {
    expect(input.stages[0]!.practiceLinks).toEqual([]);
    expect(input.stages[2]!.practiceLinks).toEqual([]);
    expect(input.stages[1]!.practiceLinks).toHaveLength(2);
    for (const link of input.stages[1]!.practiceLinks) {
      expect(link.url).toMatch(/^https:\/\//);
    }
  });

  it("builds one timeline day per estimated day, numbered sequentially", () => {
    const totalDays = fixture.stages.reduce((n, s) => n + s.estimatedDays, 0);
    expect(input.suggestedTimeline).toHaveLength(totalDays);
    expect(input.suggestedTimeline.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(input.suggestedTimeline.every((d) => d.tasks.length > 0)).toBe(true);
  });

  it("spreads each stage's syllabus across that stage's days", () => {
    const timeline = buildTimeline(fixture.stages);
    // Stage 1: 3 items over 2 days -> [a,b], [c]
    expect(timeline[0]!.tasks).toEqual(["a", "b"]);
    expect(timeline[1]!.tasks).toEqual(["c"]);
    // Stage 2: 2 items over 3 days -> [d], [e], then a review filler
    expect(timeline[2]!.tasks).toEqual(["d"]);
    expect(timeline[3]!.tasks).toEqual(["e"]);
    expect(timeline[4]!.tasks).toEqual(["Review and practice: Drills"]);
    // Stage 3: 4 items on 1 day
    expect(timeline[5]!.tasks).toEqual(["f", "g", "h", "i"]);
  });

  it("honours an explicitly supplied slug", () => {
    expect(courseToRoadmapInput(fixture, "test-topic-1").slug).toBe("test-topic-1");
  });
});

describe("course.schema", () => {
  it("accepts the fixture", () => {
    expect(courseSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejects a bad stage type", () => {
    const bad = { ...fixture, stages: [{ ...fixture.stages[0]!, type: "reading" }] };
    expect(courseSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-https resource url", () => {
    const bad = {
      ...fixture,
      stages: [
        {
          ...fixture.stages[0]!,
          resources: [{ title: "Docs", url: "http://example.com/docs", type: "doc" }],
        },
      ],
    };
    const result = courseSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.path).toEqual(["stages", 0, "resources", 0, "url"]);
    }
  });

  it("rejects a course with no stages and a missing summary", () => {
    expect(courseSchema.safeParse({ ...fixture, stages: [] }).success).toBe(false);
    const { summary: _summary, ...noSummary } = fixture;
    expect(courseSchema.safeParse(noSummary).success).toBe(false);
  });

  it("rejects a non-integer estimatedDays", () => {
    const bad = { ...fixture, stages: [{ ...fixture.stages[0]!, estimatedDays: 1.5 }] };
    expect(courseSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects two courses in one file sharing a topic", () => {
    const result = courseFileSchema.safeParse([fixture, { ...fixture, topic: "test  topic" }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/duplicate topic/);
    }
  });
});

describe("loadCourses", () => {
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "courses-"));
  });

  afterEach(() => {
    for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const write = (name: string, data: unknown): void =>
    fs.writeFileSync(path.join(dir, name), JSON.stringify(data));

  it("loads and flattens every json file in the directory", () => {
    write("a.json", [fixture]);
    write("b.json", [{ ...fixture, topic: "Another Topic" }]);
    const loaded = loadCourses(dir);
    expect(loaded.map((l) => l.course.topic).sort()).toEqual(["Another Topic", "Test Topic"]);
    expect(loaded.map((l) => l.file).sort()).toEqual(["a.json", "b.json"]);
  });

  it("fails fast on a topic duplicated across files, naming both", () => {
    write("a.json", [fixture]);
    write("b.json", [fixture]);
    expect(() => loadCourses(dir)).toThrow(CatalogError);
    expect(() => loadCourses(dir)).toThrow(/b\.json.*duplicate topic.*a\.json/s);
  });

  it("reports the file and JSON path of a validation error", () => {
    write("a.json", [{ ...fixture, stages: [{ ...fixture.stages[0]!, difficulty: "easy" }] }]);
    expect(() => loadCourses(dir)).toThrow(/a\.json.*\[0\]\.stages\[0\]\.difficulty/s);
  });

  it("reports malformed JSON by file name", () => {
    fs.writeFileSync(path.join(dir, "a.json"), "{ not json");
    expect(() => loadCourses(dir)).toThrow(/a\.json: not valid JSON/);
  });

  it("throws for a missing or empty directory", () => {
    expect(() => loadCourses(path.join(dir, "nope"))).toThrow(/not found/);
    expect(() => loadCourses(dir)).toThrow(/No \*\.json catalog files/);
  });
});

describe("parseArgs", () => {
  it("defaults to no flags and the bundled catalog directory", () => {
    const opts = parseArgs([]);
    expect(opts.dryRun).toBe(false);
    expect(opts.force).toBe(false);
    expect(opts.dir).toMatch(/data[\\/]courses$/);
  });

  it("parses --dry-run, --force and both --dir spellings", () => {
    expect(parseArgs(["--dry-run", "--force"])).toMatchObject({ dryRun: true, force: true });
    expect(parseArgs(["--dir", "some/where"]).dir).toBe(path.resolve("some/where"));
    expect(parseArgs(["--dir=some/where"]).dir).toBe(path.resolve("some/where"));
  });

  it("rejects an unknown flag", () => {
    expect(() => parseArgs(["--nope"])).toThrow(CatalogError);
  });
});
