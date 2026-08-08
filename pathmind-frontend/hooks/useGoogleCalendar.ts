"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Whether the current user has connected Google Calendar (a token is stored
 * on their account). Only meaningful when logged in; the server returns 401
 * otherwise and the query is left in error state (treated as "not connected"
 * by callers who also know the auth state).
 */
export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ["google-calendar", "status"],
    queryFn: async () => {
      const res = await apiClient.get<{ connected: boolean }>("/auth/google/status");
      return res.connected;
    },
    retry: 1,
  });
}

/**
 * Full-page link to start the Google OAuth connect flow. Must be a real
 * navigation (not a fetch) because the backend 302-redirects to Google's
 * consent screen. `next` is carried through OAuth state and the browser is
 * sent back there with ?calendarConnected=1 afterwards.
 */
export function googleConnectUrl(next: string): string {
  return `${API_URL}/auth/google/connect?next=${encodeURIComponent(next)}`;
}

/**
 * Full-page link to start "Continue with Google" sign-in. The backend
 * redirects to Google's consent screen; after sign-in the browser lands on
 * `next` with ?googleLogin=1 and the auth cookies already set.
 */
export function googleLoginUrl(next: string): string {
  return `${API_URL}/auth/google?next=${encodeURIComponent(next)}`;
}
