import { Types } from "mongoose";
import { ActivityEvent, type ActivityType } from "../models/ActivityEvent";
import { logger } from "../config/logger";

export interface RecordActivityInput {
  userId: string | Types.ObjectId;
  type: ActivityType;
  roadmapId?: string | Types.ObjectId;
  stageId?: string | Types.ObjectId;
  title?: string;
  subtitle?: string;
}

/**
 * Appends one activity event.
 *
 * Deliberately never throws: an analytics write must not be able to fail the
 * user action that produced it. A learner marking a stage complete still gets
 * a 200 even if this insert fails — the failure is logged, not surfaced.
 */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await ActivityEvent.create({
      userId: new Types.ObjectId(String(input.userId)),
      type: input.type,
      ...(input.roadmapId ? { roadmapId: new Types.ObjectId(String(input.roadmapId)) } : {}),
      ...(input.stageId ? { stageId: new Types.ObjectId(String(input.stageId)) } : {}),
      ...(input.title ? { title: input.title } : {}),
      ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    });
  } catch (err) {
    logger.error({ err, type: input.type }, "Failed to record activity event (non-fatal)");
  }
}

/** A single bucket in the activity chart. */
export interface ActivityBucket {
  /** ISO date for the start of the bucket (local midnight, UTC-normalised). */
  date: string;
  count: number;
}

export type ActivityRange = "week" | "month";

/** Start of day in UTC, so bucketing is stable regardless of server locale. */
function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Daily completion counts for the last 7 or 30 days.
 *
 * Every day in the window is returned, including zeros — a chart with gaps
 * silently misrepresents inactivity as missing data.
 */
export async function getActivityBuckets(
  userId: string,
  range: ActivityRange
): Promise<ActivityBucket[]> {
  const days = range === "week" ? 7 : 30;
  const today = startOfUtcDay(new Date());
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await ActivityEvent.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: "stage_completed",
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(rows.map((r) => [r._id, r.count]));
  const buckets: ActivityBucket[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    buckets.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return buckets;
}

/**
 * Consecutive days up to and including today with at least one completion.
 *
 * Counts backwards from today; a gap ends the streak. Yesterday-only activity
 * still counts as a live streak of 1 for today's purposes only if today also
 * has activity — otherwise the streak is reported from yesterday backwards,
 * which is what a learner expects before they have studied today.
 */
export async function getStreak(userId: string): Promise<{ current: number; longest: number }> {
  const rows = await ActivityEvent.aggregate<{ _id: string }>([
    { $match: { userId: new Types.ObjectId(userId), type: "stage_completed" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  if (rows.length === 0) return { current: 0, longest: 0 };

  const activeDays = rows.map((r) => r._id);
  const activeSet = new Set(activeDays);

  // Current streak: walk back from today, then from yesterday if today is empty,
  // so a learner who has not studied *yet today* keeps their run.
  const today = startOfUtcDay(new Date());
  let cursor = new Date(today);
  if (!activeSet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let current = 0;
  while (activeSet.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest streak: scan the sorted-descending day list for consecutive runs.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i += 1) {
    const prev = new Date(`${activeDays[i - 1]}T00:00:00Z`);
    const curr = new Date(`${activeDays[i]}T00:00:00Z`);
    const gapDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (gapDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest: Math.max(longest, current) };
}
