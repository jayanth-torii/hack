import { z } from "zod";
import { normalizeTopic } from "../utils/slugify";

/**
 * Zod contract for the curated course catalog under `src/data/courses/*.json`.
 *
 * This is the hand-authored, non-AI input format. `src/utils/seedCourses.ts`
 * validates every catalog file against it and maps the result onto the
 * `Roadmap` model. See `src/data/courses/README.md` for the prose version.
 */

const httpsUrl = z
  .string()
  .trim()
  .url("must be a valid URL")
  .refine((u) => u.startsWith("https://"), "must be an https:// URL");

export const courseResourceSchema = z.object({
  title: z.string().trim().min(1),
  url: httpsUrl,
  // The catalog contract is "doc" | "blog"; the Roadmap model also accepts
  // video/playlist, so we allow them rather than reject otherwise-valid data.
  type: z.enum(["doc", "blog", "video", "playlist"]),
});
export type CourseResource = z.infer<typeof courseResourceSchema>;

export const courseStageSchema = z.object({
  title: z.string().trim().min(1),
  type: z.enum(["learn", "practice"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDays: z.number().int().positive(),
  syllabus: z.array(z.string().trim().min(1)).min(1),
  resources: z.array(courseResourceSchema).min(1),
  practiceTags: z.array(z.string().trim().min(1)).optional(),
});
export type CourseStage = z.infer<typeof courseStageSchema>;

/**
 * An external certification a learner can pursue after the course.
 *
 * `price` is **US dollars, approximate**, and is the one field here that is
 * not a fact: exam fees change and subscription prices vary by region. 0 means
 * the certificate itself is free; `null` means the cost genuinely varies
 * (a subscription, or free-to-audit with a paid certificate) and the interface
 * says so rather than inventing a number.
 */
export const courseCertificationSchema = z.object({
  title: z.string().trim().min(1),
  provider: z.enum(["coursera", "udemy", "aws", "google", "microsoft", "other"]),
  url: httpsUrl,
  price: z.number().min(0).nullable(),
});
export type CourseCertification = z.infer<typeof courseCertificationSchema>;

export const courseSchema = z.object({
  topic: z.string().trim().min(2).max(100),
  /** Free text, used only for grouping in the catalog — not stored on the model. */
  category: z.string().trim().min(1),
  /** One-sentence blurb — not stored on the model. */
  summary: z.string().trim().min(1),
  stages: z.array(courseStageSchema).min(1),
  /**
   * Course-level, not stage-level: you certify in the subject, not in
   * "Chapter 3". The seeder attaches them to the final stage, which is the
   * point a learner would actually sit the exam.
   */
  certifications: z.array(courseCertificationSchema).default([]),
});
export type Course = z.infer<typeof courseSchema>;

/**
 * One catalog file: a non-empty array of courses whose topics don't collide
 * with each other. Cross-file collisions are caught by the loader, which can
 * name both files.
 */
export const courseFileSchema = z
  .array(courseSchema)
  .min(1, "a catalog file must contain at least one course")
  .superRefine((courses, ctx) => {
    const seen = new Map<string, number>();
    courses.forEach((course, index) => {
      const key = normalizeTopic(course.topic);
      const first = seen.get(key);
      if (first === undefined) {
        seen.set(key, index);
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "topic"],
        message: `duplicate topic "${course.topic}" (already defined at index ${first} in this file)`,
      });
    });
  });

/** `[0].stages[2].resources[1].url` — a JSON path a human can find in the file. */
export function formatIssuePath(path: Array<string | number>): string {
  if (path.length === 0) return "<root>";
  return path.reduce<string>(
    (acc, segment) =>
      typeof segment === "number" ? `${acc}[${segment}]` : acc === "" ? segment : `${acc}.${segment}`,
    ""
  );
}

/** Renders a ZodError as one readable `path — message` line per issue. */
export function formatCourseIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${formatIssuePath([...issue.path])} — ${issue.message}`);
}
