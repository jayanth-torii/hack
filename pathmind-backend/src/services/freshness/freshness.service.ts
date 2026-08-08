import { Roadmap } from "../../models/Roadmap";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { checkLinkAlive } from "./linkChecker.service";
import { webSearch } from "../ai/webSearch";
import { invalidateRoadmapCache } from "../cache/cacheService";

const STALE_MS = env.FRESHNESS_STALE_DAYS * 24 * 60 * 60 * 1000;

interface FreshnessRunStats {
  roadmapsScanned: number;
  resourcesChecked: number;
  resourcesReplaced: number;
  resourcesDropped: number;
}

/**
 * The freshness-check worker's core algorithm (invoked by the node-cron
 * schedule in workers/cronScheduler.ts, and callable directly from tests):
 *
 *   for each public template roadmap:
 *     for each free resource / certification older than FRESHNESS_STALE_DAYS:
 *       HEAD-check it
 *       if alive: bump lastVerifiedAt to now
 *       else: re-run web search for a replacement; swap the URL in if found,
 *             otherwise drop the resource and log it
 *     save the roadmap (single write; all readers share this one template)
 *     invalidate its Redis cache entry so the next read repopulates fresh
 */
export async function runFreshnessCheck(): Promise<FreshnessRunStats> {
  const stats: FreshnessRunStats = {
    roadmapsScanned: 0,
    resourcesChecked: 0,
    resourcesReplaced: 0,
    resourcesDropped: 0,
  };

  const roadmaps = await Roadmap.find({ isPublicTemplate: true });

  for (const roadmap of roadmaps) {
    stats.roadmapsScanned++;
    let mutated = false;

    for (const stage of roadmap.stages) {
      const survivors: typeof stage.freeResources = [];
      for (const resource of stage.freeResources) {
        if (Date.now() - resource.lastVerifiedAt.getTime() < STALE_MS) {
          survivors.push(resource);
          continue;
        }
        stats.resourcesChecked++;
        const check = await checkLinkAlive(resource.url);
        if (check.alive) {
          resource.lastVerifiedAt = new Date();
          resource.verified = true;
          survivors.push(resource);
          mutated = true;
          continue;
        }

        const replacement = await findReplacement(roadmap.topic, resource.title);
        if (replacement) {
          survivors.push({
            title: replacement.title,
            url: replacement.url,
            type: resource.type,
            lastVerifiedAt: new Date(),
            verified: true,
          });
          stats.resourcesReplaced++;
        } else {
          stats.resourcesDropped++;
          logger.warn(
            { url: resource.url, topic: roadmap.topic },
            "dead resource link dropped, no replacement found"
          );
        }
        mutated = true;
      }
      stage.freeResources = survivors;

      for (const cert of stage.certifications) {
        if (Date.now() - cert.lastVerifiedAt.getTime() < STALE_MS) continue;
        stats.resourcesChecked++;
        const check = await checkLinkAlive(cert.url);
        if (check.alive) {
          cert.lastVerifiedAt = new Date();
          mutated = true;
        }
        // Certifications are left in place even if dead-checked; a human
        // curator reviews cert swaps rather than auto-replacing paid offers.
      }
    }

    if (mutated) {
      await roadmap.save();
      await invalidateRoadmapCache(roadmap.slug);
      logger.info({ topic: roadmap.topic }, "freshness worker updated roadmap");
    }
  }

  return stats;
}

async function findReplacement(
  topic: string,
  originalTitle: string
): Promise<{ title: string; url: string } | null> {
  const results = await webSearch(`${topic} ${originalTitle} tutorial`, 3);
  const best = results[0];
  return best ? { title: best.title, url: best.url } : null;
}
