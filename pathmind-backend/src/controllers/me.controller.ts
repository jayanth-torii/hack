import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { User } from "../models/User";
import { UserProgress, backfillCompletedStages } from "../models/UserProgress";
import { Certificate } from "../models/Certificate";
import { Goal } from "../models/Goal";
import { ActivityEvent } from "../models/ActivityEvent";
import { Roadmap } from "../models/Roadmap";
import { comparePassword, hashPassword } from "../utils/bcrypt";
import {
  getActivityBuckets,
  getStreak,
  recordActivity,
  type ActivityRange,
} from "../services/activity.service";
import { evaluateAchievements, listAchievements } from "../services/achievement.service";
import { renderCertificatePdf } from "../services/certificate/certificatePdf";
import type {
  ChangePasswordInput,
  UpdateNotificationsInput,
  UpdateProfileInput,
  UpsertGoalInput,
} from "../schemas/profile.schema";

/** Trim, drop blanks, de-duplicate case-insensitively, preserve first spelling. */
function normaliseTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/**
 * GET /me/profile
 *
 * Everything the profile screen needs about the person, including the join
 * date that `/auth/me` deliberately keeps out of the auth payload.
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  // passwordHash is `select: false`; it has to be requested explicitly to tell
  // a password account from a Google-only one. It is never returned.
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.unauthorized("User not found");

  res.status(200).json({
    profile: {
      id: user._id.toString(),
      email: user.email,
      name: user.name ?? null,
      avatar: user.avatar ?? null,
      joinedAt: user.createdAt,
      education: user.education ?? null,
      skills: user.skills ?? [],
      interests: user.interests ?? [],
      notificationPrefs: user.notificationPrefs,
      // Tells the UI whether a password form makes sense at all: Google-only
      // accounts have nothing to change.
      hasPassword: Boolean(user.passwordHash),
      googleCalendarConnected: Boolean(user.googleCalendarToken),
    },
  });
});

/** PATCH /me/profile — partial update; omitted fields are left untouched. */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const body = req.body as UpdateProfileInput;

  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("User not found");

  if (body.name !== undefined) user.name = body.name;
  if (body.education !== undefined) user.education = body.education;
  if (body.skills !== undefined) user.skills = normaliseTags(body.skills);
  if (body.interests !== undefined) user.interests = normaliseTags(body.interests);

  await user.save();
  req.log?.info({ userId, fields: Object.keys(body) }, "Profile updated");

  res.status(200).json({
    profile: {
      name: user.name ?? null,
      education: user.education ?? null,
      skills: user.skills,
      interests: user.interests,
    },
  });
});

/** PATCH /me/notifications */
export const updateNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const body = req.body as UpdateNotificationsInput;

  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("User not found");

  user.notificationPrefs = { ...user.notificationPrefs, ...body };
  await user.save();

  res.status(200).json({ notificationPrefs: user.notificationPrefs });
});

/**
 * POST /auth/change-password
 *
 * Requires the current password even though the session is already
 * authenticated: a stolen session should not be enough to lock the real owner
 * out of their account.
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  // passwordHash is `select: false`, so it has to be asked for explicitly.
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.unauthorized("User not found");

  if (!user.passwordHash) {
    throw ApiError.badRequest(
      "This account signs in with Google and has no password to change."
    );
  }

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  if (await comparePassword(newPassword, user.passwordHash)) {
    throw ApiError.badRequest("New password must be different from the current one");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Never log the password itself, only that a change happened.
  req.log?.info({ userId }, "Password changed");
  res.status(200).json({ ok: true });
});

/**
 * GET /me/overview
 *
 * One aggregate call for the profile header and statistics panels. Doing this
 * server-side avoids the N+1 the client would otherwise need across every
 * saved roadmap just to show a completion percentage.
 */
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;

  const user = await User.findById(userId).select("savedRoadmaps favoriteRoadmaps createdAt");
  if (!user) throw ApiError.unauthorized("User not found");

  const [progressDocs, roadmaps, certificates, streak] = await Promise.all([
    UserProgress.find({ userId }),
    Roadmap.find({ _id: { $in: user.savedRoadmaps } }).select("topic stages"),
    Certificate.countDocuments({ userId }),
    getStreak(userId),
  ]);

  const stagesByRoadmap = new Map(roadmaps.map((r) => [r._id.toString(), r.stages.length]));
  const totalStages = roadmaps.reduce((sum, r) => sum + r.stages.length, 0);

  let completedStages = 0;
  let unlockedStages = 0;
  for (const p of progressDocs) {
    completedStages += p.completedStageIds.length;
    unlockedStages += p.unlockedStageIds.length;
  }

  const completedRoadmaps = progressDocs.filter((p) => {
    const total = stagesByRoadmap.get(p.roadmapId.toString());
    return total !== undefined && total > 0 && p.completedStageIds.length >= total;
  }).length;

  res.status(200).json({
    overview: {
      savedRoadmaps: user.savedRoadmaps.length,
      favoriteRoadmaps: user.favoriteRoadmaps?.length ?? 0,
      totalStages,
      completedStages,
      unlockedStages,
      completedRoadmaps,
      certificates,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      overallProgress:
        totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100),
      joinedAt: user.createdAt,
    },
  });
});

/**
 * GET /me/activity?range=week|month
 *
 * Returns both the chart buckets and the recent feed, because the profile
 * screen always renders them together.
 */
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const range = ((req.query.range as string) === "month" ? "month" : "week") as ActivityRange;

  const [buckets, feed] = await Promise.all([
    getActivityBuckets(userId, range),
    ActivityEvent.find({ userId }).sort({ createdAt: -1 }).limit(20),
  ]);

  res.status(200).json({
    range,
    buckets,
    feed: feed.map((e) => ({
      id: e._id.toString(),
      type: e.type,
      title: e.title ?? null,
      subtitle: e.subtitle ?? null,
      roadmapId: e.roadmapId?.toString() ?? null,
      createdAt: e.createdAt,
    })),
  });
});

/** GET /me/achievements — the full catalogue with this learner's unlock state. */
export const getAchievements = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  // Re-evaluate on read so a badge earned by an action that predates the rule
  // still shows up, rather than waiting for the next completion.
  await evaluateAchievements(userId);
  res.status(200).json({ achievements: await listAchievements(userId) });
});

/** GET /me/certificates */
export const getCertificates = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const certificates = await Certificate.find({ userId }).sort({ issuedAt: -1 });

  res.status(200).json({
    certificates: certificates.map((c) => ({
      id: c._id.toString(),
      roadmapId: c.roadmapId.toString(),
      topic: c.topic,
      recipientName: c.recipientName,
      stagesCompleted: c.stagesCompleted,
      serial: c.serial,
      issuedAt: c.issuedAt,
    })),
  });
});

/**
 * GET /me/certificates/:id/download
 *
 * Scoped by `userId` in the query itself, so one learner can never fetch
 * another's credential by guessing an id.
 */
export const downloadCertificate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid certificate id");

  const certificate = await Certificate.findOne({ _id: id, userId });
  if (!certificate) throw ApiError.notFound("Certificate not found");

  const pdf = renderCertificatePdf({
    recipientName: certificate.recipientName,
    topic: certificate.topic,
    stagesCompleted: certificate.stagesCompleted,
    issuedAt: certificate.issuedAt,
    serial: certificate.serial,
  });

  const safeTopic = certificate.topic.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="vidhyora-${safeTopic}-certificate.pdf"`
  );
  res.setHeader("Content-Length", pdf.length);
  res.status(200).end(pdf);
});

/** GET /me/goals */
export const getGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const goals = await Goal.find({ userId }).sort({ targetDate: 1 });

  res.status(200).json({
    goals: goals.map((g) => ({
      id: g._id.toString(),
      roadmapId: g.roadmapId.toString(),
      targetDate: g.targetDate,
      note: g.note ?? null,
      achievedAt: g.achievedAt ?? null,
    })),
  });
});

/** PUT /me/goals/:roadmapId — upsert, so re-setting a date edits in place. */
export const upsertGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { roadmapId } = req.params as { roadmapId: string };
  const { targetDate, note } = req.body as UpsertGoalInput;

  if (!Types.ObjectId.isValid(roadmapId)) throw ApiError.badRequest("Invalid roadmap id");

  const roadmap = await Roadmap.findById(roadmapId).select("topic");
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  // A target in the past is almost certainly a client bug or a typo; accepting
  // it would render as an already-missed deadline the moment it is saved.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (targetDate < endOfToday) {
    throw ApiError.badRequest("Pick a target date in the future");
  }

  const goal = await Goal.findOneAndUpdate(
    { userId, roadmapId },
    { $set: { targetDate, ...(note !== undefined ? { note } : {}) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recordActivity({
    userId,
    type: "goal_set",
    roadmapId,
    title: "Target date set",
    subtitle: roadmap.topic,
  });

  res.status(200).json({
    goal: {
      id: goal._id.toString(),
      roadmapId: goal.roadmapId.toString(),
      targetDate: goal.targetDate,
      note: goal.note ?? null,
      achievedAt: goal.achievedAt ?? null,
    },
  });
});

/** DELETE /me/goals/:roadmapId */
export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { roadmapId } = req.params as { roadmapId: string };

  if (!Types.ObjectId.isValid(roadmapId)) throw ApiError.badRequest("Invalid roadmap id");

  const result = await Goal.deleteOne({ userId, roadmapId });
  if (result.deletedCount === 0) throw ApiError.notFound("No goal set for this roadmap");

  res.status(200).json({ ok: true });
});

/**
 * GET /me/progress-summary
 *
 * Per-roadmap completion for the saved list, in one round trip. Without this
 * the library page would have to call `/roadmaps/:id/progress` once per card.
 */
export const getProgressSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;

  const user = await User.findById(userId).select("savedRoadmaps favoriteRoadmaps");
  if (!user) throw ApiError.unauthorized("User not found");

  const [roadmaps, progressDocs] = await Promise.all([
    Roadmap.find({ _id: { $in: user.savedRoadmaps } }).select("stages"),
    UserProgress.find({ userId }),
  ]);

  const progressByRoadmap = new Map(progressDocs.map((p) => [p.roadmapId.toString(), p]));
  const favorites = new Set((user.favoriteRoadmaps ?? []).map((id) => id.toString()));

  const summary = roadmaps.map((roadmap) => {
    const key = roadmap._id.toString();
    const progress = progressByRoadmap.get(key);
    const total = roadmap.stages.length;
    const completed = progress?.completedStageIds.length ?? 0;

    // Repair in memory only — this is a read endpoint and must not write.
    if (progress) backfillCompletedStages(progress);
    const lastActivityAt =
      progress?.completedStages.reduce<Date | null>(
        (latest, entry) =>
          latest === null || entry.completedAt > latest ? entry.completedAt : latest,
        null
      ) ?? null;

    return {
      roadmapId: key,
      totalStages: total,
      completedStages: completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      isComplete: total > 0 && completed >= total,
      isFavorite: favorites.has(key),
      lastActivityAt,
    };
  });

  res.status(200).json({ summary });
});
