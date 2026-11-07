"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { Badge } from "@/components/ui/Badge";
import { Illustration } from "@/components/ui/Illustration";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { toast } from "@/components/ui/toast";

/**
 * The learner's library of past topic searches.
 *
 * All four screen states are implemented here — skeleton while loading, a
 * guided empty state, a recoverable error state, and the populated grid.
 * A confirmation banner appears when the user has just completed the Google
 * Calendar OAuth round-trip (the backend redirects back with
 * ?calendarConnected=1).
 */
export function SavedRoadmaps() {
  const { data, isLoading, isError, refetch } = useSavedRoadmaps();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const justConnected = searchParams.get("calendarConnected") === "1";

  useEffect(() => {
    if (justConnected) {
      toast.success("Google Calendar connected", "Send any roadmap to your calendar.");
    }
  }, [justConnected]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <CardGridSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <StateView
        tone="error"
        title="We couldn't reach your library"
        description="You may be signed out, or the connection dropped. Sign in again, or retry — nothing has been lost."
        illustration="no-data"
        primary={{ label: "Try again", onClick: () => void refetch() }}
        secondary={{ label: "Log in", href: "/auth/login" }}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <StateView
        title="Your library is empty"
        description="Search any topic on the home page and Vidhyora builds a difficulty-sequenced roadmap for it. Every roadmap you generate lands here."
        illustration="save-to-bookmarks"
        primary={{ label: "Build your first roadmap", href: "/" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* ── Screen header ──
          Stacks on phones; the decorative map only appears once there's
          room for it rather than squeezing the title. */}
      <header className="mb-8 flex items-end justify-between gap-6">
        <div className="flex items-center gap-4 sm:items-end sm:gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/saved_1.png"
            alt=""
            className="h-14 w-14 flex-none rounded-md object-cover shadow-e2 sm:h-24 sm:w-24 sm:rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.25em] text-accent-text">
              {"// Library"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Your saved roadmaps
            </h1>
            <p className="mt-1 text-sm text-muted">
              {data.length} {data.length === 1 ? "roadmap" : "roadmaps"}
            </p>
          </div>
        </div>
        <Illustration
          name="adventure-map"
          className="hidden h-28 w-52 lg:block"
          imgClassName="object-contain"
        />
      </header>

      {justConnected && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-2 rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 flex-none"
            aria-hidden
          >
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Google Calendar connected — send any roadmap to your calendar.
        </motion.div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {data.map((roadmap, i) => (
          <motion.li
            key={roadmap.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
          >
            <Link
              href={`/roadmap/${roadmap.id}`}
              className="hover-lift press flex min-h-touch flex-col rounded-md border border-line/10 bg-card/50 p-4 backdrop-blur transition-colors duration-base hover:border-accent/40 sm:p-5"
            >
              <h2 className="font-display text-base font-semibold text-paper transition-colors duration-fast group-hover:text-accent">
                {roadmap.topic}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {roadmap.stages.length} stages ·{" "}
                <time dateTime={new Date(roadmap.createdAt).toISOString()}>
                  {new Date(roadmap.createdAt).toLocaleDateString()}
                </time>
              </p>
              <Badge tone="brand" className="mt-3 self-start">
                Continue
              </Badge>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
