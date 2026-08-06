"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRoadmap, useRoadmapProgress } from "@/hooks/useRoadmapQuery";
import { ProgressDashboard } from "@/components/sections/ProgressDashboard";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  useRoadmapProgress(id); // hydrates the store's `progress` used by useUnlockLogic

  if (roadmapQuery.isLoading || !roadmapQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <nav className="px-6 py-4 text-sm">
        <Link href={`/roadmap/${id}`} className="text-brand-400 hover:underline">
          ← Back to 3D journey
        </Link>
      </nav>
      <ProgressDashboard roadmap={roadmapQuery.data} />
    </div>
  );
}
