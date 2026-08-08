import type { Request, Response } from "express";
import { env } from "@/config/env";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { getRoadmapById } from "@/services/roadmap.service";
import { generateIcsCalendar } from "@/services/calendar/icsGenerator";
import {
  exchangeCodeForToken,
  exchangeCodeForTokenAndProfile,
  getGoogleAuthUrl,
  insertTimelineEvents,
  isGoogleCalendarConfigured,
} from "@/services/calendar/googleCalendar.service";
import { User } from "@/models/User";
import { hashToken } from "@/utils/bcrypt";
import { setAuthCookies } from "@/utils/cookies";
import { signAccessToken, signRefreshToken } from "@/utils/jwt";
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
    `attachment; filename="vidhyora-${slugify(roadmap.topic)}.ics"`
  );
  res.status(200).send(ics);
});

export const googleConnect = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  // Allow the frontend to choose where the user lands after connecting
  // (defaults to /saved). Carried through OAuth state so the callback can
  // restore it — never trust a bare redirect param alone.
  const next =
    typeof req.query.next === "string" && req.query.next.startsWith("/")
      ? req.query.next.slice(0, 200)
      : "/saved";

  // MOCK_MODE: simulate a successful connect so the whole send-to-calendar
  // flow is demoable without a Google Cloud project.
  if (!isGoogleCalendarConfigured()) {
    if (env.MOCK_MODE) {
      await User.findByIdAndUpdate(userId, {
        googleCalendarToken: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresAt: new Date(Date.now() + 86_400_000 * 7),
        },
      });
      const separator = next.includes("?") ? "&" : "?";
      res.redirect(`${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}${next}${separator}calendarConnected=1`);
      return;
    }
    throw ApiError.conflict(
      "Google Calendar OAuth is not configured on this server. Set GOOGLE_CALENDAR_CLIENT_ID/SECRET."
    );
  }

  const state = JSON.stringify({ uid: userId, next });
  res.redirect(getGoogleAuthUrl(state));
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) throw ApiError.badRequest("Missing code/state from Google callback");

  let userId = "";
  let mode: "login" | "connect" = "connect";
  let next = "/saved";
  try {
    const parsed = JSON.parse(state) as { uid?: string; next?: string; mode?: "login" | "connect" };
    userId = parsed.uid ?? "";
    if (parsed.mode === "login") mode = "login";
    if (parsed.next?.startsWith("/")) next = parsed.next.slice(0, 200);
  } catch {
    // Backward-compatible: state was the bare userId before structured state.
    userId = state;
  }

  // ── "Continue with Google" sign-in: find-or-create the user, sign them
  // in with the normal auth cookies, and also store the calendar token the
  // login scope granted (so export-to-Calendar works right after).
  if (mode === "login") {
    if (!isGoogleCalendarConfigured()) {
      throw ApiError.conflict("Google OAuth is not configured on this server.");
    }
    const { token, profile } = await exchangeCodeForTokenAndProfile(code);
    if (!profile.email) throw ApiError.badRequest("Google did not return an email address");

    // findOneAndUpdate upsert avoids the create race where two concurrent
    // callbacks for the same new email would both pass findOne and one would
    // hit the unique index.
    const user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        $setOnInsert: { email: profile.email, savedRoadmaps: [] },
        $set: {
          googleCalendarToken: token,
          ...(profile.name ? { name: profile.name } : {}),
          ...(profile.picture ? { avatar: profile.picture } : {}),
        },
      },
      { upsert: true, new: true }
    );

    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    user.refreshTokenHash = await hashToken(refreshToken);
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);

    const separator = next.includes("?") ? "&" : "?";
    res.redirect(`${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}${next}${separator}googleLogin=1`);
    return;
  }

  // ── Calendar connect for an already-logged-in account.
  if (!userId) throw ApiError.badRequest("Invalid state from Google callback");
  const token = await exchangeCodeForToken(code);
  await User.findByIdAndUpdate(userId, { googleCalendarToken: token });

  const separator = next.includes("?") ? "&" : "?";
  res.redirect(`${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}${next}${separator}calendarConnected=1`);
});

/**
 * @openapi
 * /auth/google/status:
 *   get:
 *     summary: Whether the current user has connected Google Calendar
 *     tags: [Calendar]
 *     responses:
 *       200: { description: "{ connected: boolean }" }
 *       401: { description: Not authenticated }
 */
export const googleStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw ApiError.unauthorized("Not authenticated");
  const user = await User.findById(req.auth.userId);
  if (!user) throw ApiError.unauthorized("User not found");
  res.status(200).json({ connected: Boolean(user.googleCalendarToken) });
});
