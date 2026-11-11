import type { Request, Response } from "express";
import { Types, type FilterQuery } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { User, type UserDocument } from "../models/User";
import { Roadmap, type RoadmapDocument } from "../models/Roadmap";
import { UserProgress } from "../models/UserProgress";
import { Certificate } from "../models/Certificate";
import { ActivityEvent } from "../models/ActivityEvent";
import { Goal } from "../models/Goal";
import { AuditLog } from "../models/AuditLog";
import { getAdminStats } from "../services/admin/stats.service";
import { recordAudit } from "../services/admin/audit.service";
import { escapeRegex } from "../services/catalog.service";
import type {
  ListAdminRoadmapsQuery,
  ListAuditQuery,
  ListResourcesQuery,
  ListUsersQuery,
  UpdateRoadmapBody,
  UpdateUserBody,
} from "../schemas/admin.schema";

/** The verified actor, from `requireAdmin`'s live database check. */
function actor(req: Request): { userId: string; email: string } {
  if (!req.admin) throw ApiError.forbidden("Admin access required");
  return req.admin;
}

function paged<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await getAdminStats();
  req.log?.info({ adminId: actor(req).userId }, "Admin stats read");
  res.status(200).json({ stats });
});

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

const USER_SORTS: Record<ListUsersQuery["sort"], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  email: { email: 1 },
  active: { lastLoginAt: -1 },
};

/**
 * GET /admin/users
 *
 * The projection is explicit rather than a `-field` exclusion list. Both
 * `passwordHash` and `refreshTokenHash` are already `select: false` on the
 * model, but an admin list is exactly the endpoint where a future schema
 * addition must not be exposed by default — naming the fields means a new one
 * has to be opted in.
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListUsersQuery;

  const filter: FilterQuery<UserDocument> = {};
  if (q.role) filter.role = q.role;
  if (q.status) filter.suspended = q.status === "suspended";
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ email: rx }, { name: rx }];
  }

  const [rows, total] = await Promise.all([
    User.find(filter)
      .select("email name avatar role suspended suspendedReason savedRoadmaps createdAt lastLoginAt")
      .sort(USER_SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Completion counts for this page only — one query, not one per row.
  const ids = rows.map((r) => r._id);
  const completions = await ActivityEvent.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { userId: { $in: ids }, type: "stage_completed" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const completionMap = new Map(completions.map((c) => [c._id.toString(), c.count]));

  const items = rows.map((u) => ({
    id: u._id.toString(),
    email: u.email,
    name: u.name ?? null,
    avatar: u.avatar ?? null,
    role: u.role,
    suspended: Boolean(u.suspended),
    suspendedReason: u.suspendedReason ?? null,
    savedCount: u.savedRoadmaps?.length ?? 0,
    stagesCompleted: completionMap.get(u._id.toString()) ?? 0,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt ?? null,
  }));

  res.status(200).json(paged(items, total, q.page, q.limit));
});

/**
 * PATCH /admin/users/:id — change a role, suspend or restore an account.
 *
 * Two self-inflicted footguns are closed here. An admin cannot demote or
 * suspend **themselves**: it is almost always a misclick, and it can leave
 * nobody able to undo it. And the **last remaining admin** cannot be demoted
 * or suspended by anyone, which is the only way to lock the whole organisation
 * out of its own admin area.
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const me = actor(req);
  const { id } = req.params as { id: string };
  const body = req.body as UpdateUserBody;

  const target = await User.findById(id).select("email name role suspended suspendedReason");
  if (!target) throw ApiError.notFound("User not found");

  if (target._id.toString() === me.userId) {
    throw ApiError.badRequest(
      "You cannot change your own role or suspend your own account. Ask another admin."
    );
  }

  const losingAdmin =
    target.role === "admin" && (body.role === "user" || body.suspended === true);
  if (losingAdmin) {
    const remaining = await User.countDocuments({
      role: "admin",
      suspended: false,
      _id: { $ne: target._id },
    });
    if (remaining === 0) {
      throw ApiError.badRequest(
        "This is the last active admin. Promote another account before changing this one."
      );
    }
  }

  const before = { role: target.role, suspended: Boolean(target.suspended) };

  if (body.role !== undefined) target.role = body.role;
  if (body.suspended !== undefined) {
    target.suspended = body.suspended;
    target.suspendedReason = body.suspended ? body.suspendedReason : undefined;
    if (body.suspended) {
      // Suspension must end the session, not merely block the next login:
      // dropping the refresh hash means the live access token cannot be
      // renewed and the account is signed out within its 15-minute lifetime.
      target.refreshTokenHash = undefined;
    }
  }
  await target.save();

  if (body.role !== undefined && body.role !== before.role) {
    await recordAudit({
      actorId: me.userId,
      actorEmail: me.email,
      action: "user.role_changed",
      targetType: "user",
      targetId: target._id.toString(),
      targetLabel: target.email,
      meta: { from: before.role, to: body.role },
    });
  }
  if (body.suspended !== undefined && body.suspended !== before.suspended) {
    await recordAudit({
      actorId: me.userId,
      actorEmail: me.email,
      action: body.suspended ? "user.suspended" : "user.unsuspended",
      targetType: "user",
      targetId: target._id.toString(),
      targetLabel: target.email,
      ...(body.suspended && body.suspendedReason
        ? { meta: { reason: body.suspendedReason } }
        : {}),
    });
  }

  req.log?.info(
    { adminId: me.userId, targetId: target._id.toString(), before, after: { role: target.role, suspended: target.suspended } },
    "Admin updated a user"
  );

  res.status(200).json({
    user: {
      id: target._id.toString(),
      email: target.email,
      name: target.name ?? null,
      role: target.role,
      suspended: Boolean(target.suspended),
      suspendedReason: target.suspendedReason ?? null,
    },
  });
});

/**
 * DELETE /admin/users/:id
 *
 * Deletes the account **and everything keyed to it** — progress, goals,
 * certificates, activity. Leaving those behind would keep personal learning
 * history in the database under an id nothing can resolve any more, which is
 * both a privacy problem and a source of phantom numbers on this very
 * dashboard. Roadmaps the user generated are left alone: they are shared
 * templates other learners may have saved.
 *
 * The audit entry survives, by design — it is the only remaining record that
 * the account existed and who removed it.
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const me = actor(req);
  const { id } = req.params as { id: string };

  const target = await User.findById(id).select("email role suspended");
  if (!target) throw ApiError.notFound("User not found");
  if (target._id.toString() === me.userId) {
    throw ApiError.badRequest("You cannot delete your own account from the admin area.");
  }
  if (target.role === "admin") {
    const remaining = await User.countDocuments({
      role: "admin",
      suspended: false,
      _id: { $ne: target._id },
    });
    if (remaining === 0) {
      throw ApiError.badRequest("This is the last active admin and cannot be deleted.");
    }
  }

  const userId = target._id;
  const [progress, goals, certificates, activity] = await Promise.all([
    UserProgress.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    Certificate.deleteMany({ userId }),
    ActivityEvent.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });

  await recordAudit({
    actorId: me.userId,
    actorEmail: me.email,
    action: "user.deleted",
    targetType: "user",
    targetId: userId.toString(),
    targetLabel: target.email,
    meta: {
      progressRemoved: progress.deletedCount,
      goalsRemoved: goals.deletedCount,
      certificatesRemoved: certificates.deletedCount,
      activityRemoved: activity.deletedCount,
    },
  });

  req.log?.warn({ adminId: me.userId, targetId: userId.toString() }, "Admin deleted a user");
  res.status(200).json({ deleted: true, id: userId.toString() });
});

/* -------------------------------------------------------------------------- */
/* Roadmaps                                                                    */
/* -------------------------------------------------------------------------- */

const ROADMAP_SORTS: Record<Exclude<ListAdminRoadmapsQuery["sort"], "learners">, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  topic: { topic: 1 },
};

/**
 * GET /admin/roadmaps
 *
 * `sort=learners` cannot be a Mongo sort — the number lives in the users
 * collection — so that one case pages in memory. Every other sort pages in the
 * database.
 */
export const listRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListAdminRoadmapsQuery;

  const filter: FilterQuery<RoadmapDocument> = {};
  if (q.category) filter.category = q.category;
  if (q.visibility) filter.isPublicTemplate = q.visibility === "published";
  if (q.source === "curated") filter.sourceModel = "curated";
  else if (q.source === "custom") filter.sourceModel = "custom";
  else if (q.source === "generated") filter.sourceModel = { $nin: ["curated", "custom"] };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ topic: rx }, { slug: rx }, { category: rx }];
  }

  const projection = "topic slug category summary isPublicTemplate sourceModel createdAt updatedAt stages.title stages.difficulty stages.estimatedDays stages.freeResources.verified";

  const byLearners = q.sort === "learners";
  const [rows, total] = await Promise.all([
    byLearners
      ? Roadmap.find(filter).select(projection).lean()
      : Roadmap.find(filter)
          .select(projection)
          .sort(ROADMAP_SORTS[q.sort as keyof typeof ROADMAP_SORTS])
          .skip((q.page - 1) * q.limit)
          .limit(q.limit)
          .lean(),
    Roadmap.countDocuments(filter),
  ]);

  const ids = rows.map((r) => r._id);
  const counts = await User.aggregate<{ _id: Types.ObjectId; learners: number }>([
    { $unwind: "$savedRoadmaps" },
    { $match: { savedRoadmaps: { $in: ids } } },
    { $group: { _id: "$savedRoadmaps", learners: { $sum: 1 } } },
  ]);
  const learnerMap = new Map(counts.map((c) => [c._id.toString(), c.learners]));

  let items = rows.map((r) => {
    const stages = r.stages ?? [];
    return {
      id: r._id.toString(),
      topic: r.topic,
      slug: r.slug,
      category: r.category ?? null,
      summary: r.summary ?? null,
      published: Boolean(r.isPublicTemplate),
      sourceModel: r.sourceModel,
      stageCount: stages.length,
      totalDays: stages.reduce((n, s) => n + (s.estimatedDays ?? 0), 0),
      brokenResources: stages.reduce(
        (n, s) => n + (s.freeResources ?? []).filter((res) => res.verified === false).length,
        0
      ),
      learners: learnerMap.get(r._id.toString()) ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  if (byLearners) {
    items.sort((a, b) => b.learners - a.learners || a.topic.localeCompare(b.topic));
    items = items.slice((q.page - 1) * q.limit, (q.page - 1) * q.limit + q.limit);
  }

  res.status(200).json(paged(items, total, q.page, q.limit));
});

export const updateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const me = actor(req);
  const { id } = req.params as { id: string };
  const body = req.body as UpdateRoadmapBody;

  const roadmap = await Roadmap.findById(id).select("topic slug category summary isPublicTemplate");
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  const before = {
    published: Boolean(roadmap.isPublicTemplate),
    category: roadmap.category ?? null,
    summary: roadmap.summary ?? null,
  };

  if (body.isPublicTemplate !== undefined) roadmap.isPublicTemplate = body.isPublicTemplate;
  if (body.category !== undefined) roadmap.category = body.category;
  if (body.summary !== undefined) roadmap.summary = body.summary;
  await roadmap.save();

  // Publishing is called out separately from an edit: it is the change that
  // alters who can see the course, and it is the one worth finding in the log.
  const visibilityChanged =
    body.isPublicTemplate !== undefined && body.isPublicTemplate !== before.published;
  await recordAudit({
    actorId: me.userId,
    actorEmail: me.email,
    action: visibilityChanged
      ? body.isPublicTemplate
        ? "roadmap.published"
        : "roadmap.unpublished"
      : "roadmap.updated",
    targetType: "roadmap",
    targetId: roadmap._id.toString(),
    targetLabel: roadmap.topic,
    meta: { before, after: { ...before, ...body, published: roadmap.isPublicTemplate } },
  });

  req.log?.info({ adminId: me.userId, roadmapId: roadmap._id.toString() }, "Admin updated a roadmap");
  res.status(200).json({
    roadmap: {
      id: roadmap._id.toString(),
      topic: roadmap.topic,
      slug: roadmap.slug,
      category: roadmap.category ?? null,
      summary: roadmap.summary ?? null,
      published: Boolean(roadmap.isPublicTemplate),
    },
  });
});

/**
 * DELETE /admin/roadmaps/:id
 *
 * Refuses while any learner still has the course saved. Deleting it would
 * leave dangling ids in their libraries and silently destroy their progress on
 * it — unpublishing is the right tool for retiring a course, and the response
 * says so rather than offering a `force` flag that would do the damage anyway.
 */
export const deleteRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const me = actor(req);
  const { id } = req.params as { id: string };

  const roadmap = await Roadmap.findById(id).select("topic slug");
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  const learners = await User.countDocuments({ savedRoadmaps: roadmap._id });
  if (learners > 0) {
    throw ApiError.conflict(
      `${learners} learner${learners === 1 ? " has" : "s have"} this course saved. ` +
        "Unpublish it instead — deleting would erase their progress."
    );
  }

  await Promise.all([
    UserProgress.deleteMany({ roadmapId: roadmap._id }),
    Goal.deleteMany({ roadmapId: roadmap._id }),
  ]);
  await Roadmap.deleteOne({ _id: roadmap._id });

  await recordAudit({
    actorId: me.userId,
    actorEmail: me.email,
    action: "roadmap.deleted",
    targetType: "roadmap",
    targetId: roadmap._id.toString(),
    targetLabel: roadmap.topic,
    meta: { slug: roadmap.slug },
  });

  req.log?.warn({ adminId: me.userId, roadmapId: roadmap._id.toString() }, "Admin deleted a roadmap");
  res.status(200).json({ deleted: true, id: roadmap._id.toString() });
});

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /admin/resources — every free resource, flattened out of the stage
 * arrays, newest-failing first.
 *
 * `verified: false` is what the freshness worker writes when a link no longer
 * resolves to live content, so this list *is* the broken-link queue. It is
 * read-only on purpose: the fix for a dead link is a catalog edit and a
 * re-seed, not a field an admin pokes in production.
 */
export const listResources = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListResourcesQuery;

  const match: Record<string, unknown> = {};
  if (q.status === "unverified") match["stages.freeResources.verified"] = false;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    match.$or = [
      { "stages.freeResources.title": rx },
      { "stages.freeResources.url": rx },
      { topic: rx },
    ];
  }

  const pipeline = [
    { $unwind: "$stages" },
    { $unwind: "$stages.freeResources" },
    ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
    {
      $project: {
        _id: 0,
        roadmapId: { $toString: "$_id" },
        topic: 1,
        slug: 1,
        published: "$isPublicTemplate",
        stageTitle: "$stages.title",
        title: "$stages.freeResources.title",
        url: "$stages.freeResources.url",
        type: "$stages.freeResources.type",
        verified: "$stages.freeResources.verified",
        lastVerifiedAt: "$stages.freeResources.lastVerifiedAt",
      },
    },
    { $sort: { verified: 1, lastVerifiedAt: 1 } },
    {
      $facet: {
        items: [{ $skip: (q.page - 1) * q.limit }, { $limit: q.limit }],
        total: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Roadmap.aggregate(pipeline as never[]);
  const items = (result?.items ?? []) as unknown[];
  const total = (result?.total?.[0]?.count ?? 0) as number;

  res.status(200).json(paged(items, total, q.page, q.limit));
});

/* -------------------------------------------------------------------------- */
/* Audit log                                                                   */
/* -------------------------------------------------------------------------- */

export const listAudit = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListAuditQuery;

  const filter: Record<string, unknown> = {};
  if (q.action) filter.action = q.action;

  const [rows, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const items = rows.map((r) => ({
    id: r._id.toString(),
    actorEmail: r.actorEmail,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    targetLabel: r.targetLabel,
    meta: r.meta ?? null,
    createdAt: r.createdAt,
  }));

  res.status(200).json(paged(items, total, q.page, q.limit));
});

/* -------------------------------------------------------------------------- */
/* Platform activity                                                           */
/* -------------------------------------------------------------------------- */

/** GET /admin/activity — the platform-wide feed, with the actor's email resolved. */
export const listPlatformActivity = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListAuditQuery;

  const [rows, total] = await Promise.all([
    ActivityEvent.find({})
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate<{ userId: { email: string } | null }>("userId", "email")
      .lean(),
    ActivityEvent.estimatedDocumentCount(),
  ]);

  const items = rows.map((r) => ({
    id: r._id.toString(),
    type: r.type,
    title: r.title ?? null,
    subtitle: r.subtitle ?? null,
    // The populate resolves to null once the account has been deleted; the
    // event itself is kept so the platform's history stays continuous.
    actorEmail: (r.userId as unknown as { email?: string } | null)?.email ?? "deleted account",
    createdAt: r.createdAt,
  }));

  res.status(200).json(paged(items, total, q.page, q.limit));
});
