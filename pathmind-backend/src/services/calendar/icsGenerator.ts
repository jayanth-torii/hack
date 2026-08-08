import ical, { ICalEventData } from "ical-generator";
import type { TimelineDay } from "@/models/Roadmap";

/**
 * Fully functional, dependency-free-of-external-services .ics generator —
 * this is the calendar export path that always works, with zero credentials,
 * for any user regardless of whether they've connected Google Calendar.
 *
 * Converts the roadmap's stored `suggestedTimeline` (day N -> tasks[]) into
 * one all-day-ish 1-hour calendar event per day, starting from `startDate`
 * (defaults to tomorrow) so day 1 never lands in the past.
 */
export function generateIcsCalendar(
  topic: string,
  timeline: TimelineDay[],
  startDate: Date = defaultStartDate()
): Buffer {
  const calendar = ical({ name: `Vidhyora — ${topic}` });

  for (const day of timeline) {
    const eventDate = new Date(startDate);
    eventDate.setDate(eventDate.getDate() + (day.day - 1));
    eventDate.setHours(18, 0, 0, 0); // default 6pm study slot; user can drag in their calendar app

    const end = new Date(eventDate);
    end.setHours(end.getHours() + 1);

    const event: ICalEventData = {
      start: eventDate,
      end,
      summary: `Vidhyora — ${topic} (Day ${day.day})`,
      description: day.tasks.map((t) => `• ${t}`).join("\n"),
    };
    calendar.createEvent(event);
  }

  return Buffer.from(calendar.toString(), "utf-8");
}

function defaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}
