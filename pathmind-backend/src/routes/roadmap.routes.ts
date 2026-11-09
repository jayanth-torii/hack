import { Router } from "express";
import {
  generateRoadmap,
  getRoadmap,
  getSavedRoadmaps,
  saveRoadmap,
  unsaveRoadmap,
  toggleFavorite,
  createCertificate,
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

/**
 * @openapi
 * /roadmaps/{id}/save:
 *   delete:
 *     summary: Remove a roadmap from the library (progress is retained)
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Removed }
 *       401: { description: Not authenticated }
 */
roadmapRouter.delete("/:id/save", requireAuth, validate(saveRoadmapParamsSchema), unsaveRoadmap);

/**
 * @openapi
 * /roadmaps/{id}/favorite:
 *   put:
 *     summary: Toggle the favourite star (also saves the roadmap if it was not saved)
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: New favourite state }
 */
roadmapRouter.put("/:id/favorite", requireAuth, validate(saveRoadmapParamsSchema), toggleFavorite);

/**
 * @openapi
 * /roadmaps/{id}/certificate:
 *   post:
 *     summary: Issue the completion certificate (server verifies every stage is complete)
 *     tags: [Roadmaps]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Certificate issued }
 *       200: { description: Certificate already issued }
 *       400: { description: Roadmap not finished }
 */
roadmapRouter.post("/:id/certificate", requireAuth, validate(saveRoadmapParamsSchema), createCertificate);
