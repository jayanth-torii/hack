"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { RoadmapJourney } from "@/components/sections/RoadmapJourney";
import { Illustration } from "@/components/ui/Illustration";

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  const progressQuery = useRoadmapProgress(id);

  if (roadmapQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-muted">
        Loading roadmap…
      </div>
    );
  }

  if (roadmapQuery.isError || !roadmapQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink text-muted">
        <Illustration name="no-data" className="h-40 w-56" imgClassName="object-contain p-2" />
        <p>Couldn&apos;t load this roadmap.</p>
        <Link href="/" className="text-brand-400 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/60 backdrop-blur-2xl backdrop-saturate-150">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Vidhyora home">
            <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Vidhyora
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href={`/roadmap/${id}/dashboard`}
              className="text-subtle transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href={`/roadmap/${id}/calendar`}
              className="text-subtle transition-colors hover:text-accent"
            >
              Calendar
            </Link>
            <Link href="/saved" className="text-subtle transition-colors hover:text-accent">
              Saved
            </Link>
          </div>
        </div>
      </nav>
      <RoadmapJourney roadmap={roadmapQuery.data} progress={progressQuery.data} />
    </>
  );
}
