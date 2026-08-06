"use client";

import { useState } from "react";
import { Button } from "./Button";
import { useExportCalendar } from "@/hooks/useRoadmapQuery";

interface CalendarExportButtonProps {
  roadmapId: string;
  topic: string;
}

/**
 * One-click "send to calendar": converts the stored suggestedTimeline into a
 * day-by-day plan and either downloads an .ics (always works, no login) or
 * batch-inserts into the user's Google Calendar if they've connected it.
 */
export function CalendarExportButton({ roadmapId, topic }: CalendarExportButtonProps) {
  const exportCalendar = useExportCalendar();
  const [result, setResult] = useState<string | null>(null);

  const handleExport = async (format: "google" | "ics") => {
    setResult(null);
    try {
      const res = await exportCalendar.mutateAsync({ roadmapId, topic, format });
      setResult(
        res.format === "ics"
          ? "Downloaded pathmind-plan.ics — import it into any calendar app."
          : `Added ${res.eventsCreated} events to Google Calendar.`
      );
    } catch {
      setResult(
        format === "google"
          ? "Google Calendar isn't connected yet. Connect it from Settings, or use the .ics download."
          : "Export failed. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" isLoading={exportCalendar.isPending} onClick={() => handleExport("ics")}>
          Download .ics
        </Button>
        <Button variant="secondary" isLoading={exportCalendar.isPending} onClick={() => handleExport("google")}>
          Send to Google Calendar
        </Button>
      </div>
      {result && <p className="text-xs text-slate-400">{result}</p>}
    </div>
  );
}
