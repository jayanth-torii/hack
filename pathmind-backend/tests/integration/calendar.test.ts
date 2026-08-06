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

describe("POST /roadmaps/:id/export-calendar", () => {
  it("downloads a valid .ics file by default (no auth required)", async () => {
    const genRes = await request(app).post("/roadmaps/generate").send({ topic: "Rust" });
    const roadmap = genRes.body.roadmap;

    const res = await request(app).post(`/roadmaps/${roadmap._id}/export-calendar`).send({});
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/calendar");
    expect(res.text).toContain("BEGIN:VCALENDAR");
  });

  it("returns 409 for format=google when the user hasn't connected Google Calendar", async () => {
    const registerRes = await request(app)
      .post("/auth/register")
      .send({ email: `cal${Date.now()}@example.com`, password: "hunter2hunter2" });
    const cookies = registerRes.headers["set-cookie"] as unknown as string[];

    const genRes = await request(app).post("/roadmaps/generate").send({ topic: "Kotlin" });
    const roadmap = genRes.body.roadmap;

    const res = await request(app)
      .post(`/roadmaps/${roadmap._id}/export-calendar`)
      .set("Cookie", cookies)
      .send({ format: "google" });
    expect(res.status).toBe(409);
  });

  it("returns 404 for an unknown roadmap id", async () => {
    const res = await request(app)
      .post("/roadmaps/64b7f3a1e1b1c2d3e4f5a6b7/export-calendar")
      .send({});
    expect(res.status).toBe(404);
  });
});
