import request from "supertest";
import { createApp } from "@/app";
import { Roadmap } from "@/models/Roadmap";
import { User } from "@/models/User";
import { clearCollections, startInMemoryMongo, stopInMemoryMongo } from "../mocks/mongoMemory";

const app = createApp();

beforeAll(async () => {
  await startInMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

const PASSWORD = "hunter2hunter2";

let seq = 0;
async function register(): Promise<{ cookies: string[]; id: string }> {
  seq += 1;
  const res = await request(app)
    .post("/auth/register")
    .send({ email: `c${Date.now()}${seq}@example.com`, password: PASSWORD });
  expect(res.status).toBe(201);
  return {
    cookies: res.headers["set-cookie"] as unknown as string[],
    id: res.body.user.id as string,
  };
}

interface StageSpec {
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  days: number;
}

async function seedCourse(opts: {
  topic: string;
  category?: string;
  summary?: string;
  published?: boolean;
  stages: StageSpec[];
}) {
  seq += 1;
  return Roadmap.create({
    topic: opts.topic,
    normalizedTopic: opts.topic.toLowerCase(),
    slug: `${opts.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${seq}`,
    category: opts.category ?? "Web Development",
    summary: opts.summary ?? `Learn ${opts.topic}.`,
    isPublicTemplate: opts.published ?? true,
    sourceModel: "curated",
    stages: opts.stages.map((s, i) => ({
      order: i,
      title: s.title,
      type: "learn" as const,
      difficulty: s.difficulty,
      prerequisiteStageId: null,
      syllabus: [`${s.title} part 1`, `${s.title} part 2`],
      freeResources: [
        { title: `${s.title} docs`, url: "https://example.com", type: "doc", verified: true },
      ],
      certifications: [],
      practiceLinks: [],
      estimatedDays: s.days,
    })),
    suggestedTimeline: [{ day: 1, tasks: ["start"] }],
  });
}

describe("GET /courses", () => {
  it("is public and returns only published courses", async () => {
    await seedCourse({ topic: "Visible Course", stages: [{ title: "S1", difficulty: "beginner", days: 2 }] });
    await seedCourse({
      topic: "Hidden Course",
      published: false,
      stages: [{ title: "S1", difficulty: "beginner", days: 2 }],
    });

    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    const topics = res.body.courses.map((c: { topic: string }) => c.topic);
    expect(topics).toContain("Visible Course");
    expect(topics).not.toContain("Hidden Course");
  });

  /**
   * Every AI-generated roadmap is also `isPublicTemplate: true` — that is how
   * the generation cache is shared. If the catalog meant "public template",
   * it would fill with whatever anyone had ever typed into the topic box.
   */
  it("excludes public templates that were never categorised", async () => {
    await Roadmap.create({
      topic: "Someone's Generated Topic",
      normalizedTopic: "someone's generated topic",
      slug: "someones-generated-topic",
      isPublicTemplate: true,
      sourceModel: "mock",
      stages: [
        {
          order: 0,
          title: "Generated stage",
          type: "learn",
          difficulty: "beginner",
          prerequisiteStageId: null,
          syllabus: ["x"],
          freeResources: [],
          certifications: [],
          practiceLinks: [],
          estimatedDays: 1,
        },
      ],
      suggestedTimeline: [],
    });
    await seedCourse({ topic: "Curated Entry", stages: [{ title: "S", difficulty: "beginner", days: 1 }] });

    const res = await request(app).get("/courses");
    const topics = res.body.courses.map((c: { topic: string }) => c.topic);
    expect(topics).toContain("Curated Entry");
    expect(topics).not.toContain("Someone's Generated Topic");

    // And it cannot be reached directly either, so the builder cannot draw
    // stages out of it.
    await request(app).get("/courses/someones-generated-topic").expect(404);
  });

  it("derives stage count, total days and level from the stages", async () => {
    await seedCourse({
      topic: "Mixed Levels",
      stages: [
        { title: "S1", difficulty: "beginner", days: 3 },
        { title: "S2", difficulty: "advanced", days: 4 },
      ],
    });

    const res = await request(app).get("/courses?q=Mixed Levels");
    const course = res.body.courses[0];
    expect(course.stageCount).toBe(2);
    expect(course.totalDays).toBe(7);
    // The ceiling, not the floor — a course that ends advanced is advanced.
    expect(course.level).toBe("advanced");
    expect(course.difficulties).toEqual(["beginner", "advanced"]);
  });

  it("never ships stage bodies to the grid", async () => {
    await seedCourse({ topic: "Lean Payload", stages: [{ title: "S1", difficulty: "beginner", days: 1 }] });
    const res = await request(app).get("/courses?q=Lean Payload");
    expect(res.body.courses[0].stages).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/part 1/);
  });

  it("treats a regex metacharacter in the search box as literal text", async () => {
    await seedCourse({ topic: "C++ Fundamentals", stages: [{ title: "S1", difficulty: "beginner", days: 1 }] });

    const res = await request(app).get("/courses").query({ q: "C++" });
    expect(res.status).toBe(200);
    expect(res.body.courses[0].topic).toBe("C++ Fundamentals");
  });

  it("filters by category and by level", async () => {
    await seedCourse({
      topic: "Beginner Web",
      category: "Web Development",
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    await seedCourse({
      topic: "Advanced Data",
      category: "Data & AI",
      stages: [{ title: "S1", difficulty: "advanced", days: 1 }],
    });

    const web = await request(app).get("/courses").query({ category: "Web Development" });
    expect(web.body.courses.map((c: { topic: string }) => c.topic)).toEqual(["Beginner Web"]);

    const advanced = await request(app).get("/courses").query({ level: "advanced" });
    expect(advanced.body.courses.map((c: { topic: string }) => c.topic)).toEqual(["Advanced Data"]);
  });

  it("reports `saved` only for the signed-in learner", async () => {
    const course = await seedCourse({
      topic: "Saved Flag",
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    const learner = await register();
    const other = await register();

    await request(app)
      .post(`/roadmaps/${course._id.toString()}/save`)
      .set("Cookie", learner.cookies)
      .expect(200);

    const mine = await request(app).get("/courses?q=Saved Flag").set("Cookie", learner.cookies);
    expect(mine.body.courses[0].saved).toBe(true);
    expect(mine.body.courses[0].learners).toBe(1);

    const theirs = await request(app).get("/courses?q=Saved Flag").set("Cookie", other.cookies);
    expect(theirs.body.courses[0].saved).toBe(false);

    const anon = await request(app).get("/courses?q=Saved Flag");
    expect(anon.body.courses[0].saved).toBe(false);
  });

  it("caps the page size rather than honouring an unbounded limit", async () => {
    const res = await request(app).get("/courses?limit=5000");
    expect(res.status).toBe(422);
  });
});

describe("GET /courses/categories", () => {
  it("counts courses per category", async () => {
    await seedCourse({ topic: "A", category: "Web Development", stages: [{ title: "S", difficulty: "beginner", days: 2 }] });
    await seedCourse({ topic: "B", category: "Web Development", stages: [{ title: "S", difficulty: "beginner", days: 3 }] });
    await seedCourse({ topic: "C", category: "Data & AI", stages: [{ title: "S", difficulty: "beginner", days: 1 }] });

    const res = await request(app).get("/courses/categories");
    expect(res.status).toBe(200);
    const byName = Object.fromEntries(
      res.body.categories.map((c: { category: string; count: number; days: number }) => [
        c.category,
        c,
      ])
    );
    expect(byName["Web Development"].count).toBe(2);
    expect(byName["Web Development"].days).toBe(5);
    expect(byName["Data & AI"].count).toBe(1);
  });
});

describe("GET /courses/:idOrSlug", () => {
  it("returns the full course with its stages", async () => {
    const course = await seedCourse({
      topic: "Full Detail",
      stages: [{ title: "S1", difficulty: "beginner", days: 2 }],
    });

    const bySlug = await request(app).get(`/courses/${course.slug}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.course.stages[0].syllabus).toHaveLength(2);
    expect(bySlug.body.meta.totalDays).toBe(2);

    const byId = await request(app).get(`/courses/${course._id.toString()}`);
    expect(byId.status).toBe(200);
    expect(byId.body.course.topic).toBe("Full Detail");
  });

  it("404s on an unpublished course even with a valid id", async () => {
    const course = await seedCourse({
      topic: "Private Course",
      published: false,
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    await request(app).get(`/courses/${course._id.toString()}`).expect(404);
  });
});

describe("POST /courses/custom", () => {
  it("requires authentication", async () => {
    await request(app).post("/courses/custom").send({ title: "Mine", stages: [] }).expect(401);
  });

  it("builds a private roadmap from picked stages and saves it to the library", async () => {
    const a = await seedCourse({
      topic: "Source A",
      stages: [
        { title: "A1", difficulty: "beginner", days: 2 },
        { title: "A2", difficulty: "intermediate", days: 3 },
      ],
    });
    const b = await seedCourse({
      topic: "Source B",
      stages: [{ title: "B1", difficulty: "advanced", days: 4 }],
    });
    const learner = await register();

    const res = await request(app)
      .post("/courses/custom")
      .set("Cookie", learner.cookies)
      .send({
        title: "My Own Path",
        stages: [
          { courseId: b._id.toString(), stageId: b.stages[0]!._id.toString() },
          { courseId: a._id.toString(), stageId: a.stages[1]!._id.toString() },
        ],
      });

    expect(res.status).toBe(201);
    const built = res.body.roadmap;
    expect(built.topic).toBe("My Own Path");
    expect(built.isPublicTemplate).toBe(false);
    expect(built.sourceModel).toBe("custom");

    // Order is the order picked, not the source order.
    expect(built.stages.map((s: { title: string }) => s.title)).toEqual(["B1", "A2"]);

    // Prerequisites are rebuilt from the new order, so stage 2 depends on
    // stage 1 of *this* roadmap — not on anything in the source course.
    expect(built.stages[0].prerequisiteStageId).toBeNull();
    expect(built.stages[1].prerequisiteStageId).toBe(built.stages[0]._id);

    // Stage ids are fresh, or progress would be shared with the catalog course.
    expect(built.stages[0]._id).not.toBe(b.stages[0]!._id.toString());

    // Timeline covers every estimated day: 4 + 3.
    expect(built.suggestedTimeline).toHaveLength(7);

    // And it is already in the library.
    const user = await User.findById(learner.id).select("savedRoadmaps").lean();
    expect(user!.savedRoadmaps.map((id) => id.toString())).toContain(built._id);
  });

  it("refuses to copy stages out of an unpublished course", async () => {
    const hidden = await seedCourse({
      topic: "Hidden Source",
      published: false,
      stages: [{ title: "H1", difficulty: "beginner", days: 1 }],
    });
    const learner = await register();

    const res = await request(app)
      .post("/courses/custom")
      .set("Cookie", learner.cookies)
      .send({
        title: "Sneaky Path",
        stages: [{ courseId: hidden._id.toString(), stageId: hidden.stages[0]!._id.toString() }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not in the published catalog/);
  });

  it("rejects an empty selection and an over-long one", async () => {
    const learner = await register();
    const course = await seedCourse({
      topic: "Plenty",
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    const pick = {
      courseId: course._id.toString(),
      stageId: course.stages[0]!._id.toString(),
    };

    await request(app)
      .post("/courses/custom")
      .set("Cookie", learner.cookies)
      .send({ title: "Empty", stages: [] })
      .expect(422);

    await request(app)
      .post("/courses/custom")
      .set("Cookie", learner.cookies)
      .send({ title: "Too many", stages: Array.from({ length: 21 }, () => pick) })
      .expect(422);
  });

  it("gives two learners building the same name distinct slugs", async () => {
    const course = await seedCourse({
      topic: "Shared Source",
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    const pick = {
      courseId: course._id.toString(),
      stageId: course.stages[0]!._id.toString(),
    };

    const one = await register();
    const two = await register();

    const first = await request(app)
      .post("/courses/custom")
      .set("Cookie", one.cookies)
      .send({ title: "Backend Path", stages: [pick] });
    const second = await request(app)
      .post("/courses/custom")
      .set("Cookie", two.cookies)
      .send({ title: "Backend Path", stages: [pick] });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.roadmap.slug).not.toBe(second.body.roadmap.slug);
  });

  it("keeps a built course out of the public catalog", async () => {
    const course = await seedCourse({
      topic: "Catalog Source",
      stages: [{ title: "S1", difficulty: "beginner", days: 1 }],
    });
    const learner = await register();

    await request(app)
      .post("/courses/custom")
      .set("Cookie", learner.cookies)
      .send({
        title: "Private Build",
        stages: [
          { courseId: course._id.toString(), stageId: course.stages[0]!._id.toString() },
        ],
      })
      .expect(201);

    const res = await request(app).get("/courses?q=Private Build");
    expect(res.body.courses).toHaveLength(0);
  });
});
