"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRoadmap, useExportCalendar } from "@/hooks/useRoadmapQuery";
import { useGoogleCalendarStatus, googleConnectUrl } from "@/hooks/useGoogleCalendar";
import { useAuthStore } from "@/store/authStore";
import { GeometryShapes } from "@/components/home/GeometryShapes";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";
import { toast } from "@/components/ui/toast";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Day 1 starts tomorrow at 18:00 — matches the backend icsGenerator. */
function dayStart(offsetDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1 + offsetDays);
  d.setHours(18, 0, 0, 0);
  return d;
}

export default function CalendarExportPage() {
  const { id } = useParams<{ id: string }>();
  const roadmapQuery = useRoadmap(id);
  const exportCalendar = useExportCalendar();
  const reduce = useReducedMotion();
  const user = useAuthStore((state) => state.user);
  const calendarStatus = useGoogleCalendarStatus();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null);
  const [exporting, setExporting] = useState<"google" | "ics" | null>(null);

  const connected = calendarStatus.data === true;
  const justConnected = searchParams.get("calendarConnected") === "1";
  const loggedIn = Boolean(user);

  // Celebrate the OAuth round-trip landing back on this page.
  useEffect(() => {
    if (justConnected) {
      toast.success("Google Calendar connected", "Send this plan to your calendar anytime.");
    }
  }, [justConnected]);

  const days = useMemo(() => {
    const timeline = roadmapQuery.data?.suggestedTimeline ?? [];
    return timeline.map((day, i) => {
      const date = dayStart(i);
      return {
        day,
        date,
        dateLabel: `${DAY_LABELS[date.getDay()]}, ${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`,
      };
    });
  }, [roadmapQuery.data]);

  if (roadmapQuery.isLoading || !roadmapQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  const roadmap = roadmapQuery.data;
  const totalDays = roadmap.suggestedTimeline.length;
  const totalHours = roadmap.suggestedTimeline.reduce((sum, d) => sum + Math.max(d.tasks.length, 1), 0);

  const handleExport = async (format: "google" | "ics") => {
    setResult(null);
    setExporting(format);
    try {
      const res = await exportCalendar.mutateAsync({ roadmapId: roadmap.id, topic: roadmap.topic, format });
      if (res.format === "ics") {
        toast.success("Calendar downloaded", "vidhyora-plan.ics — import it into any calendar app.");
      } else {
        toast.success("Sent to Google Calendar", `${res.eventsCreated} events added to your calendar.`);
      }
    } catch {
      const text =
        format === "google"
          ? "Google Calendar isn't connected yet — connect it below, or use the .ics download."
          : "Export failed. Please try again.";
      toast.error(format === "google" ? "Couldn't reach Google Calendar" : "Export failed");
      // Keep the inline guidance (it carries the connect hint for Google).
      setResult({ ok: false, text });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-ink">
      {/* Ambient glows + noise + geometry (site theme) */}
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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Vidhyora home">
            <span className="logo-chip flex h-9 w-9 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vidhyora-logo.png" alt="" width={36} height={36} className="h-9 w-9" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Vidhyora
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href={`/roadmap/${id}`}
              className="text-subtle transition-colors hover:text-accent"
            >
              Journey
            </Link>
            <Link
              href={`/roadmap/${id}/dashboard`}
              className="text-subtle transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link href="/saved" className="text-subtle transition-colors hover:text-accent">
              Saved
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-32">
        {/* ── Hero band ── */}
        <motion.section
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-text">
              {"// Your study calendar"}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-paper sm:text-5xl">
              {roadmap.topic}
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              A day-by-day plan starting tomorrow. Push it to Google Calendar or
              download it as an .ics file — every app can import that.
            </p>

            <dl className="mt-7 flex flex-wrap gap-3">
              {[
                { value: `${totalDays}`, label: "study days" },
                { value: "1hr", label: "per day" },
                { value: `~${totalHours}h`, label: "total focus time" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line/10 bg-card/50 px-4 py-3 backdrop-blur"
                >
                  <dd className="font-display text-xl font-semibold text-accent">{stat.value}</dd>
                  <dt className="mt-0.5 text-[11px] text-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Export CTAs */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="flex w-full flex-col gap-3 lg:w-auto"
          >
            {justConnected && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs text-emerald-300"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Google Calendar connected — you&apos;re all set.
              </motion.p>
            )}

            {connected ? (
              <button
                type="button"
                onClick={() => handleExport("google")}
                disabled={exporting !== null}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-white px-7 py-3.5 text-sm font-bold tracking-tight text-[#1d1d1f] shadow-lg shadow-black/15 ring-1 ring-inset ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 active:translate-y-0 disabled:opacity-60"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.05] to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                {exporting === "google" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1d1d1f]/25 border-t-[#1d1d1f]" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path fill="#4285F4" d="M21.8 8.2 15.8 2.2c-.13-.13-.31-.2-.49-.2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8.69c0-.18-.07-.36-.2-.49z" />
                    <path fill="#fff" d="M11.06 16.51 8.1 13.55c-.2-.2-.2-.51 0-.71l.71-.71c.2-.2.51-.2.71 0l1.55 1.55 3.5-3.5c.2-.2.51-.2.71 0l.71.71c.2.2.2.51 0 .71l-4.22 4.21c-.19.19-.5.19-.71 0z" />
                  </svg>
                )}
                {exporting === "google" ? "Sending…" : "Send to Google Calendar"}
              </button>
            ) : loggedIn ? (
              <a
                href={googleConnectUrl(`/roadmap/${id}/calendar`)}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-bold tracking-tight text-on-accent shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                Connect Google Calendar
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => handleExport("ics")}
              disabled={exporting !== null}
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border border-line/15 bg-card/60 px-7 py-3.5 text-sm font-semibold text-subtle backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-lg hover:shadow-accent/10 active:translate-y-0 disabled:opacity-60"
            >
              {exporting === "ics" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line/40 border-t-accent" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3.5V15m0 0 4.5-4.5M12 15l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              Download .ics
            </button>
            {result && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "max-w-xs rounded-xl px-4 py-2.5 text-xs",
                  result.ok
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                )}
              >
                {result.text}
              </motion.p>
            )}

            <Illustration
              name="events-calendar"
              className="mt-4 hidden h-40 w-64 lg:block"
              imgClassName="object-contain"
            />
          </motion.div>
        </motion.section>

        {/* ── Day timeline ── */}
        <section className="relative mt-20">
          {/* spine */}
          <motion.div
            aria-hidden
            initial={reduce ? undefined : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-accent via-brand-400/60 to-transparent md:left-1/2"
          />
          <div
            aria-hidden
            className="absolute left-5 top-0 h-full w-px -translate-x-1/2 blur-[2px] md:left-1/2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(201,243,29,0.6), rgba(56,189,248,0.3), transparent)",
            }}
          />

          <ol className="space-y-8">
            {days.map(({ day, date, dateLabel }, i) => {
              const even = i % 2 === 0;
              return (
                <motion.li
                  key={day.day}
                  initial={reduce ? undefined : { opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.55, delay: 0.04, ease: "easeOut" }}
                  className="relative md:grid md:grid-cols-2 md:gap-14"
                >
                  {/* node marker */}
                  <div className="absolute left-5 top-7 z-10 -translate-x-1/2 md:left-1/2">
                    <span className="relative block h-4 w-4">
                      {!reduce && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
                      )}
                      <span className="absolute inset-0 rounded-full border-2 border-accent bg-ink shadow-[0_0_12px_rgba(201,243,29,0.6)]" />
                    </span>
                  </div>

                  {/* card side */}
                  <div
                    className={clsx(
                      "pl-12 md:pl-0",
                      even ? "md:col-start-1 md:pr-3" : "md:col-start-2 md:pl-3"
                    )}
                  >
                    <article className="group relative overflow-hidden rounded-3xl border border-line/12 bg-card/70 p-6 shadow-xl shadow-black/25 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-accent/5">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(201,243,29,0.1),transparent_65%)]"
                      />

                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent">
                              {day.day}
                            </span>
                            <div>
                              <p className="font-display text-lg font-semibold tracking-tight text-paper">
                                Day {day.day}
                              </p>
                              <p className="text-xs text-muted">{dateLabel}</p>
                            </div>
                          </div>
                        </div>
                        <span className="flex flex-none items-center gap-1.5 rounded-full border border-line/15 px-3 py-1 text-[11px] font-medium text-subtle">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                          {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · 1hr
                        </span>
                      </div>

                      <ul className="relative mt-5 space-y-2">
                        {day.tasks.map((task) => (
                          <li
                            key={task}
                            className="flex items-start gap-3 rounded-xl border border-line/10 bg-ink/40 px-3.5 py-2.5 text-sm text-subtle transition-colors group-hover:border-line/15"
                          >
                            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border border-line/20 text-accent">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="line-clamp-2">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>

                  {/* empty opposite column on desktop */}
                  <div
                    aria-hidden
                    className={clsx(
                      "hidden md:block",
                      even ? "md:col-start-2" : "md:col-start-1 md:row-start-1"
                    )}
                  />
                </motion.li>
              );
            })}
          </ol>

          {/* End cap */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-14 flex flex-col items-center gap-4 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-paper">
                {totalDays} days planned
              </p>
              <p className="mt-1 text-sm text-muted">
                Consistent 1-hour blocks build real momentum.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
