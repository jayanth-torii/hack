import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createCustomCourse,
  getCatalog,
  getCatalogCategories,
  getCatalogCourse,
} from "../controllers/catalog.controller";
import {
  buildCourseSchema,
  getCourseSchema,
  listCatalogSchema,
} from "../schemas/catalog.schema";

export const catalogRouter = Router();

/**
 * @openapi
 * /courses:
 *   get:
 *     summary: Browse the published course catalog
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: level
 *         schema: { type: string, enum: [beginner, intermediate, advanced] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [popular, newest, shortest, longest, alphabetical] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 48 }
 *     responses:
 *       200: { description: One page of course cards }
 */
catalogRouter.get("/", optionalAuth, validate(listCatalogSchema), getCatalog);

/**
 * @openapi
 * /courses/categories:
 *   get:
 *     summary: Catalog categories with course counts
 *     tags: [Catalog]
 *     responses:
 *       200: { description: Categories }
 */
catalogRouter.get("/categories", getCatalogCategories);

/**
 * @openapi
 * /courses/custom:
 *   post:
 *     summary: Build a personal course from stages picked out of the catalog
 *     tags: [Catalog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, stages]
 *             properties:
 *               title: { type: string, example: "My backend path" }
 *               stages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [courseId, stageId]
 *                   properties:
 *                     courseId: { type: string }
 *                     stageId: { type: string }
 *     responses:
 *       201: { description: The built roadmap, already saved to the library }
 *       400: { description: A selected stage is not in the published catalog }
 *       401: { description: Not authenticated }
 */
// Declared before `/:idOrSlug` so "custom" is never read as a slug.
catalogRouter.post("/custom", requireAuth, validate(buildCourseSchema), createCustomCourse);

/**
 * @openapi
 * /courses/{idOrSlug}:
 *   get:
 *     summary: One published course in full, with its stages
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course and derived metadata }
 *       404: { description: Not a published course }
 */
catalogRouter.get("/:idOrSlug", optionalAuth, validate(getCourseSchema), getCatalogCourse);
