import { Schema, model, type Document, type Types } from "mongoose";

/**
 * A learner-set target date for finishing a roadmap.
 *
 * Distinct from `Roadmap.suggestedTimeline`, which is the AI's estimate for
 * everyone; this is one person's commitment and is the only date the UI may
 * describe as a deadline.
 */
export interface GoalDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  roadmapId: Types.ObjectId;
  targetDate: Date;
  note?: string;
  /** Set when the roadmap reached 100%; null while still in progress. */
  achievedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<GoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    targetDate: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 280 },
    achievedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One active goal per roadmap — setting a new date updates the existing goal.
goalSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export const Goal = model<GoalDocument>("Goal", goalSchema);
