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
    // M3 carries hierarchy with surface tone, so the screen sits flat on
    // `md-surface` — the ambient radial glows and noise overlay that used to
    // float here were the only thing left reaching past the token set.
    <div className="relative min-h-screen-safe bg-md-surface">
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
