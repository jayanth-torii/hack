import { google } from "googleapis";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { GoogleCalendarToken } from "@/models/User";
import type { TimelineDay } from "@/models/Roadmap";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI
  );
}

/**
 * Real Google Calendar OAuth + batch-insert integration. Requires a Google
 * Cloud OAuth 2.0 Web client (Calendar API enabled) with
 * GOOGLE_CALENDAR_REDIRECT_URI registered as an authorized redirect URI —
 * see .env.example. Until those are set, isConfigured() is false and the
 * calendar controller always falls back to the .ics download, so the export
 * feature is never broken for users who haven't connected Google.
 */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET);
}

export function getGoogleAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForToken(code: string): Promise<GoogleCalendarToken> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google did not return the expected tokens");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
  };
}

export interface GoogleBatchInsertResult {
  eventsCreated: number;
  eventLinks: string[];
}

/**
 * Converts the stored timeline into dated events and batch-inserts them into
 * the user's primary Google Calendar. In MOCK_MODE, simulates success
 * deterministically with no network call, so the full "send to calendar"
 * flow is demoable without a Google Cloud project.
 */
export async function insertTimelineEvents(
  token: GoogleCalendarToken,
  topic: string,
  timeline: TimelineDay[],
  startDate: Date
): Promise<GoogleBatchInsertResult> {
  if (env.MOCK_MODE) {
    return {
      eventsCreated: timeline.length,
      eventLinks: timeline.map(
        (d) => `https://calendar.google.com/calendar/event?mock=${topic}-day-${d.day}`
      ),
    };
  }

  const client = getOAuthClient();
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
  });
  const calendar = google.calendar({ version: "v3", auth: client });

  const eventLinks: string[] = [];
  for (const day of timeline) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (day.day - 1));
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    try {
      const { data } = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `PathMind — ${topic} (Day ${day.day})`,
          description: day.tasks.map((t) => `• ${t}`).join("\n"),
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        },
      });
      if (data.htmlLink) eventLinks.push(data.htmlLink);
    } catch (err) {
      logger.error({ err, day: day.day }, "Google Calendar event insert failed");
    }
  }

  return { eventsCreated: eventLinks.length, eventLinks };
}
