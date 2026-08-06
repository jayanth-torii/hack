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

describe("auth flow", () => {
  const email = "student@example.com";
  const password = "correct-horse-battery";

  it("registers a new user and sets auth cookies", async () => {
    const res = await request(app).post("/auth/register").send({ email, password });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/auth/register").send({ email, password });
    const res = await request(app).post("/auth/register").send({ email, password });
    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/auth/register").send({ email, password });
    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/auth/register").send({ email, password });
    const res = await request(app).post("/auth/login").send({ email, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("refreshes tokens using the refreshToken cookie, and logout revokes it", async () => {
    const registerRes = await request(app).post("/auth/register").send({ email, password });
    const cookies = registerRes.headers["set-cookie"] as unknown as string[];

    const refreshRes = await request(app).post("/auth/refresh").set("Cookie", cookies);
    expect(refreshRes.status).toBe(200);
    const newCookies = refreshRes.headers["set-cookie"] as unknown as string[];

    const logoutRes = await request(app).post("/auth/logout").set("Cookie", newCookies);
    expect(logoutRes.status).toBe(204);

    const reuseRes = await request(app).post("/auth/refresh").set("Cookie", newCookies);
    expect(reuseRes.status).toBe(401);
  });
});
