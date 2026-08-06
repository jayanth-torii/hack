import { z } from "zod";

export const exportCalendarSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  body: z.object({
    format: z.enum(["google", "ics"]).default("ics"),
    startDate: z.string().datetime().optional(),
  }),
});
export type ExportCalendarInput = z.infer<typeof exportCalendarSchema>;
