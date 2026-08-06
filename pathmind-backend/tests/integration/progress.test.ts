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
