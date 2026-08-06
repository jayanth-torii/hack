"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { RoadmapJourney } from "@/components/sections/RoadmapJourney";

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  const progressQuery = useRoadmapProgress(id);

  if (roadmapQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading roadmap…
      </div>
    );
  }

  if (roadmapQuery.isError || !roadmapQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <p>Couldn&apos;t load this roadmap.</p>
        <Link href="/" className="text-brand-400 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed left-0 top-0 z-40 flex w-full items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-white">
          PathMind
        </Link>
        <div className="flex gap-4 text-sm text-slate-300">
          <Link href={`/roadmap/${id}/dashboard`} className="hover:text-brand-400">
            Dashboard
          </Link>
          <Link href={`/roadmap/${id}/calendar`} className="hover:text-brand-400">
            Calendar
          </Link>
          <Link href="/saved" className="hover:text-brand-400">
            Saved
          </Link>
        </div>
      </nav>
      <RoadmapJourney roadmap={roadmapQuery.data} progress={progressQuery.data} />
    </>
  );
}
