import { z } from "zod";

export const topicSearchSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters")
    .max(80, "Keep it under 80 characters"),
});
export type TopicSearchInput = z.infer<typeof topicSearchSchema>;

// --- Raw API response shapes (mirrors the backend's Mongoose JSON output) ---
// Validated at the network boundary so a shape drift in the backend fails
// loudly here instead of silently producing `undefined`s deep in the 3D view.

const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const apiFreeResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(["video", "playlist", "doc", "blog"]),
  lastVerifiedAt: z.string(),
  verified: z.boolean().default(true),
});

export const apiCertificationSchema = z.object({
  title: z.string(),
  provider: z.enum(["coursera", "udemy", "aws", "google", "microsoft", "other"]),
  url: z.string(),
  price: z.number().nullable(),
  rank: z.number(),
  lastVerifiedAt: z.string(),
});

export const apiPracticeLinkSchema = z.object({
  platform: z.enum(["leetcode", "codechef", "hackerrank"]),
  problemId: z.string(),
  title: z.string(),
  url: z.string(),
  difficulty: difficultySchema,
  verified: z.boolean().default(true),
});

export const apiStageSchema = z.object({
  _id: z.string(),
  order: z.number(),
  title: z.string(),
  type: z.enum(["learn", "practice"]),
  difficulty: difficultySchema,
  prerequisiteStageId: z.string().nullable(),
  syllabus: z.array(z.string()).default([]),
  freeResources: z.array(apiFreeResourceSchema).default([]),
  certifications: z.array(apiCertificationSchema).default([]),
  practiceLinks: z.array(apiPracticeLinkSchema).default([]),
  estimatedDays: z.number().default(1),
});
export type ApiStage = z.infer<typeof apiStageSchema>;

export const apiTimelineDaySchema = z.object({
  day: z.number(),
  tasks: z.array(z.string()),
});

export const apiRoadmapSchema = z.object({
  _id: z.string(),
  topic: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  stages: z.array(apiStageSchema),
  suggestedTimeline: z.array(apiTimelineDaySchema).default([]),
});
export type ApiRoadmap = z.infer<typeof apiRoadmapSchema>;
