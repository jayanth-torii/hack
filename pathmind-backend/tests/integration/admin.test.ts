import request from "supertest";
import { createApp } from "@/app";
import { User } from "@/models/User";
import { Roadmap } from "@/models/Roadmap";
import { AuditLog } from "@/models/AuditLog";
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
function uniqueEmail(prefix = "u"): string {
  seq += 1;
  return `${prefix}${Date.now()}${seq}@example.com`;
}

async function register(email = uniqueEmail()): Promise<{ cookies: string[]; email: string; id: string }> {
  const res = await request(app).post("/auth/register").send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return {
    cookies: res.headers["set-cookie"] as unknown as string[],
    email,
    id: res.body.user.id as string,
  };
}

/** Promotes directly in the database — the same thing `npm run admin:grant` does. */
async function makeAdmin(email: string): Promise<void> {
  await User.updateOne({ email }, { $set: { role: "admin" } });
}

/** Registers an account, promotes it, then logs in so the session reflects the role. */
async function registerAdmin(): Promise<{ cookies: string[]; email: string; id: string }> {
  const account = await register(uniqueEmail("admin"));
  await makeAdmin(account.email);
  const login = await request(app)
    .post("/auth/login")
    .send({ email: account.email, password: PASSWORD });
  expect(login.status).toBe(200);
  expect(login.body.user.role).toBe("admin");
  return { ...account, cookies: login.headers["set-cookie"] as unknown as string[] };
}

describe("admin authorization", () => {
  it("refuses an anonymous caller with 401", async () => {
    await request(app).get("/admin/stats").expect(401);
  });

  it("refuses a signed-in non-admin with 403 on every admin route", async () => {
    const { cookies } = await register();
    for (const path of [
      "/admin/stats",
      "/admin/users",
      "/admin/roadmaps",
      "/admin/resources",
      "/admin/audit",
      "/admin/activity",
    ]) {
      const res = await request(app).get(path).set("Cookie", cookies);
      expect([path, res.status]).toEqual([path, 403]);
    }
  });

  it("allows an admin through", async () => {
    const { cookies } = await registerAdmin();
    const res = await request(app).get("/admin/stats").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.stats.users.total).toBeGreaterThanOrEqual(1);
  });

  /**
   * The role claim inside the JWT is a convenience, not the authority. A token
   * minted while the account was an admin must stop working the moment the
   * role is taken away — without waiting for the 15-minute expiry.
   */
  it("stops honouring a token whose role was revoked in the database", async () => {
    const admin = await registerAdmin();
    const second = await register(uniqueEmail("admin2"));
    await makeAdmin(second.email);

    await request(app).get("/admin/stats").set("Cookie", admin.cookies).expect(200);

    await User.updateOne({ email: admin.email }, { $set: { role: "user" } });

    // Same cookie, same unexpired token, still says role=admin inside.
    await request(app).get("/admin/stats").set("Cookie", admin.cookies).expect(403);
  });

  it("refuses a suspended admin", async () => {
    const admin = await registerAdmin();
    const second = await register(uniqueEmail("admin2"));
    await makeAdmin(second.email);

    await User.updateOne({ email: admin.email }, { $set: { suspended: true } });
    await request(app).get("/admin/stats").set("Cookie", admin.cookies).expect(403);
  });
});

describe("suspension", () => {
  it("blocks login and refuses to refresh an existing session", async () => {
    const admin = await registerAdmin();
    const victim = await register();

    const res = await request(app)
      .patch(`/admin/users/${victim.id}`)
      .set("Cookie", admin.cookies)
      .send({ suspended: true, suspendedReason: "spam" });
    expect(res.status).toBe(200);
    expect(res.body.user.suspended).toBe(true);

    // Password login is refused outright.
    const login = await request(app)
      .post("/auth/login")
      .send({ email: victim.email, password: PASSWORD });
    expect(login.status).toBe(403);

    // And the live session cannot be renewed, so it dies at token expiry.
    const refresh = await request(app).post("/auth/refresh").set("Cookie", victim.cookies);
    expect(refresh.status).toBe(403);
  });

  it("restores access when the suspension is lifted", async () => {
    const admin = await registerAdmin();
    const victim = await register();

    await request(app)
      .patch(`/admin/users/${victim.id}`)
      .set("Cookie", admin.cookies)
      .send({ suspended: true })
      .expect(200);
    await request(app)
      .patch(`/admin/users/${victim.id}`)
      .set("Cookie", admin.cookies)
      .send({ suspended: false })
      .expect(200);

    await request(app)
      .post("/auth/login")
      .send({ email: victim.email, password: PASSWORD })
      .expect(200);
  });
});

describe("lockout guards", () => {
  it("refuses to let an admin demote or suspend themselves", async () => {
    const admin = await registerAdmin();

    const demote = await request(app)
      .patch(`/admin/users/${admin.id}`)
      .set("Cookie", admin.cookies)
      .send({ role: "user" });
    expect(demote.status).toBe(400);

    const suspend = await request(app)
      .patch(`/admin/users/${admin.id}`)
      .set("Cookie", admin.cookies)
      .send({ suspended: true });
    expect(suspend.status).toBe(400);

    await request(app).get("/admin/stats").set("Cookie", admin.cookies).expect(200);
  });

  it("refuses to demote the last remaining admin", async () => {
    const first = await registerAdmin();
    const second = await register(uniqueEmail("admin2"));
    await makeAdmin(second.email);
    const secondLogin = await request(app)
      .post("/auth/login")
      .send({ email: second.email, password: PASSWORD });
    const secondCookies = secondLogin.headers["set-cookie"] as unknown as string[];

    // Second demotes first — fine, one admin remains.
    await request(app)
      .patch(`/admin/users/${first.id}`)
      .set("Cookie", secondCookies)
      .send({ role: "user" })
      .expect(200);

    // Now first (no longer an admin) cannot act at all, and nobody can demote
    // the last one — so the only remaining path is another grant from the CLI.
    const freshAdmin = await register(uniqueEmail("admin3"));
    await makeAdmin(freshAdmin.email);
    const freshLogin = await request(app)
      .post("/auth/login")
      .send({ email: freshAdmin.email, password: PASSWORD });
    const freshCookies = freshLogin.headers["set-cookie"] as unknown as string[];

    await request(app)
      .patch(`/admin/users/${second.id}`)
      .set("Cookie", freshCookies)
      .send({ role: "user" })
      .expect(200);

    // freshAdmin is now the only admin left and cannot be demoted by itself.
    const last = await request(app)
      .patch(`/admin/users/${freshAdmin.id}`)
      .set("Cookie", freshCookies)
      .send({ role: "user" });
    expect(last.status).toBe(400);
  });
});

describe("admin user directory", () => {
  it("never returns a password or refresh-token hash", async () => {
    const admin = await registerAdmin();
    await register();

    const res = await request(app).get("/admin/users").set("Cookie", admin.cookies);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toMatch(/passwordHash/);
    expect(serialised).not.toMatch(/refreshTokenHash/);
    expect(serialised).not.toMatch(/\$2[aby]\$/); // a bcrypt hash, by shape
  });

  it("filters by search term and by role", async () => {
    const admin = await registerAdmin();
    await register("findme-unique@example.com");

    const search = await request(app)
      .get("/admin/users?q=findme-unique")
      .set("Cookie", admin.cookies);
    expect(search.body.total).toBe(1);
    expect(search.body.items[0].email).toBe("findme-unique@example.com");

    const admins = await request(app).get("/admin/users?role=admin").set("Cookie", admin.cookies);
    expect(admins.body.items.every((u: { role: string }) => u.role === "admin")).toBe(true);
  });
});

describe("admin roadmap management", () => {
  async function seedCourse(overrides: Record<string, unknown> = {}) {
    return Roadmap.create({
      topic: "Test Course",
      normalizedTopic: "test course",
      slug: `test-course-${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      category: "Web Development",
      summary: "A course used by the admin tests.",
      isPublicTemplate: true,
      sourceModel: "curated",
      stages: [
        {
          order: 0,
          title: "Stage one",
          type: "learn",
          difficulty: "beginner",
          prerequisiteStageId: null,
          syllabus: ["a", "b"],
          freeResources: [
            { title: "Docs", url: "https://example.com", type: "doc", verified: true },
          ],
          certifications: [],
          practiceLinks: [],
          estimatedDays: 2,
        },
      ],
      suggestedTimeline: [{ day: 1, tasks: ["a"] }],
      ...overrides,
    });
  }

  it("unpublishes a course and writes an audit entry", async () => {
    const admin = await registerAdmin();
    const course = await seedCourse();

    const res = await request(app)
      .patch(`/admin/roadmaps/${course._id.toString()}`)
      .set("Cookie", admin.cookies)
      .send({ isPublicTemplate: false });
    expect(res.status).toBe(200);
    expect(res.body.roadmap.published).toBe(false);

    const entries = await AuditLog.find({ targetId: course._id.toString() }).lean();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.action).toBe("roadmap.unpublished");
    expect(entries[0]!.actorEmail).toBe(admin.email);
    // The label is frozen so the log stays readable after a delete.
    expect(entries[0]!.targetLabel).toBe("Test Course");

    // And it drops out of the public catalog immediately.
    const catalog = await request(app).get("/courses?q=Test Course");
    expect(catalog.body.courses).toHaveLength(0);
  });

  it("refuses to delete a course a learner still has saved", async () => {
    const admin = await registerAdmin();
    const learner = await register();
    const course = await seedCourse();

    await request(app)
      .post(`/roadmaps/${course._id.toString()}/save`)
      .set("Cookie", learner.cookies)
      .expect(200);

    const res = await request(app)
      .delete(`/admin/roadmaps/${course._id.toString()}`)
      .set("Cookie", admin.cookies);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Unpublish it instead/);

    expect(await Roadmap.exists({ _id: course._id })).toBeTruthy();
  });

  it("deletes a course nobody has saved", async () => {
    const admin = await registerAdmin();
    const course = await seedCourse();

    await request(app)
      .delete(`/admin/roadmaps/${course._id.toString()}`)
      .set("Cookie", admin.cookies)
      .expect(200);

    expect(await Roadmap.exists({ _id: course._id })).toBeNull();
    const entries = await AuditLog.find({ action: "roadmap.deleted" }).lean();
    expect(entries).toHaveLength(1);
  });
});

describe("admin user deletion", () => {
  it("removes the account and its learning data but keeps the audit entry", async () => {
    const admin = await registerAdmin();
    const victim = await register();

    await request(app)
      .delete(`/admin/users/${victim.id}`)
      .set("Cookie", admin.cookies)
      .expect(200);

    expect(await User.exists({ _id: victim.id })).toBeNull();
    const entries = await AuditLog.find({ action: "user.deleted" }).lean();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.targetLabel).toBe(victim.email);
  });
});
