import { Schema, model, type Document, type Types } from "mongoose";

export interface UserProgressDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  roadmapId: Types.ObjectId;
  completedStageIds: Types.ObjectId[];
  unlockedStageIds: Types.ObjectId[];
  updatedAt: Date;
  createdAt: Date;
}

// Kept separate from the Roadmap template document so many students can share
// one cached/generated roadmap without write contention on that shared doc.
const userProgressSchema = new Schema<UserProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    completedStageIds: [{ type: Schema.Types.ObjectId }],
    unlockedStageIds: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export const UserProgress = model<UserProgressDocument>("UserProgress", userProgressSchema);
