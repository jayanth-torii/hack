import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "Admin",
  description: "Vidhyora platform administration.",
  // Keeps the admin area out of search results and the sitemap. It is not a
  // security measure — the API is — but an indexed admin URL is noise at best.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <AppBar title="Admin" back="/saved" actions={[{ href: "/saved", label: "Library" }]} />

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-md-surface">
        <AdminDashboard />
      </main>

      <BottomNav />
    </>
  );
}
