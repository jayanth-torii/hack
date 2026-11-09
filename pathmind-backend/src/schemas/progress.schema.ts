import { z } from "zod";

export const updateProgressParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1), // roadmapId
    stageId: z.string().trim().min(1),
  }),
});

export const updateStageItemSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1), // roadmapId
    stageId: z.string().trim().min(1),
  }),
  body: z.object({
    /**
     * Index into the stage's `syllabus`. The upper bound depends on the stage
     * being addressed, so it is checked in the controller where the stage is
     * loaded; here we only reject values that can never be valid.
     */
    index: z.number().int().nonnegative(),
    done: z.boolean(),
  }),
});
