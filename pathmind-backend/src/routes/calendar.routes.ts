import { Router } from "express";
import { exportCalendar, googleCallback, googleConnect } from "@/controllers/calendar.controller";
import { optionalAuth, requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { exportCalendarSchema } from "@/schemas/calendar.schema";

export const calendarRouter = Router();

/**
 * @openapi
 * /roadmaps/{id}/export-calendar:
 *   post:
 *     summary: Export the roadmap's suggested timeline to a calendar
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format: { type: string, enum: [google, ics], default: ics }
 *               startDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: "google: JSON batch-insert result. ics: text/calendar file download." }
 *       401: { description: Login required for format=google }
 *       404: { description: Roadmap not found }
 *       409: { description: Google Calendar not connected/configured }
 */
calendarRouter.post(
  "/:id/export-calendar",
  optionalAuth,
  validate(exportCalendarSchema),
  exportCalendar
);

/**
 * @openapi
 * /auth/google/connect:
 *   get:
 *     summary: Redirect to Google's OAuth consent screen to link Calendar access
 *     tags: [Calendar]
 *     responses:
 *       302: { description: Redirect to Google }
 *       401: { description: Not authenticated }
 *       409: { description: Google OAuth not configured on this server }
 */
export const googleAuthRouter = Router();
googleAuthRouter.get("/connect", requireAuth, googleConnect);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: OAuth redirect target — exchanges code for tokens and stores them on the user
 *     tags: [Calendar]
 *     responses:
 *       302: { description: Redirect back to the frontend }
 */
googleAuthRouter.get("/callback", googleCallback);
