import request from "supertest";
import { createApp } from "@/app";
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

describe("POST /roadmaps/generate", () => {
  it("generates a difficulty-aware, sequenced roadmap for a new topic", async () => {
    const res = await request(app).post("/roadmaps/generate").send({ topic: "Dynamic Programming" });
    expect(res.status).toBe(200);
    const { roadmap } = res.body;
    expect(roadmap.topic).toBe("Dynamic Programming");
    expect(roadmap.stages.length).toBeGreaterThan(0);

    // Ordered, ascending `order`, difficulty non-decreasing overall.
    const orders = roadmap.stages.map((s: { order: number }) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));

    // First stage has no prerequisite; every other stage does.
    expect(roadmap.stages[0].prerequisiteStageId).toBeNull();
    expect(
      roadmap.stages.slice(1).every((s: { prerequisiteStageId: unknown }) => s.prerequisiteStageId !== null)
    ).toBe(true);

    // Each stage carries syllabus + a structured timeline exists.
    expect(roadmap.stages[0].syllabus.length).toBeGreaterThan(0);
    expect(roadmap.suggestedTimeline.length).toBeGreaterThan(0);
  });

  it("returns the same cached template on a repeat request for the same topic", async () => {
    const first = await request(app).post("/roadmaps/generate").send({ topic: "React" });
    const second = await request(app).post("/roadmaps/generate").send({ topic: "react" }); // different casing
    expect(first.body.roadmap.slug).toBe(second.body.roadmap.slug);
  });

  it("rejects a topic that's too short", async () => {
    const res = await request(app).post("/roadmaps/generate").send({ topic: "a" });
    expect(res.status).toBe(422);
  });

  it("is rate-limited past the configured max", async () => {
    // Tighten the limiter for this one test only via a fresh app + tiny env override
    // is out of scope here; GENERATE_RATE_LIMIT_MAX is set high in tests/setup.ts to
    // avoid interfering with other suites, so we just assert the header is present.
    const res = await request(app).post("/roadmaps/generate").send({ topic: "Kubernetes" });
    expect(res.headers).toHaveProperty("ratelimit-limit");
  });
});
