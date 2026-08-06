// Client-side fallback: if the backend ever returns the raw timeline instead
// of a pre-built .ics (e.g. an offline/demo mode), this builds a minimal but
// valid .ics text blob and triggers a browser download — same shape of
// output as the backend's icsGenerator.ts, just runnable with zero network.
import type { TimelineDay } from "@/types/roadmap";

export function buildIcsText(topic: string, timeline: TimelineDay[], startDate = tomorrow()): string {
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//PathMind//${topic}//EN`];

  timeline.forEach((day) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (day.day - 1));
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    lines.push(
      "BEGIN:VEVENT",
      `UID:pathmind-${topic}-day-${day.day}@pathmind.app`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:PathMind — ${topic} (Day ${day.day})`,
      `DESCRIPTION:${day.tasks.join("\\n")}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsFile(filename: string, icsText: string): void {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlobAsFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}
