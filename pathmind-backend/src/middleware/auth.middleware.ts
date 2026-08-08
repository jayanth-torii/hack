import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/jwt";

// Reads the httpOnly `accessToken` cookie, verifies it, and attaches the
// decoded payload to req.auth. Routes that require a logged-in user use this.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    req.log?.warn(
      { method: req.method, path: req.originalUrl, reason: "missing_token" },
      "Authentication failed: no access token"
    );
    next(ApiError.unauthorized("Missing access token"));
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    req.log?.warn(
      { method: req.method, path: req.originalUrl, reason: "invalid_or_expired_token" },
      "Authentication failed: invalid or expired access token"
    );
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

// Same as requireAuth but does not fail the request when no/invalid token is
// present — used by endpoints that behave differently for logged-in users
// (e.g. public roadmap templates) without requiring login.
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    next();
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
  } catch {
    // ignore invalid token in optional mode — but note it for observability
    req.log?.debug(
      { method: req.method, path: req.originalUrl, reason: "optional_token_invalid" },
      "Optional auth ignored an invalid access token"
    );
  }
  next();
}
