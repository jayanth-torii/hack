import { z } from "zod";

export const updateProgressParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1), // roadmapId
    stageId: z.string().trim().min(1),
  }),
});
