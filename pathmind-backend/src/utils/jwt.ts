import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthPayload } from "../types/express";

// jsonwebtoken's `expiresIn` type only accepts its own branded string literal
// (via the `ms` package) or a number of seconds, not a generic `string` — the
// env value is validated at boot by envSchema, so this cast is safe.
type ExpiresIn = number | `${number}${"s" | "m" | "h" | "d"}`;

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as ExpiresIn,
  });
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as ExpiresIn,
  });
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
}
