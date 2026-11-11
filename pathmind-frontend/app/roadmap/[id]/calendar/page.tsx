"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useRoadmap, useExportCalendar } from "@/hooks/useRoadmapQuery";
import { useGoogleCalendarStatus, googleConnectUrl } from "@/hooks/useGoogleCalendar";
import { useAuthStore } from "@/store/authStore";
import { AppBar } from "@/components/ui/AppBar";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/Button";
import { Illustration } from "@/components/ui/Illustration";
import { clsx } from "@/lib/clsx";
import { toast } from "@/components/ui/toast";
import { Eyebrow } from "@/components/ui/Eyebrow";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Day 1 starts tomorrow at 18:00 — matches the backend icsGenerator. */
function dayStart(offsetDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1 + offsetDays);
  d.setHours(18, 0, 0, 0);
  return d;
}

/** Google's own calendar mark. The brand hexes are the logo itself, not a
 *  semantic colour, so they stay literal — the surface under them is an M3
 *  role like every other button on the screen. */
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M21.8 8.2 15.8 2.2c-.13-.13-.31-.2-.49-.2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8.69c0-.18-.07-.36-.2-.49z" />
      <path fill="#fff" d="M11.06 16.51 8.1 13.55c-.2-.2-.2-.51 0-.71l.71-.71c.2-.2.51-.2.71 0l1.55 1.55 3.5-3.5c.2-.2.51-.2.71 0l.71.71c.2.2.2.51 0 .71l-4.22 4.21c-.19.19-.5.19-.71 0z" />
    </svg>
  );
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
      <div className="min-h-screen-safe bg-md-surface">
        <AppBar title="Study plan" back />
        <DashboardSkeleton />
        <BottomNav />
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
    // `overflow-hidden` is load-bearing, not decoration: the ambient glows
    // below are deliberately wider than the viewport, and without it they
    // would add horizontal page scroll (CLAUDE.md §3).
    <div className="min-h-screen-safe relative overflow-hidden bg-md-surface">
      {/* Ambient corner light, carried by the vivid brand source — the same
          treatment every landing section uses, so the plan reads as part of
          the same product rather than a plain utility screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 h-[30rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.24),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[38rem] h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgb(var(--md-source)/0.16),transparent_70%)] blur-3xl"
      />

      <AppBar
        title="Study plan"
        back={`/roadmap/${id}`}
        actions={[
          { href: `/roadmap/${id}`, label: "Journey" },
          { href: `/roadmap/${id}/dashboard`, label: "Dashboard" },
          { href: "/saved", label: "Saved" },
        ]}
      />

      <main id="main" className="pt-app-bar pb-nav relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Hero band ── */}
        <motion.section
          initial={reduce ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start justify-between gap-10 pt-6 sm:pt-10 lg:flex-row lg:items-end"
        >
          <div className="max-w-2xl">
            <Eyebrow>Your study calendar</Eyebrow>
            <h1 className="mt-3 break-words text-headline-md text-md-on-surface sm:text-display-sm">
              {roadmap.topic}
            </h1>
            <p className="mt-4 max-w-xl text-body-lg text-md-on-surface-variant">
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
                  className="rounded-lg border border-md-outline-variant/70 bg-md-surface-container-low/70 px-5 py-4 shadow-e1 backdrop-blur-sm"
                >
                  <dd className="text-headline-sm font-medium text-md-primary">{stat.value}</dd>
                  <dt className="mt-1 text-body-sm text-md-on-surface-variant">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Export actions — one filled button (the primary export), the
              other outlined. Neither opens a popup: results land in a toast
              and in the inline message below. */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="flex w-full flex-col gap-3 lg:w-auto"
          >
            {justConnected && (
              <motion.p
                initial={reduce ? undefined : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-sm bg-md-success-container px-4 py-2.5 text-body-sm text-md-on-success-container"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Google Calendar connected — you&apos;re all set.
              </motion.p>
            )}

            {connected ? (
              <Button
                variant="accent"
                onClick={() => handleExport("google")}
                disabled={exporting !== null}
                isLoading={exporting === "google"}
                loadingLabel="Sending…"
              >
                {exporting !== "google" && <GoogleCalendarIcon className="h-5 w-5" />}
                Send to Google Calendar
              </Button>
            ) : loggedIn ? (
              <a
                href={googleConnectUrl(`/roadmap/${id}/calendar`)}
                className="state-layer press inline-flex min-h-touch items-center justify-center gap-2 rounded-full bg-md-primary px-6 text-label-lg font-medium text-md-on-primary transition-colors duration-fast ease-standard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Connect Google Calendar
              </a>
            ) : null}

            <Button
              variant="outlined"
              onClick={() => handleExport("ics")}
              disabled={exporting !== null}
              isLoading={exporting === "ics"}
              loadingLabel="Preparing…"
            >
              {exporting !== "ics" && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3.5V15m0 0 4.5-4.5M12 15l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              Download .ics
            </Button>

            {result && (
              <motion.p
                // An export that failed is an async error: announce it rather
                // than leaving it to be noticed (CLAUDE.md §6).
                role={result.ok ? undefined : "alert"}
                initial={reduce ? undefined : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "max-w-xs rounded-sm px-4 py-2.5 text-body-sm",
                  result.ok
                    ? "bg-md-success-container text-md-on-success-container"
                    : "bg-md-error-container text-md-on-error-container"
                )}
              >
                {result.text}
              </motion.p>
            )}

            {/* Brand art, not a boxed stock vector. The render carries its own
                transparency and sits straight on the surface — the light frame
                this used to need was the reason a white card appeared in the
                middle of a dark screen. */}
            <Illustration
              name="events-calendar"
              glow
              alt=""
              className="mt-6 hidden h-56 w-full max-w-sm self-center lg:block"
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
            className="absolute left-5 top-0 h-full w-px origin-top bg-md-outline-variant md:left-1/2"
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
                  <div aria-hidden className="absolute left-5 top-7 z-10 -translate-x-1/2 md:left-1/2">
                    <span className="block h-4 w-4 rounded-full border-2 border-md-primary bg-md-surface" />
                  </div>

                  {/* card side */}
                  <div
                    className={clsx(
                      "pl-12 md:pl-0",
                      even ? "md:col-start-1 md:pr-3" : "md:col-start-2 md:pl-3"
                    )}
                  >
                    <article className="rounded-lg border border-md-outline-variant bg-md-surface-container-low p-4 sm:p-5">
                      {/* Wraps below ~340px of card width: the time chip is
                          flex-none, so without a wrap it squeezes the date
                          into a two-line column on a 360px phone. */}
                      <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-md-primary-container text-title-md text-md-on-primary-container">
                              {day.day}
                            </span>
                            <div className="min-w-0">
                              <p className="text-title-md font-medium text-md-on-surface">
                                Day {day.day}
                              </p>
                              <p className="text-body-sm text-md-on-surface-variant">{dateLabel}</p>
                            </div>
                          </div>
                        </div>
                        <span className="flex h-8 flex-none items-center gap-1.5 rounded-sm border border-md-outline-variant px-3 text-label-md text-md-on-surface-variant">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                          {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · 1hr
                        </span>
                      </div>

                      <ul className="relative mt-5 space-y-2">
                        {day.tasks.map((task) => (
                          <li
                            key={task}
                            className="flex items-start gap-3 rounded-sm bg-md-surface-container px-3.5 py-2.5 text-body-md text-md-on-surface-variant"
                          >
                            <span className="mt-0.5 flex h-[1.125rem] w-[1.125rem] flex-none items-center justify-center rounded-full border border-md-outline text-md-primary">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            {/* The clamp only earns its keep from `sm`, where
                                the card is wide enough for two lines to hold a
                                whole task; on a 360px phone it would hide the
                                back half of most of them. */}
                            <span className="min-w-0 break-words sm:line-clamp-2">{task}</span>
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
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-md-primary-container text-md-on-primary-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-title-lg font-medium text-md-on-surface">
                {totalDays} days planned
              </p>
              <p className="mt-1 text-body-md text-md-on-surface-variant">
                Consistent 1-hour blocks build real momentum.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
