import pino from "pino";
import { env } from "./env";

// Never write secrets to logs. Pino redacts matching paths (including the
// pino-http req/res serializers) so a stray object containing credentials
// can't leak into stdout/JSON output.
const REDACT_PATHS = [
  "password",
  "*.password",
  "passwordHash",
  "*.passwordHash",
  "accessToken",
  "*.accessToken",
  "refreshToken",
  "*.refreshToken",
  "refreshTokenHash",
  "*.refreshTokenHash",
  "token",
  "*.token",
  "googleCalendarToken",
  "*.googleCalendarToken",
  "client_secret",
  "*.client_secret",
  "clientSecret",
  "*.clientSecret",
  "secret",
  "*.secret",
  // Headers that pino-http would otherwise serialize on error responses.
  // (pino-redact supports dot paths + * wildcards only — no bracket syntax.)
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers.set-cookie",
];

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
});
