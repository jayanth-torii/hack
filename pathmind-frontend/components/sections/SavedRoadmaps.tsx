"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSavedRoadmaps } from "@/hooks/useRoadmapQuery";
import { Badge } from "@/components/ui/Badge";

/**
 * Simple 2D list/grid of a student's past topic searches — no 3D needed
 * here per the spec.
 */
export function SavedRoadmaps() {
  const { data, isLoading, isError } = useSavedRoadmaps();

  if (isLoading) {
    return <p className="px-6 py-16 text-center text-slate-400">Loading your saved roadmaps…</p>;
  }

  if (isError) {
    return (
      <p className="px-6 py-16 text-center text-slate-400">
        Log in to see your saved roadmaps.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-slate-400">
        <p>No saved roadmaps yet.</p>
        <Link href="/" className="mt-2 inline-block text-brand-400 hover:underline">
          Generate one →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold text-white">Your saved roadmaps</h1>
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
              className="block rounded-2xl border border-slate-700/60 bg-surface-900/60 p-5 transition-colors hover:border-brand-400/50"
            >
              <h3 className="font-semibold text-white">{roadmap.topic}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {roadmap.stages.length} stages · created {new Date(roadmap.createdAt).toLocaleDateString()}
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
