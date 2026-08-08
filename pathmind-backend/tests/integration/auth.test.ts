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

  it("returns 409 for Google login when OAuth is not configured", async () => {
    const res = await request(app).get("/auth/google");
    expect(res.status).toBe(409);
  });

  it("google callback in login mode finds-or-creates the user, sets cookies and redirects with googleLogin=1", async () => {
    const svc = require("@/services/calendar/googleCalendar.service") as {
      isGoogleCalendarConfigured: () => boolean;
      exchangeCodeForTokenAndProfile: (code: string) => Promise<unknown>;
    };
    const configuredSpy = jest.spyOn(svc, "isGoogleCalendarConfigured").mockReturnValue(true);
    const exchangeSpy = jest
      .spyOn(svc, "exchangeCodeForTokenAndProfile")
      .mockResolvedValue({
        token: {
          accessToken: "mock-at",
          refreshToken: "mock-rt",
          expiresAt: new Date(Date.now() + 3_600_000),
        },
        profile: {
          email: "google.user@gmail.com",
          name: "Google User",
          picture: "https://example.com/p.png",
        },
      });

    const state = JSON.stringify({ mode: "login", next: "/saved" });
    const res = await request(app).get(
      `/auth/google/callback?code=fake-code&state=${encodeURIComponent(state)}`
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("googleLogin=1");
    expect(res.headers.location).toContain("/saved");
    expect(res.headers["set-cookie"]).toBeDefined();
    configuredSpy.mockRestore();
    exchangeSpy.mockRestore();
  });

  it("refuses password login for a Google-only account", async () => {
    const svc = require("@/services/calendar/googleCalendar.service") as {
      isGoogleCalendarConfigured: () => boolean;
      exchangeCodeForTokenAndProfile: (code: string) => Promise<unknown>;
    };
    const configuredSpy = jest.spyOn(svc, "isGoogleCalendarConfigured").mockReturnValue(true);
    const exchangeSpy = jest
      .spyOn(svc, "exchangeCodeForTokenAndProfile")
      .mockResolvedValue({
        token: {
          accessToken: "mock-at",
          refreshToken: "mock-rt",
          expiresAt: new Date(Date.now() + 3_600_000),
        },
        profile: { email: "gonly@gmail.com" },
      });

    const state = JSON.stringify({ mode: "login", next: "/" });
    await request(app).get(
      `/auth/google/callback?code=fake-code&state=${encodeURIComponent(state)}`
    );

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "gonly@gmail.com", password: "whatever123" });
    expect(res.status).toBe(401);

    configuredSpy.mockRestore();
    exchangeSpy.mockRestore();
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
