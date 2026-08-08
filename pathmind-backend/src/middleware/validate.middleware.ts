import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "@/utils/apiError";

// Validates { body, params, query } against a Zod schema and replaces the
// request's fields with the parsed (and coerced/defaulted) values so
// downstream handlers get fully-typed, sanitized input.
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      // Log the field errors (not the raw body — it may contain secrets)
      // so malformed client traffic is visible in one line.
      req.log?.warn(
        {
          method: req.method,
          path: req.originalUrl,
          issues: result.error.flatten().fieldErrors,
        },
        "Request validation failed"
      );
      next(ApiError.unprocessable("Validation failed", result.error.flatten()));
      return;
    }

    const parsed = result.data as { body?: unknown; params?: unknown; query?: unknown };
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
    if (parsed.query !== undefined) req.query = parsed.query as typeof req.query;
    next();
  };
}
