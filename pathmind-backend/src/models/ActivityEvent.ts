import { Schema, model, type Document, type Types } from "mongoose";

/**
 * Discrete, append-only record of something the learner did.
 *
 * This exists because `UserProgress` only stores *which* stages are complete,
 * not *when* — so nothing in the system could answer "what did I do this
 * week". Progress remains the source of truth for unlock state; this
 * collection is the source of truth for history, streaks and the activity
 * chart. It is never read to decide what is unlocked.
 */
export type ActivityType =
  | "stage_completed"
  | "roadmap_saved"
  | "roadmap_generated"
  | "certificate_earned"
  | "achievement_unlocked"
  | "goal_set";

export interface ActivityEventDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: ActivityType;
  roadmapId?: Types.ObjectId;
  stageId?: Types.ObjectId;
  /** Denormalised labels so the feed renders without extra lookups. */
  title?: string;
  subtitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityEventSchema = new Schema<ActivityEventDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "stage_completed",
        "roadmap_saved",
        "roadmap_generated",
        "certificate_earned",
        "achievement_unlocked",
        "goal_set",
      ],
    },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap" },
    stageId: { type: Schema.Types.ObjectId },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
  },
  { timestamps: true }
);

// Every read is "this user's events, newest first" or "this user's events in a
// date window", so one compound index covers the feed, the chart and the streak.
activityEventSchema.index({ userId: 1, createdAt: -1 });

export const ActivityEvent = model<ActivityEventDocument>("ActivityEvent", activityEventSchema);
