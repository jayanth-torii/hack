import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/apiError";

/**
 * Authorizes an admin-only route.
 *
 * The role is read from the **database**, not from the JWT, on every request.
 * The token carries a `role` claim for convenience, but it is minted at login
 * and lives for 15 minutes: authorizing on it would leave a demoted or
 * suspended admin holding full powers for that window. Admin traffic is a
 * rounding error next to the learner routes, so the extra lookup costs
 * nothing worth saving here.
 *
 * Runs after `requireAuth`, which has already established *who* the caller is.
 */
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      next(ApiError.unauthorized("Not authenticated"));
      return;
    }

    const user = await User.findById(userId).select("email role suspended");
    if (!user || user.suspended || user.role !== "admin") {
      // Deliberately the same 403 for "not an admin" and "no such account":
      // the response must not confirm whether an admin area exists for a
      // given id. The reason is logged instead.
      req.log?.warn(
        {
          userId,
          reason: !user ? "unknown_user" : user.suspended ? "suspended" : "not_admin",
          method: req.method,
          path: req.originalUrl,
        },
        "Admin authorization refused"
      );
      next(ApiError.forbidden("Admin access required"));
      return;
    }

    // Hand the verified identity downstream so the audit log records the
    // actor's real, current email rather than a stale token claim.
    req.admin = { userId: user._id.toString(), email: user.email };
    next();
  } catch (err) {
    next(err);
  }
};
