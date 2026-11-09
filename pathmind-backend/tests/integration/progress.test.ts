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

async function registerAndLogin() {
  const res = await request(app)
    .post("/auth/register")
    .send({ email: `u${Date.now()}@example.com`, password: "hunter2hunter2" });
  return res.headers["set-cookie"] as unknown as string[];
}

describe("progress-linked unlock", () => {
  it("unlocks only the first stage initially, then progressively unlocks the next tier on completion", async () => {
    const cookies = await registerAndLogin();
    const genRes = await request(app).post("/roadmaps/generate").send({ topic: "Graph Theory" });
    const roadmap = genRes.body.roadmap;
    const stageIds = roadmap.stages
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map((s: { _id: string }) => s._id);

    const initial = await request(app)
      .get(`/roadmaps/${roadmap._id}/progress`)
      .set("Cookie", cookies);
    expect(initial.status).toBe(200);
    expect(initial.body.unlockedStageIds).toEqual([stageIds[0]]);

    // Cannot complete a locked (not-yet-unlocked) stage.
    const lockedAttempt = await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${stageIds[1]}`)
      .set("Cookie", cookies);
    expect(lockedAttempt.status).toBe(400);

    // Completing stage 0 unlocks stage 1.
    const afterFirst = await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${stageIds[0]}`)
      .set("Cookie", cookies);
    expect(afterFirst.status).toBe(200);
    expect(afterFirst.body.completedStageIds).toContain(stageIds[0]);
    expect(afterFirst.body.unlockedStageIds).toContain(stageIds[1]);
    expect(afterFirst.body.unlockedStageIds).not.toContain(stageIds[2]);

    // Completing stage 1 unlocks stage 2.
    const afterSecond = await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${stageIds[1]}`)
      .set("Cookie", cookies);
    expect(afterSecond.body.unlockedStageIds).toContain(stageIds[2]);
  });

  it("requires authentication", async () => {
    const genRes = await request(app).post("/roadmaps/generate").send({ topic: "Compilers" });
    const roadmap = genRes.body.roadmap;
    const res = await request(app).get(`/roadmaps/${roadmap._id}/progress`);
    expect(res.status).toBe(401);
  });
});

describe("per-lesson progress", () => {
  // Each test needs its own topic: generation is cached in-process, and
  // `clearCollections` empties the database without clearing that cache — so a
  // repeated topic hands back a roadmap whose rows no longer exist.
  let topicCounter = 0;

  async function setup() {
    topicCounter += 1;
    const cookies = await registerAndLogin();
    const genRes = await request(app)
      .post("/roadmaps/generate")
      .send({ topic: `Linear Algebra ${topicCounter}` });
    const roadmap = genRes.body.roadmap;
    const stages = roadmap.stages.sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    );
    return { cookies, roadmapId: roadmap._id as string, stages };
  }

  it("ticks and unticks a single syllabus item without touching stage completion", async () => {
    const { cookies, roadmapId, stages } = await setup();
    const stage = stages[0];
    expect(stage.syllabus.length).toBeGreaterThan(1);

    const ticked = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 0, done: true });

    expect(ticked.status).toBe(200);
    expect(ticked.body.completedItems[stage._id]).toEqual([0]);
    expect(ticked.body.stageCompleted).toBe(false);
    expect(ticked.body.completedStageIds).not.toContain(stage._id);

    // Idempotent: the same tick again is not an error and adds no duplicate.
    const again = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 0, done: true });
    expect(again.body.completedItems[stage._id]).toEqual([0]);

    const unticked = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 0, done: false });
    expect(unticked.body.completedItems[stage._id]).toBeUndefined();
  });

  it("completes the stage and unlocks the next one when the last item is ticked", async () => {
    const { cookies, roadmapId, stages } = await setup();
    const stage = stages[0];

    let body: Record<string, unknown> = {};
    for (let i = 0; i < stage.syllabus.length; i += 1) {
      const res = await request(app)
        .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
        .set("Cookie", cookies)
        .send({ index: i, done: true });
      expect(res.status).toBe(200);
      body = res.body;
    }

    expect(body.stageCompleted).toBe(true);
    expect(body.completedStageIds).toContain(stage._id);
    expect(body.unlockedStageIds).toContain(stages[1]._id);
  });

  it("unticking an item after completion does not relock the stage", async () => {
    const { cookies, roadmapId, stages } = await setup();
    const stage = stages[0];

    for (let i = 0; i < stage.syllabus.length; i += 1) {
      await request(app)
        .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
        .set("Cookie", cookies)
        .send({ index: i, done: true });
    }

    const res = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stage._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 0, done: false });

    expect(res.status).toBe(200);
    expect(res.body.completedStageIds).toContain(stage._id);
    expect(res.body.unlockedStageIds).toContain(stages[1]._id);
  });

  it("marking a whole stage complete ticks every one of its items", async () => {
    const { cookies, roadmapId, stages } = await setup();
    const stage = stages[0];

    const res = await request(app)
      .patch(`/roadmaps/${roadmapId}/progress/${stage._id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.completedItems[stage._id]).toHaveLength(stage.syllabus.length);
  });

  it("rejects an out-of-range index and a locked stage", async () => {
    const { cookies, roadmapId, stages } = await setup();

    const outOfRange = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stages[0]._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 999, done: true });
    expect(outOfRange.status).toBe(400);

    const locked = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stages[1]._id}/items`)
      .set("Cookie", cookies)
      .send({ index: 0, done: true });
    expect(locked.status).toBe(400);
  });

  it("requires authentication", async () => {
    const { roadmapId, stages } = await setup();
    const res = await request(app)
      .put(`/roadmaps/${roadmapId}/progress/${stages[0]._id}/items`)
      .send({ index: 0, done: true });
    expect(res.status).toBe(401);
  });
});
