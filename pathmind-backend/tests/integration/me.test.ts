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

const PASSWORD = "hunter2hunter2";

async function registerAndLogin(): Promise<string[]> {
  const res = await request(app)
    .post("/auth/register")
    .send({ email: `u${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`, password: PASSWORD });
  expect(res.status).toBe(201);
  return res.headers["set-cookie"] as unknown as string[];
}

/** Generates a roadmap, saves it, and completes every stage in unlock order. */
async function completeWholeRoadmap(cookies: string[], topic: string) {
  const gen = await request(app).post("/roadmaps/generate").send({ topic });
  expect(gen.status).toBe(200);
  const roadmap = gen.body.roadmap;

  await request(app).post(`/roadmaps/${roadmap._id}/save`).set("Cookie", cookies).expect(200);

  const stageIds: string[] = roadmap.stages
    .slice()
    .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
    .map((s: { _id: string }) => s._id);

  for (const stageId of stageIds) {
    const res = await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${stageId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
  }

  return { roadmap, stageIds };
}

describe("profile endpoints", () => {
  it("returns the join date and empty profile defaults for a new account", async () => {
    const cookies = await registerAndLogin();

    const res = await request(app).get("/me/profile").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      name: null,
      education: null,
      skills: [],
      interests: [],
      hasPassword: true,
      googleCalendarConnected: false,
    });
    expect(new Date(res.body.profile.joinedAt).getTime()).toBeGreaterThan(0);
    // Notification defaults must not opt a new account into periodic mail.
    expect(res.body.profile.notificationPrefs).toEqual({
      productUpdates: false,
      roadmapReminders: true,
      weeklyDigest: false,
    });
  });

  it("updates name, education, skills and interests, de-duplicating tags", async () => {
    const cookies = await registerAndLogin();

    const patch = await request(app)
      .patch("/me/profile")
      .set("Cookie", cookies)
      .send({
        name: "Jayanth",
        education: { school: "NCET", degree: "MCA", fieldOfStudy: "CS", graduationYear: 2026 },
        skills: ["Python", "python", "  Machine Learning  ", ""],
        interests: ["AI"],
      });

    expect(patch.status).toBe(200);
    expect(patch.body.profile.name).toBe("Jayanth");
    expect(patch.body.profile.skills).toEqual(["Python", "Machine Learning"]);
    expect(patch.body.profile.education).toMatchObject({ school: "NCET", graduationYear: 2026 });

    const read = await request(app).get("/me/profile").set("Cookie", cookies);
    expect(read.body.profile.skills).toEqual(["Python", "Machine Learning"]);
    expect(read.body.profile.interests).toEqual(["AI"]);
  });

  it("rejects an over-long skills list", async () => {
    const cookies = await registerAndLogin();
    const res = await request(app)
      .patch("/me/profile")
      .set("Cookie", cookies)
      .send({ skills: Array.from({ length: 31 }, (_, i) => `skill-${i}`) });
    // Schema failures are 422 in this codebase; 400 is reserved for
    // controller-level rejections like a wrong password.
    expect(res.status).toBe(422);
  });

  it("updates notification preferences without clobbering the untouched ones", async () => {
    const cookies = await registerAndLogin();
    const res = await request(app)
      .patch("/me/notifications")
      .set("Cookie", cookies)
      .send({ weeklyDigest: true });

    expect(res.status).toBe(200);
    expect(res.body.notificationPrefs).toEqual({
      productUpdates: false,
      roadmapReminders: true,
      weeklyDigest: true,
    });
  });

  it("requires authentication", async () => {
    await request(app).get("/me/profile").expect(401);
    await request(app).get("/me/overview").expect(401);
    await request(app).get("/me/certificates").expect(401);
  });
});

describe("password change", () => {
  it("rejects a wrong current password and accepts the correct one", async () => {
    const cookies = await registerAndLogin();
    const profile = await request(app).get("/me/profile").set("Cookie", cookies);
    const email = profile.body.profile.email;

    const wrong = await request(app)
      .post("/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: "not-the-password", newPassword: "brandnewpass1" });
    expect(wrong.status).toBe(400);

    const same = await request(app)
      .post("/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(same.status).toBe(400);

    const ok = await request(app)
      .post("/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: PASSWORD, newPassword: "brandnewpass1" });
    expect(ok.status).toBe(200);

    // The new password must actually work, and the old one must not.
    await request(app).post("/auth/login").send({ email, password: PASSWORD }).expect(401);
    await request(app).post("/auth/login").send({ email, password: "brandnewpass1" }).expect(200);
  });

  it("enforces the minimum length", async () => {
    const cookies = await registerAndLogin();
    const res = await request(app)
      .post("/auth/change-password")
      .set("Cookie", cookies)
      .send({ currentPassword: PASSWORD, newPassword: "short" });
    expect(res.status).toBe(422);
  });
});

describe("activity, streak and achievements", () => {
  it("records a stage completion once and reflects it in the feed, buckets and streak", async () => {
    const cookies = await registerAndLogin();
    const gen = await request(app).post("/roadmaps/generate").send({ topic: "Dynamic Programming" });
    const roadmap = gen.body.roadmap;
    const firstStage = roadmap.stages.slice().sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    )[0]._id;

    await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${firstStage}`)
      .set("Cookie", cookies)
      .expect(200);

    // Re-marking the same stage must not double count.
    await request(app)
      .patch(`/roadmaps/${roadmap._id}/progress/${firstStage}`)
      .set("Cookie", cookies)
      .expect(200);

    const activity = await request(app).get("/me/activity?range=week").set("Cookie", cookies);
    expect(activity.status).toBe(200);
    expect(activity.body.range).toBe("week");
    expect(activity.body.buckets).toHaveLength(7);

    const completions = activity.body.feed.filter(
      (e: { type: string }) => e.type === "stage_completed"
    );
    expect(completions).toHaveLength(1);

    const todayBucket = activity.body.buckets[activity.body.buckets.length - 1];
    expect(todayBucket.count).toBe(1);
    expect(activity.body.buckets.reduce((n: number, b: { count: number }) => n + b.count, 0)).toBe(1);

    const overview = await request(app).get("/me/overview").set("Cookie", cookies);
    expect(overview.body.overview.currentStreak).toBe(1);
    expect(overview.body.overview.completedStages).toBe(1);
  });

  it("returns 30 buckets for the month range", async () => {
    const cookies = await registerAndLogin();
    const res = await request(app).get("/me/activity?range=month").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.buckets).toHaveLength(30);
  });

  it("rejects an unknown range", async () => {
    const cookies = await registerAndLogin();
    await request(app).get("/me/activity?range=decade").set("Cookie", cookies).expect(422);
  });

  it("unlocks achievements only once the data supports them", async () => {
    const cookies = await registerAndLogin();

    const before = await request(app).get("/me/achievements").set("Cookie", cookies);
    expect(before.status).toBe(200);
    expect(before.body.achievements.every((a: { unlocked: boolean }) => !a.unlocked)).toBe(true);

    await completeWholeRoadmap(cookies, "Graph Theory");

    const after = await request(app).get("/me/achievements").set("Cookie", cookies);
    const unlocked = after.body.achievements
      .filter((a: { unlocked: boolean }) => a.unlocked)
      .map((a: { key: string }) => a.key);

    expect(unlocked).toEqual(expect.arrayContaining(["first_roadmap", "first_stage"]));
    // Three distinct topics are needed for this one; only one was saved.
    expect(unlocked).not.toContain("topic_explorer");
    // A 7-day streak cannot be earned inside a single test run.
    expect(unlocked).not.toContain("streak_7");
  });
});

describe("certificates", () => {
  it("refuses to issue before every stage is complete", async () => {
    const cookies = await registerAndLogin();
    const gen = await request(app).post("/roadmaps/generate").send({ topic: "Operating Systems" });
    const roadmap = gen.body.roadmap;

    const res = await request(app)
      .post(`/roadmaps/${roadmap._id}/certificate`)
      .set("Cookie", cookies);

    expect(res.status).toBe(400);
    expect(res.body.message ?? res.body.error).toMatch(/stage/i);
  });

  it("issues once, is idempotent, and downloads as a real PDF", async () => {
    const cookies = await registerAndLogin();
    const { roadmap } = await completeWholeRoadmap(cookies, "Computer Networks");

    const issued = await request(app)
      .post(`/roadmaps/${roadmap._id}/certificate`)
      .set("Cookie", cookies);
    expect(issued.status).toBe(201);
    expect(issued.body.certificate.serial).toMatch(/^VID-\d{4}-[0-9A-F]{8}$/);
    expect(issued.body.certificate.stagesCompleted).toBe(roadmap.stages.length);

    // Second call returns the same credential rather than minting a new one.
    const again = await request(app)
      .post(`/roadmaps/${roadmap._id}/certificate`)
      .set("Cookie", cookies);
    expect(again.status).toBe(200);
    expect(again.body.certificate.serial).toBe(issued.body.certificate.serial);

    const list = await request(app).get("/me/certificates").set("Cookie", cookies);
    expect(list.body.certificates).toHaveLength(1);

    const download = await request(app)
      .get(`/me/certificates/${issued.body.certificate.id}/download`)
      .set("Cookie", cookies)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });

    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toMatch(/application\/pdf/);
    expect(download.headers["content-disposition"]).toMatch(/attachment; filename=/);

    const pdf = download.body as Buffer;
    expect(pdf.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
    expect(pdf.toString("latin1").trimEnd().endsWith("%%EOF")).toBe(true);
    expect(pdf.length).toBeGreaterThan(800);
  });

  it("will not hand a certificate to a different learner", async () => {
    const owner = await registerAndLogin();
    const { roadmap } = await completeWholeRoadmap(owner, "Databases");
    const issued = await request(app)
      .post(`/roadmaps/${roadmap._id}/certificate`)
      .set("Cookie", owner);

    const stranger = await registerAndLogin();
    await request(app)
      .get(`/me/certificates/${issued.body.certificate.id}/download`)
      .set("Cookie", stranger)
      .expect(404);
  });
});

describe("goals", () => {
  it("rejects a past target date and accepts a future one, then deletes it", async () => {
    const cookies = await registerAndLogin();
    const gen = await request(app).post("/roadmaps/generate").send({ topic: "Linear Algebra" });
    const roadmapId = gen.body.roadmap._id;

    const past = await request(app)
      .put(`/me/goals/${roadmapId}`)
      .set("Cookie", cookies)
      .send({ targetDate: "2020-01-01" });
    expect(past.status).toBe(400);

    const future = new Date();
    future.setDate(future.getDate() + 30);
    const ok = await request(app)
      .put(`/me/goals/${roadmapId}`)
      .set("Cookie", cookies)
      .send({ targetDate: future.toISOString(), note: "before finals" });
    expect(ok.status).toBe(200);
    expect(ok.body.goal.note).toBe("before finals");

    // Upsert: a second PUT edits rather than duplicating.
    const later = new Date();
    later.setDate(later.getDate() + 60);
    await request(app)
      .put(`/me/goals/${roadmapId}`)
      .set("Cookie", cookies)
      .send({ targetDate: later.toISOString() })
      .expect(200);

    const list = await request(app).get("/me/goals").set("Cookie", cookies);
    expect(list.body.goals).toHaveLength(1);

    await request(app).delete(`/me/goals/${roadmapId}`).set("Cookie", cookies).expect(200);
    await request(app).delete(`/me/goals/${roadmapId}`).set("Cookie", cookies).expect(404);
  });
});

describe("library: favourites, unsave and progress summary", () => {
  it("summarises completion per saved roadmap in one request", async () => {
    const cookies = await registerAndLogin();
    const { roadmap } = await completeWholeRoadmap(cookies, "Compilers");

    const res = await request(app).get("/me/progress-summary").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.summary).toHaveLength(1);
    expect(res.body.summary[0]).toMatchObject({
      roadmapId: roadmap._id,
      totalStages: roadmap.stages.length,
      completedStages: roadmap.stages.length,
      percent: 100,
      isComplete: true,
      isFavorite: false,
    });
    expect(new Date(res.body.summary[0].lastActivityAt).getTime()).toBeGreaterThan(0);
  });

  it("toggles the favourite star and removes a roadmap without destroying progress", async () => {
    const cookies = await registerAndLogin();
    const gen = await request(app).post("/roadmaps/generate").send({ topic: "Statistics" });
    const roadmapId = gen.body.roadmap._id;
    const firstStage = gen.body.roadmap.stages.slice().sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    )[0]._id;

    await request(app).post(`/roadmaps/${roadmapId}/save`).set("Cookie", cookies).expect(200);
    await request(app)
      .patch(`/roadmaps/${roadmapId}/progress/${firstStage}`)
      .set("Cookie", cookies)
      .expect(200);

    const on = await request(app).put(`/roadmaps/${roadmapId}/favorite`).set("Cookie", cookies);
    expect(on.body.favorite).toBe(true);

    const off = await request(app).put(`/roadmaps/${roadmapId}/favorite`).set("Cookie", cookies);
    expect(off.body.favorite).toBe(false);

    await request(app).delete(`/roadmaps/${roadmapId}/save`).set("Cookie", cookies).expect(200);

    const saved = await request(app).get("/roadmaps/saved").set("Cookie", cookies);
    expect(saved.body.roadmaps).toHaveLength(0);

    // Progress survives an unsave, so re-saving restores the learner's place.
    const progress = await request(app)
      .get(`/roadmaps/${roadmapId}/progress`)
      .set("Cookie", cookies);
    expect(progress.body.completedStageIds).toHaveLength(1);
  });
});
