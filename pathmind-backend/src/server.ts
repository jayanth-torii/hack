import { createApp } from "./app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { connectDB } from "@/config/db";
import { startCronJobs } from "@/workers/cronScheduler";

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
  async function main(): Promise<void> {
    const app = await initApp();
    app.listen(env.PORT, () => {
      logger.info(`Vidhyora backend listening on port ${env.PORT} (mockMode=${env.MOCK_MODE})`);
      logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
    });

    startCronJobs();
  }

  main().catch((err) => {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
  });
}

// Export the request handler for Vercel serverless functions
export default async function handler(req: any, res: any) {
  const app = await initApp();
  return app(req, res);
}
