import type { Response } from "express";
import { env } from "../config/env";

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Cross-site (different domain) deployments need SameSite=None so the browser
// sends the auth cookies on fetch() calls from the frontend origin. Same-origin
// deployments should keep "lax" for extra CSRF protection. Configurable via
// COOKIE_SAME_SITE ("lax" | "none" | "strict"); defaults to "lax".
function resolveSameSite(): "lax" | "none" | "strict" {
  const value = env.COOKIE_SAME_SITE;
  if (value === "none" || value === "strict") return value;
  return "lax";
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const sameSite = resolveSameSite();
  const secure = env.NODE_ENV === "production" || sameSite === "none";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/auth/refresh",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
}
