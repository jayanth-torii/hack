import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDB, connectWithRetry, disconnectDB } from "./config/db";
import { startCronJobs } from "./workers/cronScheduler";

let appPromise: ReturnType<typeof createApp> | null = null;

// Serverless (Vercel) path: a function invocation has no long-lived process
// to retry in, so it must have a live connection before handling the request.
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
  let cronStarted = false;

  async function main(): Promise<void> {
    // Bind the port FIRST, then connect to the database in the background.
    //
    // Previously this awaited connectDB() before listen(), so an unreachable
    // database meant the port was never opened: the host's port scan failed
    // ("No open ports detected"), the process exited 1, and the deploy
    // crash-looped — hiding the real cause behind a startup failure.
    //
    // Now the service always comes up. /health reports the database as down
    // (503) until it connects, and the connection self-heals without a
    // redeploy once the database is reachable again.
    const app = createApp();
    // Cache it so the exported serverless handler reuses this instance
    // rather than building a second one.
    appPromise = app;

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

    // Cron jobs touch the database, so they only start once it is reachable.
    connectWithRetry(() => {
      if (!cronStarted) {
        cronStarted = true;
        startCronJobs();
      }
    });
  }

  // Only a genuine startup failure (e.g. the port is already in use) is
  // fatal now — a database outage no longer kills the process.
  main().catch((err) => {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
  });

  // A rejected promise anywhere in the app would otherwise terminate the
  // process on Node 15+ with no useful log line.
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
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
