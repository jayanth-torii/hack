import { google } from "googleapis";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { GoogleCalendarToken } from "@/models/User";
import type { TimelineDay } from "@/models/Roadmap";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// Login grants identity (openid/email/profile) plus calendar so a Google
// sign-in also connects Calendar — one consent screen, two features.
const LOGIN_SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.events"];

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

/**
 * Authorization URL for "Continue with Google" sign-in. The resulting
 * callback goes through the same /auth/google/callback endpoint, which
 * dispatches on the `mode` in state ("login" vs "connect").
 */
export function getGoogleLoginUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: LOGIN_SCOPES,
    state,
  });
}

export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Exchanges the OAuth code for tokens and resolves the user's identity from
 * the OpenID id_token (falling back to the userinfo endpoint). Returns both
 * so the caller can sign the user in and store the calendar token in one go.
 */
export async function exchangeCodeForTokenAndProfile(
  code: string
): Promise<{ token: GoogleCalendarToken; profile: GoogleProfile }> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token");
  }
  // prompt=consent + access_type=offline always yields a refresh token; fail
  // loudly rather than store an empty one that breaks calendar refresh later.
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token");
  }

  let profile: GoogleProfile = { email: "" };
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CALENDAR_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (payload?.email) {
      profile = {
        email: payload.email.toLowerCase(),
        name: payload.name,
        picture: payload.picture,
      };
    }
  }

  if (!profile.email) {
    // Fallback: fetch the profile directly with the access token.
    client.setCredentials({ access_token: tokens.access_token });
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) throw new Error("Google did not return an email address");
    profile = {
      email: data.email.toLowerCase(),
      name: data.name ?? undefined,
      picture: data.picture ?? undefined,
    };
  }

  return {
    token: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3_600_000),
    },
    profile,
  };
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
          summary: `Vidhyora — ${topic} (Day ${day.day})`,
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
