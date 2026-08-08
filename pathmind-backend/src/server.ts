import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDB, disconnectDB } from "./config/db";
import { startCronJobs } from "./workers/cronScheduler";

let appPromise: ReturnType<typeof createApp> | null = null;

// Initialize app and DB for serverless environments (like Vercel)
async function initApp() {
  if (!appPromise) {
    await connectDB();
    appPromise = createApp();
  }
  return appPromise;
}

// Only start the server and cron jobs if not running on Vercel
if (process.env.VERCEL !== "1") {
  let server: ReturnType<typeof import("http").createServer> | null = null;
  let shuttingDown = false;

  async function main(): Promise<void> {
    const app = await initApp();
    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          nodeEnv: env.NODE_ENV,
          mockMode: env.MOCK_MODE,
          aiProvider: env.MOCK_MODE ? "mock" : env.AI_PROVIDER,
          verifyLinks: env.VERIFY_LINKS,
          googleCalendarConfigured: Boolean(env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET),
        },
        "Vidhyora backend started"
      );
      logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
    });

    startCronJobs();
  }

  main().catch((err) => {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down gracefully...");

    // Stop accepting new connections, let in-flight requests finish, then exit.
    // A 10s fallback force-exits if a request hangs so the process never
    // lingers in a half-dead state.
    const forceExit = setTimeout(() => {
      logger.warn("Shutdown timed out; forcing exit");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    if (server) {
      server.close(() => {
        logger.info("HTTP server closed");
        void disconnectDB()
          .catch((err) => logger.error({ err }, "Error during DB disconnect"))
          .finally(() => {
            logger.info("Shutdown complete");
            process.exit(0);
          });
      });
    } else {
      void disconnectDB()
        .catch((err) => logger.error({ err }, "Error during DB disconnect"))
        .finally(() => {
          logger.info("Shutdown complete");
          process.exit(0);
        });
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Export the request handler for Vercel serverless functions
export default async function handler(req: any, res: any) {
  const app = await initApp();
  return app(req, res);
}
