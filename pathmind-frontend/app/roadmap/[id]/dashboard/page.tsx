"use client";

import { useParams } from "next/navigation";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { ProgressDashboard } from "@/components/sections/ProgressDashboard";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  useRoadmapProgress(id); // hydrates the store's `progress` used by useUnlockLogic

  const actions = [
    { href: `/roadmap/${id}`, label: "Journey" },
    { href: `/roadmap/${id}/calendar`, label: "Calendar" },
    { href: "/saved", label: "Saved" },
  ];

  return (
    <div className="relative min-h-screen-safe bg-ink">
      {/* Ambient glows + noise (site theme) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(46rem_30rem_at_15%_-5%,rgba(201,243,29,0.1),transparent_60%),radial-gradient(40rem_30rem_at_100%_15%,rgba(56,189,248,0.09),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-noise opacity-[0.04]" />

      <AppBar title="Progress" back={`/roadmap/${id}`} actions={actions} />

      <main id="main">
        {roadmapQuery.isLoading ? (
          <DashboardSkeleton />
        ) : roadmapQuery.isError || !roadmapQuery.data ? (
          <div className="pt-app-bar pb-nav flex min-h-screen-safe items-center justify-center">
            <StateView
              tone="error"
              title="We couldn't load your progress"
              description="The roadmap behind this dashboard didn't come back. Try again, or head to the journey view."
              illustration="no-data"
              primary={{ label: "Try again", onClick: () => void roadmapQuery.refetch() }}
              secondary={{ label: "Open journey", href: `/roadmap/${id}` }}
            />
          </div>
        ) : (
          <ProgressDashboard roadmap={roadmapQuery.data} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
