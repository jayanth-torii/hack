import { ActivityEvent } from "../../models/ActivityEvent";
import { Certificate } from "../../models/Certificate";
import { Roadmap } from "../../models/Roadmap";
import { User } from "../../models/User";
import { UserProgress } from "../../models/UserProgress";

export interface AdminStats {
  users: {
    total: number;
    admins: number;
    suspended: number;
    newLast7Days: number;
    newLast30Days: number;
    /** Distinct users with at least one recorded action in the last 30 days. */
    activeLast30Days: number;
  };
  roadmaps: {
    total: number;
    curated: number;
    generated: number;
    published: number;
    /** Roadmaps at least one learner has saved. */
    inUse: number;
  };
  learning: {
    stagesCompleted: number;
    certificatesIssued: number;
    roadmapsCompleted: number;
  };
  resources: {
    total: number;
    unverified: number;
  };
  /** Most-saved topics, highest first. */
  popularTopics: Array<{ topic: string; slug: string; learners: number }>;
  /** Course counts per catalog category. */
  categories: Array<{ category: string; count: number }>;
  /** Daily platform-wide completions for the last 30 days, zeros included. */
  activity: Array<{ date: string; count: number }>;
  /** New sign-ups per day for the last 30 days, zeros included. */
  signups: Array<{ date: string; count: number }>;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = startOfUtcDay(new Date());
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * Fills a `{ date, count }` series so every day in the window is present.
 *
 * A chart drawn from sparse aggregation rows reads a quiet day as a missing
 * day — the line simply jumps the gap, which overstates activity. Zeros are
 * data.
 */
function densify(rows: Array<{ _id: string; count: number }>, days: number) {
  const counts = new Map(rows.map((r) => [r._id, r.count]));
  const since = daysAgo(days - 1);
  const out: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

const DAY_GROUP = {
  $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
    count: { $sum: 1 },
  },
} as const;

/**
 * Every number on the admin overview, in one round trip's worth of parallel
 * queries.
 *
 * All of it is derived — nothing here is a counter the app has to remember to
 * increment, so the dashboard cannot drift out of step with reality the way a
 * denormalised stats document would.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const since7 = daysAgo(7);
  const since30 = daysAgo(30);

  const [
    totalUsers,
    admins,
    suspended,
    newLast7Days,
    newLast30Days,
    activeUserIds,
    totalRoadmaps,
    curated,
    published,
    inUse,
    stagesCompleted,
    certificatesIssued,
    resourceTotals,
    popularTopics,
    categories,
    activityRows,
    signupRows,
    roadmapsCompleted,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ suspended: true }),
    User.countDocuments({ createdAt: { $gte: since7 } }),
    User.countDocuments({ createdAt: { $gte: since30 } }),
    ActivityEvent.distinct("userId", { createdAt: { $gte: since30 } }),
    Roadmap.countDocuments({}),
    Roadmap.countDocuments({ sourceModel: "curated" }),
    Roadmap.countDocuments({ isPublicTemplate: true }),
    User.distinct("savedRoadmaps"),
    ActivityEvent.countDocuments({ type: "stage_completed" }),
    Certificate.countDocuments({}),

    // Resource health, flattened across every stage of every roadmap.
    Roadmap.aggregate<{ _id: null; total: number; unverified: number }>([
      { $unwind: "$stages" },
      { $unwind: "$stages.freeResources" },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unverified: {
            $sum: { $cond: [{ $eq: ["$stages.freeResources.verified", false] }, 1, 0] },
          },
        },
      },
    ]),

    // Most-saved courses. Counted from the users side, so a course saved by
    // nobody never appears and the number means "learners", not "copies".
    User.aggregate<{ _id: string; topic: string; slug: string; learners: number }>([
      { $unwind: "$savedRoadmaps" },
      { $group: { _id: "$savedRoadmaps", learners: { $sum: 1 } } },
      { $sort: { learners: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "roadmaps",
          localField: "_id",
          foreignField: "_id",
          as: "roadmap",
        },
      },
      { $unwind: "$roadmap" },
      {
        $project: {
          topic: "$roadmap.topic",
          slug: "$roadmap.slug",
          learners: 1,
        },
      },
    ]),

    Roadmap.aggregate<{ _id: string; count: number }>([
      { $match: { category: { $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    ActivityEvent.aggregate<{ _id: string; count: number }>([
      { $match: { type: "stage_completed", createdAt: { $gte: since30 } } },
      DAY_GROUP,
    ]),

    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since30 } } },
      DAY_GROUP,
    ]),

    // A roadmap is "completed" when the learner has as many completed stages
    // as the roadmap has stages — computed, not stored, so it stays true if a
    // curated course is re-seeded with a different stage count.
    UserProgress.aggregate<{ _id: null; count: number }>([
      {
        $lookup: {
          from: "roadmaps",
          localField: "roadmapId",
          foreignField: "_id",
          as: "roadmap",
        },
      },
      { $unwind: "$roadmap" },
      {
        $match: {
          $expr: {
            $and: [
              { $gt: [{ $size: "$roadmap.stages" }, 0] },
              { $gte: [{ $size: "$completedStageIds" }, { $size: "$roadmap.stages" }] },
            ],
          },
        },
      },
      { $count: "count" },
    ]).then((rows) => rows[0]?.count ?? 0),
  ]);

  const resources = resourceTotals[0] ?? { total: 0, unverified: 0 };

  return {
    users: {
      total: totalUsers,
      admins,
      suspended,
      newLast7Days,
      newLast30Days,
      activeLast30Days: activeUserIds.length,
    },
    roadmaps: {
      total: totalRoadmaps,
      curated,
      generated: totalRoadmaps - curated,
      published,
      inUse: inUse.length,
    },
    learning: { stagesCompleted, certificatesIssued, roadmapsCompleted },
    resources: { total: resources.total, unverified: resources.unverified },
    popularTopics: popularTopics.map((t) => ({
      topic: t.topic,
      slug: t.slug,
      learners: t.learners,
    })),
    categories: categories.map((c) => ({ category: c._id, count: c.count })),
    activity: densify(activityRows, 30),
    signups: densify(signupRows, 30),
  };
}
