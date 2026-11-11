import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "must be a 24-character id");

const pagination = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listUsersSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    role: z.enum(["user", "admin"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
    sort: z.enum(["newest", "oldest", "email", "active"]).default("newest"),
    ...pagination,
  }),
});
export type ListUsersQuery = z.infer<typeof listUsersSchema>["query"];

/**
 * At least one field must be present. Without the refine, `PATCH {}` would
 * return 200 having changed nothing, which reads to the caller as success.
 */
export const updateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      role: z.enum(["user", "admin"]).optional(),
      suspended: z.boolean().optional(),
      suspendedReason: z.string().trim().max(200).optional(),
    })
    .refine(
      (b) => b.role !== undefined || b.suspended !== undefined,
      "Nothing to update — send a role or a suspended flag"
    ),
});
export type UpdateUserBody = z.infer<typeof updateUserSchema>["body"];

export const userIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listAdminRoadmapsSchema = z.object({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    category: z.string().trim().max(60).optional(),
    source: z.enum(["curated", "generated", "custom"]).optional(),
    visibility: z.enum(["published", "hidden"]).optional(),
    sort: z.enum(["newest", "oldest", "topic", "learners"]).default("newest"),
    ...pagination,
  }),
});
export type ListAdminRoadmapsQuery = z.infer<typeof listAdminRoadmapsSchema>["query"];

export const updateRoadmapSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      isPublicTemplate: z.boolean().optional(),
      category: z.string().trim().min(1).max(60).optional(),
      summary: z.string().trim().min(1).max(400).optional(),
    })
    .refine(
      (b) => Object.keys(b).length > 0,
      "Nothing to update — send a visibility, category or summary"
    ),
});
export type UpdateRoadmapBody = z.infer<typeof updateRoadmapSchema>["body"];

export const roadmapIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listResourcesSchema = z.object({
  query: z.object({
    status: z.enum(["all", "unverified"]).default("unverified"),
    q: z.string().trim().max(120).optional(),
    ...pagination,
  }),
});
export type ListResourcesQuery = z.infer<typeof listResourcesSchema>["query"];

export const listAuditSchema = z.object({
  query: z.object({
    action: z.string().trim().max(60).optional(),
    ...pagination,
  }),
});
export type ListAuditQuery = z.infer<typeof listAuditSchema>["query"];
