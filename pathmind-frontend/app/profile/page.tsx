"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { Badge } from "@/components/ui/Badge";
import { Illustration } from "@/components/ui/Illustration";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

/**
 * Personal profile page: avatar + email, learning stats (saved roadmaps,
 * total stages, topics), the user's saved roadmap cards, and sign-out.
 * Auth-guarded — redirects to /auth/login when signed out.
 */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);

  const saved = useSavedRoadmaps();
  const roadmaps = saved.data ?? [];

  const totalStages = roadmaps.reduce((sum, r) => sum + r.stages.length, 0);

  useEffect(() => {
    if (!isInitializing && !user) router.replace("/auth/login");
  }, [isInitializing, user, router]);

  if (isInitializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  const displayName =
    user.name ??
    ((user.email.split("@")[0] ?? "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Learner");

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
    toast.success("Signed out", "See you soon! 👋");
    router.push("/");
  };

  return (
    <div className="relative min-h-screen bg-ink">
      {/* Ambient glows + noise (home-theme background) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(46rem_30rem_at_15%_-5%,rgba(201,243,29,0.1),transparent_60%),radial-gradient(40rem_30rem_at_100%_15%,rgba(56,189,248,0.09),transparent_60%)]"
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-noise opacity-[0.04]" />
      <GeometryShapes variant="footer" />

      {/* Glassy header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/60 backdrop-blur-2xl backdrop-saturate-150">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        />
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Vidhyora home">
            <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Vidhyora
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 md:flex" aria-label="Profile">
              <Link href="/" className="text-sm text-subtle transition-colors hover:text-accent">
                Home
              </Link>
              <Link href="/saved" className="text-sm text-subtle transition-colors hover:text-accent">
                Saved roadmaps
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32">
        {/* Profile card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-line/10 bg-card/60 p-8 backdrop-blur-xl sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(201,243,29,0.18),transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_65%)]"
          />

          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-accent/90 to-brand-400/80 shadow-lg shadow-accent/25">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-bold text-on-accent">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
                  {"// Your profile"}
                </p>
                <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1.5 text-muted">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-none items-center gap-6">
              <Illustration
                name="profile"
                className="hidden h-24 w-44 lg:block"
                imgClassName="object-contain p-1"
              />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-line/15 px-5 py-2.5 text-sm font-medium text-subtle transition-colors hover:border-rose-400/50 hover:text-rose-400"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Stats */}
          <dl className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: roadmaps.length, label: "Saved roadmaps", suffix: roadmaps.length === 1 ? "" : "s" },
              { value: totalStages, label: "Stages unlocked across", suffix: totalStages === 1 ? " roadmap" : " roadmaps" },
              { value: new Set(roadmaps.map((r) => r.topic)).size, label: "Topics explored", suffix: "" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                className="rounded-2xl border border-line/10 bg-ink/40 p-5"
              >
                <dd className="font-display text-3xl font-semibold text-accent">
                  {stat.value}
                  <span className="text-base text-muted">{stat.suffix}</span>
                </dd>
                <dt className="mt-1 text-xs text-muted">{stat.label}</dt>
              </motion.div>
            ))}
          </dl>
        </motion.section>

        {/* Saved roadmaps */}
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
                {"// Continue learning"}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-paper">
                Your saved roadmaps
              </h2>
            </div>
            <Link
              href="/"
              className="hidden text-sm text-subtle transition-colors hover:text-accent sm:block"
            >
              Generate a new one →
            </Link>
          </div>

          {saved.isLoading ? (
            <p className="py-10 text-center text-muted">Loading your roadmaps…</p>
          ) : roadmaps.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-line/15 bg-card/30 px-6 py-16 text-center">
              <Illustration
                name="save-to-bookmarks"
                className="h-40 w-64"
                imgClassName="object-contain p-2"
                glow
              />
              <p className="mt-6 text-muted">No saved roadmaps yet.</p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-bold tracking-tight text-on-accent transition-colors hover:bg-accent/90"
              >
                Build your first path
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roadmaps.map((roadmap, i) => (
                <motion.div
                  key={roadmap.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={`/roadmap/${roadmap.id}`}
                    className="group block rounded-2xl border border-line/10 bg-card/50 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-paper transition-colors group-hover:text-accent">
                        {roadmap.topic}
                      </h3>
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line/15 text-muted transition-all group-hover:border-accent/50 group-hover:text-accent"
                      >
                        →
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{roadmap.stages.length} stages</Badge>
                      <span className="text-xs text-muted">
                        {new Date(roadmap.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
