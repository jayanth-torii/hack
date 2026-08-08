import cron from "node-cron";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { freshnessWorker } from "./freshnessWorker";

/**
 * Registers the freshness-check cron job. Schedule is documented and
 * configurable via FRESHNESS_CRON_SCHEDULE (default: daily at 03:00,
 * "0 3 * * *") — chosen to run off-peak, well outside typical study hours.
 * Called once from server.ts on boot; a no-op in test env.
 */
export function startCronJobs(): void {
  if (env.NODE_ENV === "test") return;

  cron.schedule(env.FRESHNESS_CRON_SCHEDULE, () => {
    void freshnessWorker();
  });

  logger.info(
    { schedule: env.FRESHNESS_CRON_SCHEDULE },
    "freshness cron job registered"
  );
}
