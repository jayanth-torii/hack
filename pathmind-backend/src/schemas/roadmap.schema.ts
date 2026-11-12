import { z } from "zod";

export const generateRoadmapSchema = z.object({
  body: z.object({
    topic: z.string().trim().min(2).max(100),
  }),
});
export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>["body"];

export const getRoadmapParamsSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1),
  }),
});

export const saveRoadmapParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
});

/**
 * Quiz submission. The seed names which generated quiz is being answered, so
 * the server can rebuild it and score against answers it never sent out.
 */
export const submitQuizSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    seed: z.string().trim().regex(/^[0-9a-f]{24}$/, "Invalid quiz seed"),
    answers: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(64),
          answerIndex: z.number().int().min(0).max(9),
        })
      )
      .max(20),
  }),
});
export type SubmitQuizBody = z.infer<typeof submitQuizSchema>["body"];
