"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAdminStats } from "@/hooks/useAdminQuery";
import { AdminOverview } from "./AdminOverview";
import { AdminUsers } from "./AdminUsers";
import { AdminRoadmaps } from "./AdminRoadmaps";
import { AdminResources } from "./AdminResources";
import { AdminLogs } from "./AdminLogs";
import { RecordListSkeleton } from "./AdminPrimitives";
import { StateView } from "@/components/ui/StateView";
import { ApiClientError } from "@/lib/api-client";
import { clsx } from "@/lib/clsx";

type TabId = "overview" | "users" | "courses" | "resources" | "logs";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "courses", label: "Courses" },
  { id: "resources", label: "Resources" },
  { id: "logs", label: "Logs" },
];

/**
 * The admin area.
 *
 * Access is decided **twice, independently**. The client checks `user.role` to
 * decide what to render, and every `/admin` endpoint re-reads the role from
 * the database on each request. The client check exists so an ordinary learner
 * who guesses the URL gets an explanation instead of five failing requests —
 * it is not what keeps them out. A forged `role` in local state buys nothing:
 * every panel below would render empty, because the data never arrives.
 *
 * Authorization is confirmed with the stats request rather than trusted from
 * the store, so a demoted admin whose cached session still claims the role
 * lands on the "not an admin" screen rather than on a dashboard full of
 * errors.
 */
export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [tab, setTab] = useState<TabId>("overview");

  // Doubles as the authorization probe: its 403 is what tells us the server
  // disagrees with whatever the client state says.
  const stats = useAdminStats();

  if (isInitializing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <RecordListSkeleton count={2} />
      </div>
    );
  }

  if (!user) {
    return (
      <StateView
        title="Sign in to continue"
        description="The admin area is only reachable by an account with admin access."
        primary={{ label: "Sign in", href: `/auth/login?next=${encodeURIComponent("/admin")}` }}
        secondary={{ label: "Go to the catalog", href: "/courses" }}
      />
    );
  }

  const forbidden =
    stats.isError && stats.error instanceof ApiClientError && stats.error.status === 403;

  if (forbidden || (user.role !== "admin" && !stats.isLoading && stats.isError)) {
    return (
      <StateView
        title="You do not have admin access"
        description="This area is limited to admin accounts. If you think that is wrong, ask an existing admin to grant your account access."
        primary={{ label: "Go to your library", href: "/saved" }}
        secondary={{ label: "Browse courses", href: "/courses" }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="min-w-0">
        <p className="text-label-lg uppercase tracking-wider text-md-primary">Administration</p>
        <h1 className="mt-2 text-headline-md text-md-on-surface sm:text-display-sm">
          Platform dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-md-on-surface-variant">
          Signed in as {user.email}. Every action that changes an account or a course is recorded
          in the audit log under your name.
        </p>
      </header>

      {/* Material 3 primary tabs. Scrollable on a phone rather than wrapped —
          five labels will not fit on one 360px line, and a wrapped tab row
          reads as two separate controls. */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="-mx-4 mt-8 flex snap-x gap-1 overflow-x-auto border-b border-md-outline-variant px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`admin-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`admin-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={clsx(
                "state-layer press relative min-h-touch flex-none snap-start px-4 text-label-lg",
                "transition-colors duration-fast ease-standard",
                selected ? "text-md-primary" : "text-md-on-surface-variant"
              )}
            >
              {t.label}
              {/* The 3dp active indicator — the non-colour cue for the
                  selected tab, alongside aria-selected. */}
              <span
                aria-hidden
                className={clsx(
                  "absolute inset-x-2 bottom-0 h-[3px] rounded-t-full transition-opacity duration-fast",
                  selected ? "bg-md-primary opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`admin-panel-${tab}`}
        aria-labelledby={`admin-tab-${tab}`}
        tabIndex={0}
        className="mt-8 min-w-0 focus-visible:outline-none"
      >
        {tab === "overview" && <AdminOverview />}
        {tab === "users" && <AdminUsers />}
        {tab === "courses" && <AdminRoadmaps />}
        {tab === "resources" && <AdminResources />}
        {tab === "logs" && <AdminLogs />}
      </div>
    </div>
  );
}
