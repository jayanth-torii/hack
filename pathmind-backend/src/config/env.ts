import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),

  MOCK_MODE: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  MONGO_URI: z.string().default("mongodb://localhost:27017/pathmind"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z.string().default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  AI_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),
  OPENAI_API_KEY: z.string().optional().default(""),

  SEARCH_PROVIDER: z.string().default("tavily"),
  SEARCH_API_KEY: z.string().optional().default(""),

  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALENDAR_REDIRECT_URI: z
    .string()
    .default("http://localhost:4000/auth/google/callback"),

  GENERATE_RATE_LIMIT_MAX: z.coerce.number().default(5),
  GENERATE_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(3_600_000),

  FRESHNESS_CRON_SCHEDULE: z.string().default("0 3 * * *"),
  FRESHNESS_STALE_DAYS: z.coerce.number().default(7),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
