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
 * Premium one-click "send to calendar": converts the stored suggestedTimeline
 * into a day-by-day plan and either downloads an .ics (always works, no login)
 * or batch-inserts into the user's Google Calendar. The Google action uses the
 * official white/Google-calendar-branded treatment so it reads instantly;
 * .ics stays in the glassy outline language. When Google isn't connected, the
 * warning links straight into the OAuth connect flow.
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
        {/* Send to Google Calendar — official white + Google-brand mark */}
        <button
          type="button"
          onClick={() => handleExport("google")}
          disabled={busy}
          className="group relative inline-flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-white px-5 py-3 text-sm font-bold tracking-tight text-[#1d1d1f] shadow-lg shadow-black/15 ring-1 ring-inset ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* shine sweep on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1d1d1f]/25 border-t-[#1d1d1f]" />
          ) : (
            <GoogleCalendarIcon className="h-4 w-4" />
          )}
          {busy ? "Sending…" : "Send to Google Calendar"}
        </button>

        {/* Download .ics — glassy outline */}
        <button
          type="button"
          onClick={() => handleExport("ics")}
          disabled={busy}
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-line/15 bg-card/60 px-5 py-3 text-sm font-semibold text-subtle backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-lg hover:shadow-accent/10 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line/40 border-t-accent" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
          Download .ics
        </button>
      </div>

      {result && (
        <p
          className={clsx(
            "flex flex-wrap items-center gap-x-2 text-xs",
            result.kind === "ok"
              ? "text-emerald-300"
              : result.kind === "warn"
                ? "text-amber-300"
                : "text-rose-300"
          )}
        >
          {result.text}
          {result.kind === "warn" && (
            <a
              href={googleConnectUrl(typeof window !== "undefined" ? window.location.pathname : "/saved")}
              className="font-semibold text-accent underline-offset-2 hover:underline"
            >
              Connect Google Calendar →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
