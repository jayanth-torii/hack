import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { Roadmap } from "../models/Roadmap";
import { User } from "../models/User";
import {
  CATALOG_FILTER,
  listCatalog,
  listCategories,
  summariseDifficulty,
} from "../services/catalog.service";
import { buildCourse } from "../services/courseBuilder.service";
import { recordActivity } from "../services/activity.service";
import { evaluateAchievements } from "../services/achievement.service";
import type { BuildCourseBody, ListCatalogQuery } from "../schemas/catalog.schema";

/**
 * GET /courses — the browse page's only read.
 *
 * `optionalAuth`, not `requireAuth`: the catalog is public, and a signed-out
 * visitor should be able to see what the platform teaches before committing to
 * an account. Signing in only adds the per-card `saved` flag.
 */
export const getCatalog = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListCatalogQuery;
  const page = await listCatalog({
    q: query.q,
    category: query.category,
    level: query.level,
    maxDays: query.maxDays,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    userId: req.auth?.userId,
  });
  req.log?.info(
    { total: page.total, page: page.page, category: query.category ?? null },
    "Catalog listed"
  );
  res.status(200).json(page);
});

export const getCatalogCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  res.status(200).json({ categories });
});

/**
 * GET /courses/:idOrSlug — the full course, for the preview sheet and the
 * builder's stage picker.
 *
 * Restricted to published templates. A learner's own built course is reached
 * through `/roadmaps/:slug` with their session, not through the public
 * catalog, so this endpoint can never be used to read someone else's private
 * path by guessing an id.
 */
export const getCatalogCourse = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params as { idOrSlug: string };

  const course = await Roadmap.findOne({
    ...CATALOG_FILTER,
    ...(Types.ObjectId.isValid(idOrSlug)
      ? { _id: new Types.ObjectId(idOrSlug) }
      : { slug: idOrSlug }),
  });
  if (!course) throw ApiError.notFound("Course not found");

  let saved = false;
  if (req.auth?.userId) {
    const user = await User.findById(req.auth.userId).select("savedRoadmaps").lean();
    saved = (user?.savedRoadmaps ?? []).some((id) => id.toString() === course._id.toString());
  }

  const { level, difficulties } = summariseDifficulty(course.stages);
  res.status(200).json({
    course,
    meta: {
      saved,
      level,
      difficulties,
      totalDays: course.stages.reduce((n, s) => n + s.estimatedDays, 0),
    },
  });
});

/**
 * POST /courses/custom — build a course from catalog stages.
 *
 * The built roadmap is added to the learner's library in the same request.
 * Building a course you then have to go and find is a dead end, and the only
 * reason to build one is to start it.
 */
export const createCustomCourse = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { title, stages } = req.body as BuildCourseBody;

  const { roadmap } = await buildCourse({ title, selections: stages });

  await User.findByIdAndUpdate(userId, { $addToSet: { savedRoadmaps: roadmap._id } });
  await recordActivity({
    userId,
    type: "roadmap_saved",
    roadmapId: roadmap._id.toString(),
    title: "Course built",
    subtitle: roadmap.topic,
  });
  await evaluateAchievements(userId);

  req.log?.info(
    { userId, roadmapId: roadmap._id.toString(), stages: roadmap.stages.length },
    "Custom course built from catalog stages"
  );
  res.status(201).json({ roadmap });
});
