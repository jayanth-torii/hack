import { randomBytes } from "crypto";
import { Types } from "mongoose";
import { Certificate, type CertificateDocument } from "../../models/Certificate";
import { UserProgress } from "../../models/UserProgress";
import { User } from "../../models/User";
import { getRoadmapById } from "../roadmap.service";
import { ApiError } from "../../utils/apiError";
import { recordActivity } from "../activity.service";
import { canQuiz, PASS_MARK, QUESTION_COUNT } from "../quiz/quiz.service";

/** `VID-<year>-<8 hex>` — short enough to read aloud, wide enough not to collide. */
function makeSerial(): string {
  return `VID-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Issues the completion certificate for a roadmap, or returns the existing one.
 *
 * Eligibility is checked against `UserProgress` on the server. The client is
 * never trusted to say a roadmap is finished — a certificate is a credential,
 * so the only acceptable source is the same progress record that governs stage
 * unlocking.
 *
 * Idempotent: a second call returns the certificate already on file, with its
 * original serial and issue date intact.
 */
export async function issueCertificate(
  userId: string,
  roadmapId: string
): Promise<{ certificate: CertificateDocument; created: boolean }> {
  const existing = await Certificate.findOne({ userId, roadmapId });
  if (existing) return { certificate: existing, created: false };

  const roadmap = await getRoadmapById(roadmapId);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  const progress = await UserProgress.findOne({ userId, roadmapId });
  const completed = progress?.completedStageIds.length ?? 0;
  const total = roadmap.stages.length;

  if (total === 0) throw ApiError.badRequest("This roadmap has no stages");
  if (completed < total) {
    throw ApiError.badRequest(
      `Finish every stage first — ${completed} of ${total} complete.`
    );
  }

  // Finishing every stage is now necessary but not sufficient: the learner
  // must also have passed the quiz. The check is here, in the issuing service,
  // rather than in the controller, so no future caller can route around it.
  // Roadmaps too small to produce a quiz are exempt — see `canQuiz`.
  if (canQuiz(roadmap.stages) && !progress?.quizPassedAt) {
    throw ApiError.badRequest(
      `Pass the certificate quiz first — ${PASS_MARK} of ${QUESTION_COUNT} correct.`
    );
  }

  const user = await User.findById(userId).select("name email");
  if (!user) throw ApiError.unauthorized("User not found");

  // Password accounts have no name, so the email local-part is the only
  // identifier available. Better an honest fallback than a blank certificate.
  const recipientName = user.name?.trim() || user.email.split("@")[0] || "Vidhyora learner";

  const certificate = await Certificate.create({
    userId: new Types.ObjectId(userId),
    roadmapId: new Types.ObjectId(roadmapId),
    topic: roadmap.topic,
    recipientName,
    stagesCompleted: total,
    serial: makeSerial(),
    issuedAt: new Date(),
  });

  await recordActivity({
    userId,
    type: "certificate_earned",
    roadmapId,
    title: `Certificate earned`,
    subtitle: roadmap.topic,
  });

  return { certificate, created: true };
}
