import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { env } from "./env";
import { logger } from "./logger";

function clientKey(req: Request): string {
  return req.auth?.userId ?? req.ip ?? "anonymous";
}

// Aggressive limit on the AI generation endpoint specifically — it's the expensive path.
export const generateLimiter = rateLimit({
  windowMs: env.GENERATE_RATE_LIMIT_WINDOW_MS,
  max: env.GENERATE_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => clientKey(req),
  message: { error: "Too many roadmap generation requests. Try again later." },
  handler: (req, res, _next, options) => {
    logger.warn(
      { reqId: req.id, key: clientKey(req), method: req.method, path: req.originalUrl },
      "Rate limit exceeded: roadmap generation"
    );
    // res.send mirrors express-rate-limit's default handler exactly, so the
    // response shape (object → JSON, string → text) is unchanged from before.
    res.status(options.statusCode).send(options.message);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests. Try again later." },
  handler: (req, res, _next, options) => {
    logger.warn(
      { reqId: req.id, key: clientKey(req), method: req.method, path: req.originalUrl },
      "Rate limit exceeded: auth"
    );
    res.status(options.statusCode).send(options.message);
  },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn(
      { reqId: req.id, key: clientKey(req), method: req.method, path: req.originalUrl },
      "Rate limit exceeded: global"
    );
    res.status(options.statusCode).send(options.message);
  },
});
