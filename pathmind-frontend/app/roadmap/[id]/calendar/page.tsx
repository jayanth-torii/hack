"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoadmap } from "@/hooks/useRoadmapQuery";
import { CalendarExportButton } from "@/components/ui/CalendarExportButton";

export default function CalendarExportPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);

  if (roadmapQuery.isLoading || !roadmapQuery.data) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }

  const roadmap = roadmapQuery.data;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/roadmap/${id}`} className="text-sm text-brand-400 hover:underline">
        ← Back to 3D journey
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-white">Send &ldquo;{roadmap.topic}&rdquo; to your calendar</h1>
      <p className="mt-2 text-sm text-slate-400">
        Preview the day-by-day plan below, then push it to Google Calendar or download it as an .ics
        file that any calendar app can import.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-700/60 bg-surface-900/60 p-5">
        <CalendarExportButton roadmapId={roadmap.id} topic={roadmap.topic} />
      </div>

      <ol className="mt-8 space-y-3">
        {roadmap.suggestedTimeline.map((day) => (
          <li
            key={day.day}
            className="rounded-xl border border-slate-700/50 bg-surface-900/40 px-4 py-3 text-sm"
          >
            <p className="font-medium text-white">Day {day.day}</p>
            <ul className="mt-1 list-inside list-disc text-slate-400">
              {day.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
