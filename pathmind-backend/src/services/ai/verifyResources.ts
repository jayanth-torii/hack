import { checkLinkAlive, type LinkCheckResult } from "../freshness/linkChecker.service";
import type { FreeResourceDraft } from "./AIProvider.interface";

/**
 * Last line of defense against fabricated/broken resource URLs: every
 * normalized draft is liveness-checked before persistence.
 *
 * Drop policy is deliberately conservative:
 * - Drop ONLY on a definitive dead status (404 / 410).
 * - Keep on any uncertainty — timeouts, network errors, 429/5xx, 405, or a
 *   bot-blocking challenge — so a temporarily flaky site never costs the
 *   student a real resource.
 */
const DEFINITIVELY_DEAD = new Set([404, 410]);

/** Max HEAD checks in flight at once — bounds generation latency when a site
 * is slow or unreachable (checkLinkAlive times out at 5s × up to 2 retries). */
const CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function verifyResourceLinks(
  resources: FreeResourceDraft[],
  check: (url: string) => Promise<LinkCheckResult> = checkLinkAlive
): Promise<FreeResourceDraft[]> {
  const results = await mapWithConcurrency(resources, CONCURRENCY, async (resource) => {
    const result = await check(resource.url);
    // Drop ONLY on a definitive dead status (404/410); keep on any uncertainty
    // (timeouts, network errors, 429/5xx, bot-blocking) so a temporarily
    // flaky site never costs the student a real resource.
    if (!result.alive && result.status !== undefined && DEFINITIVELY_DEAD.has(result.status)) {
      return null;
    }
    return resource;
  });

  return results.filter((r): r is FreeResourceDraft => r !== null);
}
