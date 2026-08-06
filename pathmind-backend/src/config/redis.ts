import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

// A single shared ioredis client. In tests this module is swapped for
// tests/mocks/ioredisMock via jest.mock, so no real connection is attempted.
export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: env.NODE_ENV === "test",
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});
