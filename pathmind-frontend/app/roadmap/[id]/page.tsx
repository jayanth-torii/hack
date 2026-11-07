"use client";

import { useParams } from "next/navigation";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { RoadmapJourney } from "@/components/sections/RoadmapJourney";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { RoadmapSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  const progressQuery = useRoadmapProgress(id);

  const actions = [
    { href: `/roadmap/${id}/dashboard`, label: "Dashboard" },
    { href: `/roadmap/${id}/calendar`, label: "Calendar" },
    { href: "/saved", label: "Saved" },
  ];

  return (
    <>
      <AppBar title="Your journey" back="/saved" actions={actions} />

      <main id="main" className="min-h-screen-safe bg-ink">
        {roadmapQuery.isLoading ? (
          // Skeleton mirrors the journey layout so nothing shifts on arrival
          <RoadmapSkeleton />
        ) : roadmapQuery.isError || !roadmapQuery.data ? (
          <div className="pt-app-bar pb-nav flex min-h-screen-safe items-center justify-center">
            <StateView
              tone="error"
              title="We couldn't load this roadmap"
              description="The link may be stale, or the connection dropped on the way. Try again, or pick another roadmap from your library."
              illustration="no-data"
              primary={{ label: "Try again", onClick: () => void roadmapQuery.refetch() }}
              secondary={{ label: "Go to library", href: "/saved" }}
            />
          </div>
        ) : (
          <RoadmapJourney roadmap={roadmapQuery.data} progress={progressQuery.data} />
        )}
      </main>

      <BottomNav />
    </>
  );
}
