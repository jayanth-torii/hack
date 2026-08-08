import { Router } from "express";
import {
  generateRoadmap,
  getRoadmap,
  getSavedRoadmaps,
  saveRoadmap,
} from "../controllers/roadmap.controller";
import { generateLimiter } from "../config/rateLimits";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  generateRoadmapSchema,
  getRoadmapParamsSchema,
  saveRoadmapParamsSchema,
} from "../schemas/roadmap.schema";

export const roadmapRouter = Router();

/**
 * @openapi
 * /roadmaps/generate:
 *   post:
 *     summary: Generate (or fetch a cached template for) a topic's roadmap
 *     tags: [Roadmaps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic]
 *             properties:
 *               topic: { type: string, example: "Dynamic Programming" }
 *     responses:
 *       200: { description: Roadmap (from cache or freshly generated) }
 *       429: { description: Rate limit exceeded }
 */
roadmapRouter.post(
  "/generate",
  generateLimiter,
  validate(generateRoadmapSchema),
  generateRoadmap
);

/**
 * @openapi
 * /roadmaps/saved:
 *   get:
 *     summary: List the current user's saved roadmaps
 *     tags: [Roadmaps]
 *     responses:
 *       200: { description: Saved roadmaps }
 *       401: { description: Not authenticated }
 */
roadmapRouter.get("/saved", requireAuth, getSavedRoadmaps);

/**
 * @openapi
 * /roadmaps/{slug}:
 *   get:
 *     summary: Get a roadmap template by slug
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Roadmap found }
 *       404: { description: Roadmap not found }
 */
roadmapRouter.get("/:slug", validate(getRoadmapParamsSchema), getRoadmap);

/**
 * @openapi
 * /roadmaps/{id}/save:
 *   post:
 *     summary: Save a roadmap template to the current user's saved list
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Saved }
 *       401: { description: Not authenticated }
 *       404: { description: Roadmap not found }
 */
roadmapRouter.post("/:id/save", requireAuth, validate(saveRoadmapParamsSchema), saveRoadmap);
