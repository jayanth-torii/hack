"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useProfile, useProgressSummary } from "@/hooks/useProfileQuery";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { AppBar } from "@/components/ui/AppBar";
import { BottomNav } from "@/components/ui/BottomNav";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
import { clsx } from "@/lib/clsx";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { RoadmapProgressList } from "@/components/profile/RoadmapProgressList";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { ProfileActivity } from "@/components/profile/ProfileActivity";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckCircleIcon,
  GearIcon,
  GridIcon,
  HistoryIcon,
  LayersIcon,
  MedalIcon,
  PencilIcon,
  SignOutIcon,
} from "@/components/profile/ProfileIcons";

type TabKey = "overview" | "roadmaps" | "certificates" | "progress" | "activity" | "settings";

const TABS: { key: TabKey; label: string; icon: typeof GridIcon }[] = [
  { key: "overview", label: "Overview", icon: GridIcon },
  { key: "roadmaps", label: "Roadmaps", icon: LayersIcon },
  { key: "certificates", label: "Certificates", icon: MedalIcon },
  { key: "progress", label: "Progress", icon: ChartIcon },
  { key: "activity", label: "Activity", icon: HistoryIcon },
  { key: "settings", label: "Settings", icon: GearIcon },
];

function formatJoined(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Learner profile.
 *
 * Auth-guarded, with six tabs over the `/me/*` endpoints. Everything shown here
 * is server data — there are no illustrative numbers on this screen, so a panel
 * with nothing behind it renders an empty state rather than a plausible figure.
 */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);

  const [tab, setTab] = useState<TabKey>("overview");

  const profile = useProfile();
  const summary = useProgressSummary();
  const saved = useSavedRoadmaps();

  useEffect(() => {
    if (!isInitializing && !user) router.replace("/auth/login");
  }, [isInitializing, user, router]);

  if (isInitializing || !user) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-ink">
        <div
          role="status"
          aria-label="Loading your profile"
          className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
        />
      </div>
    );
  }

  // Password accounts have no name, so the email local-part is the only
  // identifier available — tidied rather than shown raw.
  const displayName =
    profile.data?.name ??
    user.name ??
    ((user.email.split("@")[0] ?? "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Learner");

  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out of Vidhyora?",
      message: "Your roadmaps and progress are saved — you can pick up right where you left off.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      tone: "danger",
    });
    if (!ok) return;
    await logout();
    toast.success("Signed out", "See you soon!");
    router.replace("/");
  };

  return (
    <>
      <AppBar title="Profile" back="/">
        {/* Icon-only below md: a 56px bar at 360px cannot hold two labelled
            buttons, a title and the theme toggle. The accessible name carries
            the meaning at every width. */}
        <button
          type="button"
          onClick={() => setTab("settings")}
          aria-label="Edit profile"
          className="press flex min-h-touch items-center gap-2 rounded-full bg-accent px-3 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover md:px-4"
        >
          <PencilIcon className="h-4 w-4" />
          <span className="hidden md:inline">Edit profile</span>
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="Sign out"
          className="press flex min-h-touch items-center gap-2 rounded-full border border-line/20 px-3 text-sm font-semibold text-subtle transition-colors duration-fast hover:border-danger/50 hover:text-danger md:px-4"
        >
          <SignOutIcon className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </AppBar>

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-ink">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {/* ── Header card ──────────────────────────────────────────── */}
          <header className="relative overflow-hidden rounded-xl border border-accent/25 bg-card/40 shadow-[0_0_60px_-24px_rgb(var(--color-accent)/0.65)] backdrop-blur-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_20%,rgb(var(--color-accent)/0.18),transparent_65%)]"
            />
            <div className="relative grid items-center gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-start gap-5">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover font-display text-3xl font-bold text-on-accent shadow-e2 sm:h-24 sm:w-24 sm:text-4xl">
                {profile.data?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.data.avatar}
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  initial
                )}
              </span>

              <div className="min-w-0 flex-1">
                <Eyebrow>Your profile</Eyebrow>
                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-accent-text" />
                    Joined {formatJoined(profile.data?.joinedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
                    Learner
                  </span>
                </p>
              </div>

              </div>

              {/* Decorative only — the scene repeats information already in the
                  copy, so it is hidden from assistive tech. */}
              <div aria-hidden data-scene-stage className="hidden shrink-0 lg:block">
                <Image
                  src="/3d/how-header.png"
                  alt=""
                  width={846}
                  height={356}
                  sizes="28vw"
                  className="h-auto w-72 select-none opacity-90 xl:w-80"
                />
              </div>
            </div>
          </header>

          {/* ── Tabs ─────────────────────────────────────────────────── */}
          <div
            role="tablist"
            aria-label="Profile sections"
            className="rail mt-5 rounded-xl border border-line/12 bg-card/30 p-1.5 backdrop-blur-sm"
            onKeyDown={(event) => {
              const i = TABS.findIndex((t) => t.key === tab);
              if (event.key === "ArrowRight") {
                event.preventDefault();
                setTab(TABS[(i + 1) % TABS.length]!.key);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                setTab(TABS[(i - 1 + TABS.length) % TABS.length]!.key);
              }
            }}
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls={`panel-${key}`}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                className={clsx(
                  "press inline-flex min-h-touch items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-fast",
                  tab === key
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-paper"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Panels ───────────────────────────────────────────────── */}
          <div
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
            className="mt-5 focus-visible:outline-none"
          >
            {tab === "overview" && <ProfileOverview summary={summary.data ?? []} />}

            {tab === "roadmaps" && (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Your full library — with filters, sorting and favourites — lives on the{" "}
                  <Link href="/saved" className="font-semibold text-accent-text hover:underline">
                    saved roadmaps
                  </Link>{" "}
                  page.
                </p>
                <RoadmapProgressList
                  roadmaps={saved.data ?? []}
                  summary={summary.data ?? []}
                  isPending={saved.isPending}
                />
              </div>
            )}

            {tab === "certificates" && <ProfileCertificates />}
            {tab === "progress" && <ProfileProgress />}
            {tab === "activity" && <ProfileActivity />}
            {tab === "settings" && <ProfileSettings />}
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
