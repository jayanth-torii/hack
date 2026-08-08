import { env } from "../../config/env";
import { logger } from "../../config/logger";

export interface LinkCheckResult {
  alive: boolean;
  status?: number;
}

const HEAD_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

/**
 * HTTP HEAD check used by the freshness worker to decide whether a stored
 * resource URL is still alive. In MOCK_MODE this simulates a mostly-healthy
 * link population (occasionally "dead", deterministically by URL) so the
 * worker's re-search/replace path is exercised without any real network
 * calls in dev/CI.
 */
export async function checkLinkAlive(url: string): Promise<LinkCheckResult> {
  if (env.MOCK_MODE) {
    return mockCheck(url);
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
      const response = await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      if (response.status >= 200 && response.status < 400) {
        return { alive: true, status: response.status };
      }
      // Some sites don't support HEAD; retry isn't going to change a 405, but
      // a 429/5xx might resolve on retry.
      if (response.status !== 405) return { alive: false, status: response.status };
      return { alive: true, status: response.status };
    } catch (err) {
      logger.warn({ err, url, attempt }, "HEAD check failed");
      if (attempt === MAX_RETRIES) return { alive: false };
    }
  }
  return { alive: false };
}

function mockCheck(url: string): LinkCheckResult {
  // Deterministic pseudo-randomness from the URL string so repeated runs in
  // tests/dev are stable, while still occasionally flagging a "dead" link.
  let hash = 0;
  for (const ch of url) hash = (hash * 31 + ch.charCodeAt(0)) % 97;
  const alive = hash % 10 !== 0; // ~90% "alive"
  return { alive, status: alive ? 200 : 404 };
}
