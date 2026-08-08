"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { Badge } from "@/components/ui/Badge";
import { Illustration } from "@/components/ui/Illustration";
import { toast } from "@/components/ui/toast";

/**
 * Grid of a student's past topic searches. Shows a confirmation banner when
 * the user just finished the Google Calendar OAuth connect flow (the backend
 * redirects back here with ?calendarConnected=1).
 */
export function SavedRoadmaps() {
  const { data, isLoading, isError } = useSavedRoadmaps();
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("calendarConnected") === "1";

  useEffect(() => {
    if (justConnected) {
      toast.success("Google Calendar connected", "Send any roadmap to your calendar.");
    }
  }, [justConnected]);

  if (isLoading) {
    return <p className="px-6 py-16 text-center text-muted">Loading your saved roadmaps…</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <Illustration name="no-data" className="h-40 w-56" imgClassName="object-contain p-2" />
        <p className="mt-6 text-muted">Log in to see your saved roadmaps.</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <Illustration
          name="save-to-bookmarks"
          className="h-48 w-72"
          imgClassName="object-contain p-2"
          glow
        />
        <p className="mt-8 text-muted">No saved roadmaps yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-bold tracking-tight text-on-accent transition-colors hover:bg-accent/90"
        >
          Generate one →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex items-end gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/saved_1.png" alt="" className="h-24 w-24 rounded-2xl object-cover shadow-lg shadow-accent/10" />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-paper">
              Your saved roadmaps
            </h1>
          </div>
        </div>
        <Illustration
          name="adventure-map"
          className="hidden h-28 w-52 sm:block"
          imgClassName="object-contain"
        />
      </div>

      {justConnected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Google Calendar connected — send any roadmap to your calendar.
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((roadmap, i) => (
          <motion.div
            key={roadmap.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={`/roadmap/${roadmap.id}`}
              className="group block rounded-2xl border border-line/10 bg-card/50 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10"
            >
              <h3 className="font-display text-base font-semibold text-paper transition-colors group-hover:text-accent">
                {roadmap.topic}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {roadmap.stages.length} stages · created{" "}
                {new Date(roadmap.createdAt).toLocaleDateString()}
              </p>
              <Badge tone="brand" className="mt-3">
                Continue
              </Badge>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
