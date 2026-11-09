import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  activityRangeSchema,
  updateNotificationsSchema,
  updateProfileSchema,
  upsertGoalSchema,
} from "../schemas/profile.schema";
import {
  deleteGoal,
  downloadCertificate,
  getAchievements,
  getActivity,
  getCertificates,
  getGoals,
  getOverview,
  getProfile,
  getProgressSummary,
  updateNotifications,
  updateProfile,
  upsertGoal,
} from "../controllers/me.controller";

export const meRouter = Router();

// Everything under /me is the authenticated learner's own data; there is no
// path here that can address another user, by id or otherwise.
meRouter.use(requireAuth);

/**
 * @openapi
 * /me/profile:
 *   get:
 *     summary: Personal details, education, skills, interests and notification preferences
 *     tags: [Me]
 *     responses:
 *       200: { description: Profile }
 *       401: { description: Not authenticated }
 *   patch:
 *     summary: Update name, education, skills or interests (partial)
 *     tags: [Me]
 *     responses:
 *       200: { description: Updated profile fields }
 *       400: { description: Validation failed }
 */
meRouter.get("/profile", getProfile);
meRouter.patch("/profile", validate(updateProfileSchema), updateProfile);

/**
 * @openapi
 * /me/notifications:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [Me]
 *     responses:
 *       200: { description: Updated preferences }
 */
meRouter.patch("/notifications", validate(updateNotificationsSchema), updateNotifications);

/**
 * @openapi
 * /me/overview:
 *   get:
 *     summary: Aggregate learning stats — saved roadmaps, stage counts, streak, overall progress
 *     tags: [Me]
 *     responses:
 *       200: { description: Overview }
 */
meRouter.get("/overview", getOverview);

/**
 * @openapi
 * /me/activity:
 *   get:
 *     summary: Daily completion buckets plus the recent activity feed
 *     tags: [Me]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [week, month] }
 *     responses:
 *       200: { description: Buckets and feed }
 */
meRouter.get("/activity", validate(activityRangeSchema), getActivity);

/**
 * @openapi
 * /me/achievements:
 *   get:
 *     summary: Achievement catalogue with this learner's unlock state
 *     tags: [Me]
 *     responses:
 *       200: { description: Achievements }
 */
meRouter.get("/achievements", getAchievements);

/**
 * @openapi
 * /me/certificates:
 *   get:
 *     summary: Certificates this learner has earned
 *     tags: [Me]
 *     responses:
 *       200: { description: Certificates }
 */
meRouter.get("/certificates", getCertificates);

/**
 * @openapi
 * /me/certificates/{id}/download:
 *   get:
 *     summary: Download a certificate as a PDF
 *     tags: [Me]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: application/pdf }
 *       404: { description: Not found, or not this learner's certificate }
 */
meRouter.get("/certificates/:id/download", downloadCertificate);

/**
 * @openapi
 * /me/goals:
 *   get:
 *     summary: Target completion dates the learner has set
 *     tags: [Me]
 *     responses:
 *       200: { description: Goals }
 */
meRouter.get("/goals", getGoals);

/**
 * @openapi
 * /me/goals/{roadmapId}:
 *   put:
 *     summary: Set or update the target completion date for a roadmap
 *     tags: [Me]
 *     responses:
 *       200: { description: Goal }
 *       400: { description: Target date must be in the future }
 *   delete:
 *     summary: Remove the target date for a roadmap
 *     tags: [Me]
 *     responses:
 *       200: { description: Removed }
 *       404: { description: No goal set }
 */
meRouter.put("/goals/:roadmapId", validate(upsertGoalSchema), upsertGoal);
meRouter.delete("/goals/:roadmapId", deleteGoal);

/**
 * @openapi
 * /me/progress-summary:
 *   get:
 *     summary: Per-roadmap completion for the saved library, in one request
 *     tags: [Me]
 *     responses:
 *       200: { description: Summary per saved roadmap }
 */
meRouter.get("/progress-summary", getProgressSummary);
