import { Schema, model, type Document, type Types } from "mongoose";

/**
 * An unlocked badge. Only the *unlock* is stored — the title, description and
 * icon live in code (`services/achievement.service.ts`) so copy can be
 * reworded without a migration, and so a learner's history cannot drift from
 * the current catalogue.
 */
export interface AchievementDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<AchievementDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true, trim: true },
    unlockedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Achievement = model<AchievementDocument>("Achievement", achievementSchema);
