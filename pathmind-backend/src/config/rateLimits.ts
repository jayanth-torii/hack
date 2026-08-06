import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { env } from "./env";

// Aggressive limit on the AI generation endpoint specifically — it's the expensive path.
export const generateLimiter = rateLimit({
  windowMs: env.GENERATE_RATE_LIMIT_WINDOW_MS,
  max: env.GENERATE_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.auth?.userId ?? req.ip ?? "anonymous",
  message: { error: "Too many roadmap generation requests. Try again later." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests. Try again later." },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
