"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { ProgressDashboard } from "@/components/sections/ProgressDashboard";
import { ThemeToggle } from "@/components/home/ThemeToggle";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  useRoadmapProgress(id); // hydrates the store's `progress` used by useUnlockLogic

  if (roadmapQuery.isLoading || !roadmapQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink">
      {/* Ambient glows + noise (site theme) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(46rem_30rem_at_15%_-5%,rgba(201,243,29,0.1),transparent_60%),radial-gradient(40rem_30rem_at_100%_15%,rgba(56,189,248,0.09),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-noise opacity-[0.04]" />

      {/* Glassy header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/60 backdrop-blur-2xl backdrop-saturate-150">
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
              href={`/roadmap/${id}`}
              className="text-subtle transition-colors hover:text-accent"
            >
              Journey
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <ProgressDashboard roadmap={roadmapQuery.data} />
    </div>
  );
}
