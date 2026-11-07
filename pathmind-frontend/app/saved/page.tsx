import { Suspense } from "react";
import { SavedRoadmaps } from "@/components/sections/SavedRoadmaps";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { CardGridSkeleton } from "@/components/ui/Skeleton";

export default function SavedPage() {
  return (
    <>
      {/* The library is a top-level destination, so no back affordance —
          the bottom nav is the way between it and the other destinations. */}
      <AppBar actions={[{ href: "/profile", label: "Profile" }]} />

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-ink">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
              <CardGridSkeleton />
            </div>
          }
        >
          <SavedRoadmaps />
        </Suspense>
      </main>

      <BottomNav />
    </>
  );
}
