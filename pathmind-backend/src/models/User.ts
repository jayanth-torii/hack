import { Schema, model, type Document, type Types } from "mongoose";

export interface GoogleCalendarToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  refreshTokenHash?: string;
  googleCalendarToken?: GoogleCalendarToken;
  savedRoadmaps: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const googleCalendarTokenSchema = new Schema<GoogleCalendarToken>(
  {
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },
    googleCalendarToken: { type: googleCalendarTokenSchema, required: false },
    savedRoadmaps: [{ type: Schema.Types.ObjectId, ref: "Roadmap" }],
  },
  { timestamps: true }
);

export const User = model<UserDocument>("User", userSchema);
