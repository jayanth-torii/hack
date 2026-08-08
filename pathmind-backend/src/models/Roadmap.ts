import { Schema, model, type Document, type Types } from "mongoose";
import type {
  CertProvider,
  Difficulty,
  PracticePlatform,
  ResourceType,
} from "../types/domain";

export interface FreeResource {
  title: string;
  url: string;
  type: ResourceType;
  lastVerifiedAt: Date;
  /** false when no live-verified match was found and this is a search-page fallback link */
  verified: boolean;
}

export interface Certification {
  title: string;
  provider: CertProvider;
  url: string;
  price: number | null;
  rank: number;
  lastVerifiedAt: Date;
}

export interface PracticeLinkEntry {
  platform: PracticePlatform;
  problemId: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  verified: boolean;
}

export interface TimelineDay {
  day: number;
  tasks: string[];
}

export interface Stage {
  _id: Types.ObjectId;
  order: number;
  title: string;
  type: "learn" | "practice";
  difficulty: Difficulty;
  prerequisiteStageId: Types.ObjectId | null;
  syllabus: string[];
  freeResources: FreeResource[];
  certifications: Certification[];
  practiceLinks: PracticeLinkEntry[];
  estimatedDays: number;
}

export interface RoadmapDocument extends Document {
  _id: Types.ObjectId;
  topic: string;
  normalizedTopic: string;
  slug: string;
  isPublicTemplate: boolean;
  sourceModel: string;
  stages: Stage[];
  suggestedTimeline: TimelineDay[];
  createdAt: Date;
  updatedAt: Date;
}

const freeResourceSchema = new Schema<FreeResource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["video", "playlist", "doc", "blog"], required: true },
    lastVerifiedAt: { type: Date, required: true, default: () => new Date() },
    verified: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const certificationSchema = new Schema<Certification>(
  {
    title: { type: String, required: true },
    provider: {
      type: String,
      enum: ["coursera", "udemy", "aws", "google", "microsoft", "other"],
      required: true,
    },
    url: { type: String, required: true },
    price: { type: Number, default: null },
    rank: { type: Number, required: true },
    lastVerifiedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const practiceLinkSchema = new Schema<PracticeLinkEntry>(
  {
    platform: { type: String, enum: ["leetcode", "codechef", "hackerrank"], required: true },
    problemId: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    verified: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const stageSchema = new Schema<Stage>({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["learn", "practice"], required: true, default: "learn" },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },
  prerequisiteStageId: { type: Schema.Types.ObjectId, default: null },
  syllabus: [{ type: String }],
  freeResources: [freeResourceSchema],
  certifications: [certificationSchema],
  practiceLinks: [practiceLinkSchema],
  estimatedDays: { type: Number, required: true, default: 1 },
});

const timelineDaySchema = new Schema<TimelineDay>(
  {
    day: { type: Number, required: true },
    tasks: [{ type: String }],
  },
  { _id: false }
);

const roadmapSchema = new Schema<RoadmapDocument>(
  {
    topic: { type: String, required: true, index: true },
    normalizedTopic: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    isPublicTemplate: { type: Boolean, default: true },
    sourceModel: { type: String, default: "mock" },
    stages: [stageSchema],
    suggestedTimeline: [timelineDaySchema],
  },
  { timestamps: true }
);

roadmapSchema.index({ normalizedTopic: 1, isPublicTemplate: 1 });

export const Roadmap = model<RoadmapDocument>("Roadmap", roadmapSchema);
