import { Types } from "mongoose";
import { Achievement } from "../models/Achievement";
import { UserProgress } from "../models/UserProgress";
import { Certificate } from "../models/Certificate";
import { User } from "../models/User";
import { getStreak } from "./activity.service";
import { recordActivity } from "./activity.service";
import { logger } from "../config/logger";

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  /** Icon name the frontend maps to its own inline SVG set. */
  icon: "rocket" | "bolt" | "book" | "flame" | "trophy" | "target";
  /** Evaluated against the snapshot below; true means earned. */
  earned: (s: AchievementStats) => boolean;
}

export interface AchievementStats {
  savedRoadmaps: number;
  completedStages: number;
  completedRoadmaps: number;
  certificates: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * The catalogue lives in code, not the database, so wording and icons can
 * change without a migration. Only the unlock is persisted.
 *
 * Every rule is a pure function of the stats snapshot, which makes the set
 * trivially testable and guarantees a badge can never be awarded for something
 * the data does not actually show.
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_roadmap",
    title: "Getting Started",
    description: "Save your first roadmap",
    icon: "rocket",
    earned: (s) => s.savedRoadmaps >= 1,
  },
  {
    key: "first_stage",
    title: "First Step",
    description: "Complete your first stage",
    icon: "target",
    earned: (s) => s.completedStages >= 1,
  },
  {
    key: "streak_3",
    title: "Consistent Learner",
    description: "Keep a 3-day streak",
    icon: "flame",
    earned: (s) => s.longestStreak >= 3,
  },
  {
    key: "ten_stages",
    title: "Momentum",
    description: "Complete 10 stages",
    icon: "bolt",
    earned: (s) => s.completedStages >= 10,
  },
  {
    key: "streak_7",
    title: "Week Strong",
    description: "Keep a 7-day streak",
    icon: "flame",
    earned: (s) => s.longestStreak >= 7,
  },
  {
    key: "first_certificate",
    title: "Certified",
    description: "Finish a roadmap end to end",
    icon: "trophy",
    earned: (s) => s.certificates >= 1,
  },
  {
    key: "topic_explorer",
    title: "Topic Explorer",
    description: "Explore three different topics",
    icon: "book",
    earned: (s) => s.savedRoadmaps >= 3,
  },
];

/** Gathers everything the rules need in one pass. */
export async function getAchievementStats(userId: string): Promise<AchievementStats> {
  const [user, progressDocs, certificates, streak] = await Promise.all([
    User.findById(userId).select("savedRoadmaps"),
    UserProgress.find({ userId }).select("completedStageIds roadmapId"),
    Certificate.countDocuments({ userId }),
    getStreak(userId),
  ]);

  const completedStages = progressDocs.reduce((sum, p) => sum + p.completedStageIds.length, 0);

  return {
    savedRoadmaps: user?.savedRoadmaps.length ?? 0,
    completedStages,
    // A roadmap only counts as complete once a certificate exists for it, so
    // this never disagrees with the certificates the learner can actually see.
    completedRoadmaps: certificates,
    certificates,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  };
}

/**
 * Unlocks any newly earned achievements and returns the keys that were added.
 *
 * Safe to call on every relevant action: the unique `(userId, key)` index makes
 * a duplicate insert a no-op rather than a second badge, and a failure here is
 * logged rather than propagated — losing a badge write must not fail the action
 * that earned it.
 */
export async function evaluateAchievements(userId: string): Promise<string[]> {
  try {
    const [stats, existing] = await Promise.all([
      getAchievementStats(userId),
      Achievement.find({ userId }).select("key"),
    ]);

    const have = new Set(existing.map((a) => a.key));
    const newly = ACHIEVEMENTS.filter((def) => !have.has(def.key) && def.earned(stats));
    if (newly.length === 0) return [];

    const now = new Date();
    await Achievement.insertMany(
      newly.map((def) => ({ userId: new Types.ObjectId(userId), key: def.key, unlockedAt: now })),
      { ordered: false }
    );

    for (const def of newly) {
      await recordActivity({
        userId,
        type: "achievement_unlocked",
        title: def.title,
        subtitle: def.description,
      });
    }

    return newly.map((def) => def.key);
  } catch (err) {
    logger.error({ err, userId }, "Achievement evaluation failed (non-fatal)");
    return [];
  }
}

/** The catalogue joined with this learner's unlock state, for the profile UI. */
export async function listAchievements(userId: string) {
  const unlocked = await Achievement.find({ userId }).select("key unlockedAt");
  const byKey = new Map(unlocked.map((a) => [a.key, a.unlockedAt]));

  return ACHIEVEMENTS.map((def) => ({
    key: def.key,
    title: def.title,
    description: def.description,
    icon: def.icon,
    unlocked: byKey.has(def.key),
    unlockedAt: byKey.get(def.key) ?? null,
  }));
}
