import type { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { getRoadmapById } from "@/services/roadmap.service";
import { generateIcsCalendar } from "@/services/calendar/icsGenerator";
import {
  exchangeCodeForToken,
  getGoogleAuthUrl,
  insertTimelineEvents,
  isGoogleCalendarConfigured,
} from "@/services/calendar/googleCalendar.service";
import { User } from "@/models/User";
import type { ExportCalendarInput } from "@/schemas/calendar.schema";
import { slugify } from "@/utils/slugify";

export const exportCalendar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as ExportCalendarInput["params"];
  const { format, startDate } = req.body as ExportCalendarInput["body"];

  const roadmap = await getRoadmapById(id);
  if (!roadmap) throw ApiError.notFound("Roadmap not found");

  const start = startDate ? new Date(startDate) : undefined;

  if (format === "google") {
    if (!req.auth) throw ApiError.unauthorized("Login required to export to Google Calendar");
    const user = await User.findById(req.auth.userId);
    if (!user?.googleCalendarToken) {
      throw ApiError.conflict(
        "Google Calendar not connected. Connect via GET /auth/google/connect, or use format=ics."
      );
    }
    const result = await insertTimelineEvents(
      user.googleCalendarToken,
      roadmap.topic,
      roadmap.suggestedTimeline,
      start ?? new Date(Date.now() + 86_400_000)
    );
    res.status(200).json({ format: "google", ...result });
    return;
  }

  const ics = generateIcsCalendar(roadmap.topic, roadmap.suggestedTimeline, start);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="pathmind-${slugify(roadmap.topic)}.ics"`
  );
  res.status(200).send(ics);
});

export const googleConnect = asyncHandler(async (req: Request, res: Response) => {
  if (!isGoogleCalendarConfigured()) {
    throw ApiError.conflict(
      "Google Calendar OAuth is not configured on this server. Set GOOGLE_CALENDAR_CLIENT_ID/SECRET."
    );
  }
  const state = req.auth!.userId;
  res.redirect(getGoogleAuthUrl(state));
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) throw ApiError.badRequest("Missing code/state from Google callback");

  const token = await exchangeCodeForToken(code);
  await User.findByIdAndUpdate(state, { googleCalendarToken: token });

  res.redirect(`${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}/saved?calendarConnected=1`);
});
