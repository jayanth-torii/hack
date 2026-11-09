import { z } from "zod";

/**
 * Free-text tag. Blank entries are allowed through deliberately — a half-typed
 * chip in the UI should not 422 an otherwise valid save; the controller trims,
 * drops blanks and de-duplicates. The length cap is the real guard here.
 */
const tag = z.string().trim().max(40);

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    education: z
      .object({
        school: z.string().trim().max(120).optional(),
        degree: z.string().trim().max(120).optional(),
        fieldOfStudy: z.string().trim().max(120).optional(),
        graduationYear: z.number().int().min(1950).max(2100).optional(),
      })
      .optional(),
    // Capped so a single account cannot grow an unbounded array.
    skills: z.array(tag).max(30).optional(),
    interests: z.array(tag).max(30).optional(),
  }),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];

export const updateNotificationsSchema = z.object({
  body: z.object({
    productUpdates: z.boolean().optional(),
    roadmapReminders: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
  }),
});
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>["body"];

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    // Matches the registration minimum so the rules never disagree.
    newPassword: z.string().min(8).max(128),
  }),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];

export const activityRangeSchema = z.object({
  query: z.object({
    range: z.enum(["week", "month"]).optional(),
  }),
});

export const upsertGoalSchema = z.object({
  params: z.object({ roadmapId: z.string().trim().min(1) }),
  body: z.object({
    // Coerced because JSON has no date type; the controller rejects past dates.
    targetDate: z.coerce.date(),
    note: z.string().trim().max(280).optional(),
  }),
});
export type UpsertGoalInput = z.infer<typeof upsertGoalSchema>["body"];
