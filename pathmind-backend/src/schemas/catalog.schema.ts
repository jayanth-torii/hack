import { z } from "zod";
import { MAX_BUILDER_STAGES } from "../services/courseBuilder.service";

/** Mongo ObjectId as it arrives on the wire. */
const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "must be a 24-character id");

/**
 * `?page=2` arrives as a string, so every numeric query param is coerced.
 * `limit` is capped server-side: the page size is a client hint, never a lever
 * a caller can use to pull the whole catalog in one request.
 */
const pagination = {
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
};

export const listCatalogSchema = z.object({
  query: z.object({
    q: z.string().trim().max(80).optional(),
    category: z.string().trim().max(60).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    maxDays: z.coerce.number().int().min(1).max(730).optional(),
    sort: z.enum(["popular", "newest", "shortest", "longest", "alphabetical"]).default("popular"),
    ...pagination,
  }),
});
export type ListCatalogQuery = z.infer<typeof listCatalogSchema>["query"];

export const getCourseSchema = z.object({
  params: z.object({ idOrSlug: z.string().trim().min(1).max(140) }),
});

export const buildCourseSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Give your course a name of at least 3 characters")
      .max(80, "Keep the name under 80 characters"),
    stages: z
      .array(z.object({ courseId: objectId, stageId: objectId }))
      .min(1, "Pick at least one stage")
      .max(MAX_BUILDER_STAGES, `A built course can hold at most ${MAX_BUILDER_STAGES} stages`),
  }),
});
export type BuildCourseBody = z.infer<typeof buildCourseSchema>["body"];
