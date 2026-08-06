import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { swaggerSpec } from "@/config/swagger";
import { globalLimiter } from "@/config/rateLimits";
import { apiRouter } from "@/routes";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));
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
