import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/config/logger";

// Builds the standard request-context object attached to every error log so
// a failing request can be correlated with its pino-http access log (req.id)
// and traced back to a user and route.
function requestContext(req: Request) {
  return {
    reqId: req.id,
    method: req.method,
    path: req.originalUrl,
    userId: req.auth?.userId,
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(
    { ...requestContext(req) },
    "Route not found"
  );
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const context = requestContext(req);

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      // Server-side failures — full detail, including the error stack.
      logger.error({ err, ...context }, err.message);
    } else {
      // Client errors (4xx) are expected outcomes — log the message and
      // status at warn (no stack) so we can spot abusive/mistaken traffic
      // without the noise of a stack trace for every 401/404/422.
      logger.warn(
        { statusCode: err.statusCode, message: err.message, ...context },
        "Request failed (client error)"
      );
    }
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err, ...context }, message);
  res.status(500).json({ error: "Internal server error" });
}
