import { Schema, model, type Document, type Types } from "mongoose";

export interface GoogleCalendarToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  name?: string;
  avatar?: string;
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
    // Google sign-in users have no password — the field is optional and
    // `login` rejects it, so password auth simply isn't available to them.
    passwordHash: { type: String, select: false },
    name: { type: String, trim: true },
    avatar: { type: String },
    refreshTokenHash: { type: String, select: false },
    googleCalendarToken: { type: googleCalendarTokenSchema, required: false },
    savedRoadmaps: [{ type: Schema.Types.ObjectId, ref: "Roadmap" }],
  },
  { timestamps: true }
);

export const User = model<UserDocument>("User", userSchema);
