"use client";

import { useState } from "react";
import { useExportCalendar } from "@/hooks/useRoadmapQuery";
import { ApiClientError } from "@/lib/api-client";
import { googleConnectUrl } from "@/hooks/useGoogleCalendar";
import { toast } from "./toast";
import { clsx } from "@/lib/clsx";

interface CalendarExportButtonProps {
  roadmapId: string;
  topic: string;
}

/** Google Calendar brand mark (blue square + white check). */
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M21.8 8.2 15.8 2.2c-.13-.13-.31-.2-.49-.2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8.69c0-.18-.07-.36-.2-.49z"
      />
      <path
        fill="#fff"
        d="M11.06 16.51 8.1 13.55c-.2-.2-.2-.51 0-.71l.71-.71c.2-.2.51-.2.71 0l1.55 1.55 3.5-3.5c.2-.2.51-.2.71 0l.71.71c.2.2.2.51 0 .71l-4.22 4.21c-.19.19-.5.19-.71 0z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3.5V15m0 0 4.5-4.5M12 15l-4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * One-click "send to calendar": converts the stored suggestedTimeline into a
 * day-by-day plan and either downloads an .ics (always works, no login) or
 * batch-inserts into the user's Google Calendar.
 *
 * Material 3 pairs the two actions as filled + outlined — the Google route is
 * the one most people want, the .ics is the neutral alternative — rather than
 * as a white brand slab beside a glass pill. The Google Calendar mark keeps
 * its own brand colours (it is a logo, not a themed surface); everything
 * around it is a role. When Google isn't connected, the warning links straight
 * into the OAuth connect flow.
 */
export function CalendarExportButton({ roadmapId, topic }: CalendarExportButtonProps) {
  const exportCalendar = useExportCalendar();
  const [result, setResult] = useState<{ text: string; kind: "ok" | "warn" | "err" } | null>(null);
  const busy = exportCalendar.isPending;

  const handleExport = async (format: "google" | "ics") => {
    setResult(null);
    try {
      const res = await exportCalendar.mutateAsync({ roadmapId, topic, format });
      if (res.format === "ics") {
        toast.success("Calendar downloaded", "vidhyora-plan.ics — import it into any calendar app.");
      } else {
        toast.success("Sent to Google Calendar", `${res.eventsCreated} events added.`);
      }
    } catch (err) {
      const notConnected = err instanceof ApiClientError && err.status === 409 && format === "google";
      if (notConnected) {
        toast.warning("Google Calendar isn't connected yet");
        setResult({ kind: "warn", text: "Connect your calendar to send this plan to Google." });
      } else {
        toast.error(
          format === "google" ? "Couldn't reach Google Calendar" : "Export failed",
          format === "google" ? "Please try again in a moment." : "Please try again."
        );
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        {/* Send to Google Calendar — M3 filled button, Google brand mark */}
        <button
          type="button"
          onClick={() => handleExport("google")}
          disabled={busy}
          className="state-layer press inline-flex min-h-touch flex-1 select-none items-center justify-center gap-2.5 rounded-full bg-md-primary px-6 text-label-lg font-medium text-md-on-primary transition-[background-color,box-shadow] duration-fast ease-standard disabled:pointer-events-none disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]"
        >
          {busy ? (
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-md-on-primary/30 border-t-md-on-primary" />
          ) : (
            <GoogleCalendarIcon className="h-4 w-4" />
          )}
          {busy ? "Sending…" : "Send to Google Calendar"}
        </button>

        {/* Download .ics — M3 outlined button, the neutral alternative */}
        <button
          type="button"
          onClick={() => handleExport("ics")}
          disabled={busy}
          className="state-layer press inline-flex min-h-touch flex-1 select-none items-center justify-center gap-2.5 rounded-full border border-md-outline px-6 text-label-lg font-medium text-md-on-surface transition-[background-color,border-color] duration-fast ease-standard disabled:pointer-events-none disabled:border-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]"
        >
          {busy ? (
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-md-outline-variant border-t-md-primary" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
          Download .ics
        </button>
      </div>

      {result && (
        <p
          className={clsx(
            "flex flex-wrap items-center gap-x-2 text-body-sm",
            result.kind === "ok"
              ? "text-md-success"
              : result.kind === "warn"
                ? "text-md-warning"
                : "text-md-error"
          )}
        >
          {result.text}
          {result.kind === "warn" && (
            <a
              href={googleConnectUrl(typeof window !== "undefined" ? window.location.pathname : "/saved")}
              className="text-label-lg text-md-primary underline-offset-4 hover:underline"
            >
              Connect Google Calendar →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
