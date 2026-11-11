import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  deleteRoadmap,
  deleteUser,
  getStats,
  listAudit,
  listPlatformActivity,
  listResources,
  listRoadmaps,
  listUsers,
  updateRoadmap,
  updateUser,
} from "../controllers/admin.controller";
import {
  listAdminRoadmapsSchema,
  listAuditSchema,
  listResourcesSchema,
  listUsersSchema,
  roadmapIdSchema,
  updateRoadmapSchema,
  updateUserSchema,
  userIdSchema,
} from "../schemas/admin.schema";

export const adminRouter = Router();

// Both guards, in this order, on every route below: `requireAuth` establishes
// who the caller is from the cookie, `requireAdmin` re-reads their role from
// the database. Mounted on the router rather than per-route so a new endpoint
// added here cannot be left unguarded by omission.
adminRouter.use(requireAuth, requireAdmin);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Platform overview — users, courses, learning and resource health
 *     tags: [Admin]
 *     responses:
 *       200: { description: Stats }
 *       403: { description: Admin access required }
 */
adminRouter.get("/stats", getStats);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Search, filter and page the user directory
 *     tags: [Admin]
 *     responses:
 *       200: { description: One page of users }
 */
adminRouter.get("/users", validate(listUsersSchema), listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   patch:
 *     summary: Change a user's role, or suspend/restore the account
 *     tags: [Admin]
 *     responses:
 *       200: { description: Updated user }
 *       400: { description: Refused — self-change, or the last active admin }
 *   delete:
 *     summary: Delete the account and all of its learning data
 *     tags: [Admin]
 *     responses:
 *       200: { description: Deleted }
 */
adminRouter.patch("/users/:id", validate(updateUserSchema), updateUser);
adminRouter.delete("/users/:id", validate(userIdSchema), deleteUser);

/**
 * @openapi
 * /admin/roadmaps:
 *   get:
 *     summary: Every roadmap — curated, generated and learner-built
 *     tags: [Admin]
 *     responses:
 *       200: { description: One page of roadmaps }
 */
adminRouter.get("/roadmaps", validate(listAdminRoadmapsSchema), listRoadmaps);

/**
 * @openapi
 * /admin/roadmaps/{id}:
 *   patch:
 *     summary: Publish/unpublish a course, or edit its category and summary
 *     tags: [Admin]
 *     responses:
 *       200: { description: Updated roadmap }
 *   delete:
 *     summary: Delete a roadmap no learner has saved
 *     tags: [Admin]
 *     responses:
 *       200: { description: Deleted }
 *       409: { description: Refused — learners still have it saved }
 */
adminRouter.patch("/roadmaps/:id", validate(updateRoadmapSchema), updateRoadmap);
adminRouter.delete("/roadmaps/:id", validate(roadmapIdSchema), deleteRoadmap);

/**
 * @openapi
 * /admin/resources:
 *   get:
 *     summary: Free resources across every course, failing links first
 *     tags: [Admin]
 *     responses:
 *       200: { description: One page of resources }
 */
adminRouter.get("/resources", validate(listResourcesSchema), listResources);

/**
 * @openapi
 * /admin/audit:
 *   get:
 *     summary: Append-only log of every admin action
 *     tags: [Admin]
 *     responses:
 *       200: { description: One page of audit entries }
 */
adminRouter.get("/audit", validate(listAuditSchema), listAudit);

/**
 * @openapi
 * /admin/activity:
 *   get:
 *     summary: Platform-wide learner activity feed
 *     tags: [Admin]
 *     responses:
 *       200: { description: One page of activity }
 */
adminRouter.get("/activity", validate(listAuditSchema), listPlatformActivity);
