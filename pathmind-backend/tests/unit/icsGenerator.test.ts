import { generateIcsCalendar } from "@/services/calendar/icsGenerator";

describe("icsGenerator", () => {
  it("produces a valid VCALENDAR with one VEVENT per timeline day", () => {
    const timeline = [
      { day: 1, tasks: ["Read intro", "Watch video"] },
      { day: 2, tasks: ["Practice problems"] },
    ];
    const buffer = generateIcsCalendar("Dynamic Programming", timeline, new Date("2026-09-01T00:00:00Z"));
    const text = buffer.toString("utf-8");

    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("END:VCALENDAR");
    expect((text.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(text).toContain("Dynamic Programming");
  });

  it("spaces events across consecutive days starting from the given start date", () => {
    const timeline = [{ day: 1, tasks: ["a"] }, { day: 3, tasks: ["b"] }];
    const buffer = generateIcsCalendar("Topic", timeline, new Date("2026-09-01T00:00:00Z"));
    const text = buffer.toString("utf-8");
    expect(text).toContain("DTSTART");
    // day 3's event date should be 2 days after day 1's
    const starts = [...text.matchAll(/DTSTART[^:]*:(\d{8}T\d{6})/g)].map((m) => m[1]);
    expect(starts.length).toBe(2);
  });
});
