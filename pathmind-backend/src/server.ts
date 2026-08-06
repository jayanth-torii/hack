import { createApp } from "./app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { connectDB } from "@/config/db";
import { startCronJobs } from "@/workers/cronScheduler";

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`PathMind backend listening on port ${env.PORT} (mockMode=${env.MOCK_MODE})`);
    logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
  });

  startCronJobs();
}

main().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});
