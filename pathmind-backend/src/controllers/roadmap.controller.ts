import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { generateOrGetRoadmap, getRoadmapBySlug, getRoadmapById } from "../services/roadmap.service";
import { User } from "../models/User";
import { Roadmap } from "../models/Roadmap";
import type { GenerateRoadmapInput, SubmitQuizBody } from "../schemas/roadmap.schema";
import { recordActivity } from "../services/activity.service";
import { evaluateAchievements } from "../services/achievement.service";
import { issueCertificate } from "../services/certificate/certificate.service";
import { UserProgress } from "../models/UserProgress";
import {
  buildQuiz,
  canQuiz,
  newSeed,
  publicQuestions,
  scoreQuiz,
  PASS_MARK,
} from "../services/quiz/quiz.service";

export const generateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { topic } = req.body as GenerateRoadmapInput;
  const startedAt = Date.now();
  const roadmap = await generateOrGetRoadmap(topic);
  req.log?.info(
    { topic, roadmapId: roadmap._id.toString(), durationMs: Date.now() - startedAt },
    "Roadmap generated or returned from cache"
  );
  if (req.auth?.userId) {
    // Generating a roadmap IS the decision to keep it. Previously this only
    // wrote an activity event, so a learner waited out the generation, landed
    // on the roadmap, and then found nothing in their library — the roadmap
    // survived only as a URL they had no reason to have kept. Nothing in the
    // interface offered to save it either, so "it never saves" was literally
    // true. $addToSet makes a repeat generation of the same topic a no-op.
    await User.findByIdAndUpdate(req.auth.userId, {
      $addToSet: { savedRoadmaps: roadmap._id },
    });
    await recordActivity({
      userId: req.auth.userId,
      type: "roadmap_generated",
      roadmapId: roadmap._id.toString(),
      title: "Roadmap generated",
      subtitle: roadmap.topic,
    });
  }
  res.status(200).json({ roadmap });
});


export const getRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  let roadmap;
  if (Types.ObjectId.isValid(slug)) {
    roadmap = await getRoadmapById(slug);
  }
  if (!roadmap) {
    roadmap = await getRoadmapBySlug(slug);
  }
  if (!roadmap) throw ApiError.notFound("Roadmap not found");
  req.log?.info({ slug, roadmapId: roadmap._id.toString() }, "Roadmap fetched");
  res.status(200).json({ roadmap });
});

export const getSavedRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const user = await User.findById(userId).populate("savedRoadmaps");
  if (!user) throw ApiError.notFound("User not found");
  req.log?.info({ userId, count: user.savedRoadmaps?.length ?? 0 }, "Saved roadmaps fetched");
  res.status(200).json({ roadmaps: user.savedRoadmaps });
});

export const saveRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  // $addToSet is idempotent, so only log activity when the save is genuinely
  // new — otherwise re-opening a saved roadmap would spam the feed.
  const before = await User.findById(userId).select("savedRoadmaps");
  const alreadySaved = (before?.savedRoadmaps ?? []).some((rid) => rid.equals(roadmap._id));

  await User.findByIdAndUpdate(userId, { $addToSet: { savedRoadmaps: roadmap._id } });
  req.log?.info({ userId, roadmapId: roadmap._id.toString() }, "Roadmap saved to user profile");

  if (!alreadySaved) {
    await recordActivity({
      userId,
      type: "roadmap_saved",
      roadmapId: roadmap._id.toString(),
      title: "Roadmap saved",
      subtitle: roadmap.topic,
    });
    await evaluateAchievements(userId);
  }

  res.status(200).json({ saved: true, roadmapId: roadmap._id.toString() });
});

/**
 * DELETE /roadmaps/:id/save
 *
 * Removes the roadmap from the library. Progress is intentionally left
 * untouched: re-saving later should restore the learner's place rather than
 * silently wipe weeks of work.
 */
export const unsaveRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid roadmap id");

  await User.findByIdAndUpdate(userId, {
    $pull: { savedRoadmaps: new Types.ObjectId(id), favoriteRoadmaps: new Types.ObjectId(id) },
  });
  req.log?.info({ userId, roadmapId: id }, "Roadmap removed from user profile");
  res.status(200).json({ saved: false, roadmapId: id });
});

/**
 * PUT /roadmaps/:id/favorite
 *
 * Toggles the star. Favouriting implies saving, so an unsaved roadmap is added
 * to the library at the same time rather than becoming a favourite the library
 * cannot show.
 */
export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid roadmap id");

  const user = await User.findById(userId).select("savedRoadmaps favoriteRoadmaps");
  if (!user) throw ApiError.unauthorized("User not found");

  const roadmapId = new Types.ObjectId(id);
  const isFavorite = (user.favoriteRoadmaps ?? []).some((rid) => rid.equals(roadmapId));

  if (isFavorite) {
    await User.findByIdAndUpdate(userId, { $pull: { favoriteRoadmaps: roadmapId } });
  } else {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { favoriteRoadmaps: roadmapId, savedRoadmaps: roadmapId },
    });
  }

  res.status(200).json({ favorite: !isFavorite, roadmapId: id });
});

/**
 * POST /roadmaps/:id/certificate
 *
 * Issues the completion certificate. Eligibility is verified server-side
 * against UserProgress; the client cannot assert completion.
 */
export const createCertificate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };

  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid roadmap id");

  const { certificate, created } = await issueCertificate(userId, id);
  if (created) await evaluateAchievements(userId);

  req.log?.info({ userId, roadmapId: id, serial: certificate.serial, created }, "Certificate issued");
  res.status(created ? 201 : 200).json({
    certificate: {
      id: certificate._id.toString(),
      roadmapId: certificate.roadmapId.toString(),
      topic: certificate.topic,
      recipientName: certificate.recipientName,
      stagesCompleted: certificate.stagesCompleted,
      serial: certificate.serial,
      issuedAt: certificate.issuedAt,
    },
  });
});

/**
 * GET /roadmaps/:id/quiz
 *
 * Hands out a fresh attempt. The seed comes back with the questions and must
 * be returned on submission; answers are not included, and are never sent to
 * the client at any point.
 */
export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid roadmap id");

  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  if (!canQuiz(roadmap.stages)) {
    throw ApiError.badRequest("This roadmap is too short to generate a quiz.");
  }

  // Taking the quiz before finishing the course would let a learner certify
  // on a course they never worked through.
  const progress = await UserProgress.findOne({ userId, roadmapId: id });
  const completed = progress?.completedStageIds.length ?? 0;
  if (completed < roadmap.stages.length) {
    throw ApiError.badRequest(
      `Finish every stage first — ${completed} of ${roadmap.stages.length} complete.`
    );
  }

  const seed = newSeed();
  const questions = publicQuestions(buildQuiz(roadmap.stages, seed));

  res.status(200).json({
    seed,
    questions,
    total: questions.length,
    passMark: PASS_MARK,
    alreadyPassed: Boolean(progress?.quizPassedAt),
  });
});

/**
 * POST /roadmaps/:id/quiz
 *
 * Scores an attempt by regenerating it from its seed. A pass is recorded on
 * the learner's progress, which is what `issueCertificate` checks — so the
 * gate holds even if the certificate is requested from somewhere else later.
 */
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const { id } = req.params as { id: string };
  const { seed, answers } = req.body as SubmitQuizBody;
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid roadmap id");

  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");
  if (!canQuiz(roadmap.stages)) {
    throw ApiError.badRequest("This roadmap is too short to generate a quiz.");
  }

  // The same completion requirement `getQuiz` enforces. Without it a learner
  // could skip the course entirely and POST a scored attempt against the
  // progress document that merely reading progress creates — not enough to
  // earn a certificate on its own, since `issueCertificate` checks completion
  // separately, but enough to record a pass on a course never started.
  const current = await UserProgress.findOne({ userId, roadmapId: id });
  const completed = current?.completedStageIds.length ?? 0;
  if (completed < roadmap.stages.length) {
    throw ApiError.badRequest(
      `Finish every stage first — ${completed} of ${roadmap.stages.length} complete.`
    );
  }

  const result = scoreQuiz(roadmap.stages, seed, answers);

  const update: Record<string, unknown> = { $inc: { quizAttempts: 1 } };
  if (result.passed) {
    const set: Record<string, unknown> = {
      // Keep the best score, so a weaker re-take cannot lower what is on
      // record.
      quizScore: Math.max(current?.quizScore ?? 0, result.correct),
    };
    // Keep the FIRST pass. `$max` would do the opposite and `$min` would hold
    // the null, so the only honest way to say "set it once" is to look first.
    if (!current?.quizPassedAt) set.quizPassedAt = new Date();
    update.$set = set;
  }
  const progress = await UserProgress.findOneAndUpdate(
    { userId, roadmapId: id },
    update,
    { new: true }
  );

  req.log?.info(
    { userId, roadmapId: id, correct: result.correct, passed: result.passed },
    "Certificate quiz submitted"
  );

  if (result.passed) await evaluateAchievements(userId);

  res.status(200).json({
    ...result,
    passMark: PASS_MARK,
    attempts: progress?.quizAttempts ?? 1,
  });
});
