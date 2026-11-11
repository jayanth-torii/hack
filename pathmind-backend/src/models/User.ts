import { Schema, model, type Document, type Types } from "mongoose";

export interface Education {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

/**
 * Defaults are opt-IN for anything periodic and opt-OUT for nothing, so a new
 * account is never silently subscribed to mail it did not ask for.
 */
export interface NotificationPrefs {
  productUpdates: boolean;
  roadmapReminders: boolean;
  weeklyDigest: boolean;
}

export interface GoogleCalendarToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Platform role. `admin` is the only elevated role and is granted out of band
 * (`npm run admin:grant -- <email>`) or by another admin — never by anything
 * a user can reach, and never by self-service registration.
 */
export type UserRole = "user" | "admin";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  /**
   * Suspended accounts keep all their data but cannot refresh a session.
   * Authorization is re-checked from the database on every admin request, so a
   * suspension bites immediately there; elsewhere it takes effect when the
   * 15-minute access token next needs refreshing.
   */
  suspended: boolean;
  suspendedReason?: string;
  lastLoginAt?: Date;
  passwordHash?: string;
  name?: string;
  avatar?: string;
  refreshTokenHash?: string;
  googleCalendarToken?: GoogleCalendarToken;
  savedRoadmaps: Types.ObjectId[];
  /** Subset of savedRoadmaps the learner starred. */
  favoriteRoadmaps: Types.ObjectId[];
  education?: Education;
  /** Free-text tags the learner manages themselves; not validated against a taxonomy. */
  skills: string[];
  interests: string[];
  notificationPrefs: NotificationPrefs;
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
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    suspended: { type: Boolean, default: false, index: true },
    suspendedReason: { type: String, trim: true, maxlength: 200 },
    lastLoginAt: { type: Date },
    name: { type: String, trim: true },
    avatar: { type: String },
    refreshTokenHash: { type: String, select: false },
    googleCalendarToken: { type: googleCalendarTokenSchema, required: false },
    savedRoadmaps: [{ type: Schema.Types.ObjectId, ref: "Roadmap" }],
    favoriteRoadmaps: [{ type: Schema.Types.ObjectId, ref: "Roadmap" }],
    education: {
      type: new Schema<Education>(
        {
          school: { type: String, trim: true, maxlength: 120 },
          degree: { type: String, trim: true, maxlength: 120 },
          fieldOfStudy: { type: String, trim: true, maxlength: 120 },
          graduationYear: { type: Number, min: 1950, max: 2100 },
        },
        { _id: false }
      ),
      required: false,
    },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    notificationPrefs: {
      type: new Schema<NotificationPrefs>(
        {
          productUpdates: { type: Boolean, default: false },
          roadmapReminders: { type: Boolean, default: true },
          weeklyDigest: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({ productUpdates: false, roadmapReminders: true, weeklyDigest: false }),
    },
  },
  { timestamps: true }
);

export const User = model<UserDocument>("User", userSchema);
