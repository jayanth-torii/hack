import type { Metadata } from "next";
import { CourseCatalog } from "@/components/courses/CourseCatalog";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "Course catalog",
  description:
    "Browse curated, sequenced learning courses on Vidhyora. Every stage unlocks in order and links to free resources that have been checked.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  return (
    <>
      {/* A top-level destination, so no back affordance — the bottom nav is
          the way between this and the other destinations. */}
      <AppBar
        actions={[
          { href: "/courses/build", label: "Build your own" },
          { href: "/saved", label: "Library" },
        ]}
      />

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-md-surface">
        <CourseCatalog />
      </main>

      <BottomNav />
    </>
  );
}
