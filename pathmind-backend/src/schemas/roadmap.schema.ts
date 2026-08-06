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
