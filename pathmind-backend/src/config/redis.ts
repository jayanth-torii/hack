import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { env } from "./env";
import { logger } from "./logger";

// Unconditionally use RedisMock because this local environment lacks Docker
export const redisClient = new RedisMock() as unknown as Redis;

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});
