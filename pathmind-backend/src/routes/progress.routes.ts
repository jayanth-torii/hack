import { Router } from "express";
import { getProgress, updateProgress } from "../controllers/progress.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateProgressParamsSchema } from "../schemas/progress.schema";
import { z } from "zod";

export const progressRouter = Router();

const roadmapIdParamsSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

/**
 * @openapi
 * /roadmaps/{id}/progress:
 *   get:
 *     summary: Get the current user's progress on a roadmap (creates it, unlocking stage 1, on first access)
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Progress state }
 *       401: { description: Not authenticated }
 */
progressRouter.get("/:id/progress", requireAuth, validate(roadmapIdParamsSchema), getProgress);

/**
 * @openapi
 * /roadmaps/{id}/progress/{stageId}:
 *   patch:
 *     summary: Mark a stage complete; server recomputes and returns unlocked stages
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: stageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated progress }
 *       400: { description: Stage not yet unlocked }
 *       401: { description: Not authenticated }
 *       404: { description: Roadmap or stage not found }
 */
progressRouter.patch(
  "/:id/progress/:stageId",
  requireAuth,
  validate(updateProgressParamsSchema),
  updateProgress
);
