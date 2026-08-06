import { logger } from "@/config/logger";
import { runFreshnessCheck } from "@/services/freshness/freshness.service";

export async function freshnessWorker(): Promise<void> {
  logger.info("freshness worker: run started");
  try {
    const stats = await runFreshnessCheck();
    logger.info({ stats }, "freshness worker: run completed");
  } catch (err) {
    logger.error({ err }, "freshness worker: run failed");
  }
}
