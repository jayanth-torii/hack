"use client";

import { useEffect, useRef, useState } from "react";
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

  // Six tabs do not fit a 360px viewport, so the strip scrolls inside its own
  // rail. Scrolling is done on the rail itself (never `scrollIntoView`, which
  // would also move the page) so selecting a tab off-screen — by click or by
  // arrow key — brings it into view without the page ever scrolling sideways.
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const rail = railRef.current;
    const node = tabRefs.current[tab];
    if (!rail || !node) return;

    const pad = 12;
    const left = node.offsetLeft;
    const right = left + node.offsetWidth;
    const viewLeft = rail.scrollLeft;
    const viewRight = viewLeft + rail.clientWidth;

    let next: number;
    if (left < viewLeft + pad) next = left - pad;
    else if (right > viewRight - pad) next = right - rail.clientWidth + pad;
    else return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: Math.max(0, next), behavior: reduce ? "auto" : "smooth" });
  }, [tab]);

  if (isInitializing || !user) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-md-surface">
        <div
          role="status"
          aria-label="Loading your profile"
          className="h-10 w-10 animate-spin rounded-full border-2 border-md-primary/30 border-t-md-primary"
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
    // `confirm` renders through components/md/Dialog — a centred dialog on
    // desktop, a full-screen page with a back arrow on phones. No popup.
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
        {/* Icon-only below md: a 64px bar at 360px cannot hold two labelled
            buttons, a title and the theme toggle. The accessible name carries
            the meaning at every width. */}
        <button
          type="button"
          onClick={() => setTab("settings")}
          aria-label="Edit profile"
          className="press state-layer flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-full bg-md-primary px-3 text-label-lg text-md-on-primary md:min-w-0 md:px-4"
        >
          <PencilIcon className="h-4 w-4" />
          <span className="hidden md:inline">Edit profile</span>
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="Sign out"
          className="press state-layer flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-full border border-md-outline px-3 text-label-lg text-md-on-surface-variant md:min-w-0 md:px-4"
        >
          <SignOutIcon className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </AppBar>

      <main id="main" className="pt-app-bar pb-nav min-h-screen-safe bg-md-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {/* ── Header card — M3 outlined card ───────────────────────── */}
          <header className="relative overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container-low">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_20%,rgb(var(--md-primary)/0.10),transparent_65%)]"
            />
            <div className="relative grid items-center gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                {/* 80px of avatar plus a 20px gap left ~190px for the name at
                    360px; 64/16 gives the identity block the room it needs.
                    sm+ is unchanged. */}
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-md-primary-container text-headline-sm font-medium text-md-on-primary-container sm:h-24 sm:w-24 sm:text-display-sm">
                  {profile.data?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.data.avatar}
                      alt=""
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <Eyebrow>Your profile</Eyebrow>
                  <h1 className="mt-1.5 break-words text-headline-sm font-medium text-md-on-surface sm:text-headline-md">
                    {displayName}
                  </h1>
                  <p className="mt-1 truncate text-body-md text-md-on-surface-variant">
                    {user.email}
                  </p>
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm text-md-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-md-primary" />
                      Joined {formatJoined(profile.data?.joinedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-md-success" />
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

          {/* ── Tabs — M3 primary tabs ───────────────────────────────── */}
          {/* Fixed tabs when the six fit (`flex-[1_0_auto]` stretches them to
              fill the row), scrollable when they don't — which is every phone.
              The scrollbar is hidden but the rail still scrolls, and the effect
              above keeps the selected tab in view. */}
          <div
            ref={railRef}
            role="tablist"
            aria-label="Profile sections"
            className="relative mt-5 flex overflow-x-auto overscroll-x-contain border-b border-md-outline-variant [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onKeyDown={(event) => {
              const i = TABS.findIndex((t) => t.key === tab);
              let nextKey: TabKey | null = null;
              if (event.key === "ArrowRight") nextKey = TABS[(i + 1) % TABS.length]!.key;
              else if (event.key === "ArrowLeft")
                nextKey = TABS[(i - 1 + TABS.length) % TABS.length]!.key;
              else if (event.key === "Home") nextKey = TABS[0]!.key;
              else if (event.key === "End") nextKey = TABS[TABS.length - 1]!.key;
              if (!nextKey) return;
              event.preventDefault();
              setTab(nextKey);
              // Roving tabindex: the old tab becomes tabIndex -1, so focus has
              // to follow the selection or the keyboard user is stranded.
              tabRefs.current[nextKey]?.focus({ preventScroll: true });
            }}
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                ref={(node) => {
                  tabRefs.current[key] = node;
                }}
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls={`panel-${key}`}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                className={clsx(
                  "state-layer relative flex flex-[1_0_auto] flex-col items-center justify-center gap-1",
                  "min-h-[4rem] whitespace-nowrap px-4 py-2 text-title-sm",
                  "transition-colors duration-fast ease-standard",
                  tab === key ? "text-md-primary" : "text-md-on-surface-variant"
                )}
              >
                <Icon className="h-6 w-6 shrink-0" />
                {label}
                {tab === key && (
                  // M3's 3dp active indicator, the width of the label, with the
                  // two top corners rounded.
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-md-primary"
                  />
                )}
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
                <p className="text-body-md text-md-on-surface-variant">
                  Your full library — with filters, sorting and favourites — lives on the{" "}
                  <Link href="/saved" className="font-medium text-md-primary hover:underline">
                    saved roadmaps
                  </Link>{" "}
                  page.
                </p>
                <RoadmapProgressList
                  roadmaps={saved.data ?? []}
                  summary={summary.data ?? []}
                  isPending={saved.isPending}
                  isError={saved.isError}
                  onRetry={() => void saved.refetch()}
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
