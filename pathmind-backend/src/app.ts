import { randomUUID } from "crypto";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { globalLimiter } from "./config/rateLimits";
import { apiRouter } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      // CORS_ORIGINS (comma-separated) is the explicit allowlist for
      // production. When empty, every origin is reflected — fine for local
      // development and mock mode. With credentials:true the browser only
      // accepts the reflected origin when it matches the requesting one.
      origin: (origin, callback) => {
        if (env.CORS_ORIGINS) {
          const allowed = env.CORS_ORIGINS.split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          // callback(null, false) omits Access-Control-Allow-Origin so the
          // browser blocks the response — no 500, no error log for a blocked
          // origin, and credentials never leak to an unlisted site.
          callback(null, !origin || allowed.includes(origin));
        } else {
          // No allowlist configured (local dev / mock mode): reflect any origin.
          callback(null, true);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
      // Correlation id: prefer a client-provided id (for frontend/edge
      // tracing), fall back to a fresh UUID so every log line from one
      // request shares the same req.id.
      genReqId: (req) => {
        const header = req.headers["x-request-id"];
        if (typeof header === "string" && header.length > 0 && header.length <= 100) {
          return header;
        }
        return randomUUID();
      },
    })
  );
  app.use(globalLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", mockMode: env.MOCK_MODE });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
