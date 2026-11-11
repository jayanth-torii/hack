import { Suspense } from "react";
import type { Metadata } from "next";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { BuildPath } from "@/components/build/BuildPath";

export const metadata: Metadata = {
  title: "Build your path — Vidhyora",
  description:
    "Name any topic and get a sequenced learning path: five to eight stages from beginner to advanced, each with free resources and practice problems.",
};

export default function BuildPage() {
  return (
    <>
      <AppBar
        title="Build your path"
        back="/"
        actions={[
          { href: "/courses", label: "Catalog" },
          { href: "/courses/build", label: "Build from catalog" },
          { href: "/saved", label: "Library" },
        ]}
      />

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-md-surface">
        {/* `useSearchParams` in BuildPath opts this subtree into client-side
            rendering; without the boundary the whole route would be forced
            dynamic at build time. */}
        <Suspense fallback={null}>
          <BuildPath />
        </Suspense>
      </main>

      <BottomNav />
    </>
  );
}
