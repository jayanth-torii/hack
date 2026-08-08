import { redisClient } from "../../config/redis";
import { logger } from "../../config/logger";
import { ROADMAP_CACHE_TTL_SECONDS, roadmapTemplateKey, roadmapTopicKey } from "./cacheKeys";
import type { RoadmapDocument } from "../../models/Roadmap";

/**
 * Thin wrapper around Redis for the roadmap-template cache described in the
 * spec: `roadmap:template:{slug}` holds the full serialized roadmap,
 * `roadmap:topic:{normalizedTopic}` is a pointer so /roadmaps/generate can
 * check "does this topic already have a template?" before it knows the slug.
 * Both TTL at 7 days. All calls are best-effort — a Redis outage degrades to
 * "always hit Mongo/AI", it never fails the request.
 */
export async function getCachedRoadmapByTopic(
  normalizedTopic: string
): Promise<RoadmapDocument | null> {
  try {
    const slug = await redisClient.get(roadmapTopicKey(normalizedTopic));
    if (!slug) return null;
    return getCachedRoadmapBySlug(slug);
  } catch (err) {
    logger.warn({ err }, "cache read (topic) failed, falling back to DB");
    return null;
  }
}

export async function getCachedRoadmapBySlug(slug: string): Promise<RoadmapDocument | null> {
  try {
    const raw = await redisClient.get(roadmapTemplateKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as RoadmapDocument;
  } catch (err) {
    logger.warn({ err }, "cache read (slug) failed, falling back to DB");
    return null;
  }
}

export async function cacheRoadmap(roadmap: RoadmapDocument): Promise<void> {
  try {
    const raw = JSON.stringify(roadmap);
    await redisClient.set(roadmapTemplateKey(roadmap.slug), raw, "EX", ROADMAP_CACHE_TTL_SECONDS);
    await redisClient.set(
      roadmapTopicKey(roadmap.normalizedTopic),
      roadmap.slug,
      "EX",
      ROADMAP_CACHE_TTL_SECONDS
    );
  } catch (err) {
    logger.warn({ err }, "cache write failed");
  }
}

// Called by the freshness worker after it mutates a shared template document,
// so the next read repopulates the cache with fresh data instead of serving
// stale `lastVerifiedAt` timestamps for up to 7 days.
export async function invalidateRoadmapCache(slug: string): Promise<void> {
  try {
    await redisClient.del(roadmapTemplateKey(slug));
  } catch (err) {
    logger.warn({ err }, "cache invalidation failed");
  }
}
