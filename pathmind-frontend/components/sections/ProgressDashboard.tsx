"use client";

import { motion } from "framer-motion";
import type { Roadmap } from "@/types/roadmap";
import { ProgressBadge, type NodeState } from "@/components/ui/ProgressBadge";
import { Badge } from "@/components/ui/Badge";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";
import { useUpdateProgress } from "@/hooks/useRoadmapQuery";
import { Button } from "@/components/ui/Button";

/**
 * Visual overview of completed vs locked stages, with the mark-complete
 * action that unlocks the next difficulty tier — the spec's "progress
 * dashboard" screen. Reuses useUnlockLogic (same source of truth as the 3D
 * view and MobileTimeline) so this can never show a different unlock state.
 */
export function ProgressDashboard({ roadmap }: { roadmap: Roadmap }) {
  const { isUnlocked, isCompleted } = useUnlockLogic();
  const updateProgress = useUpdateProgress();
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);

  const completedCount = stages.filter((s) => isCompleted(s.id)).length;
  const pct = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold text-white">{roadmap.topic} — Progress</h1>
      <p className="mt-1 text-sm text-slate-400">
        {completedCount} of {stages.length} stages completed
      </p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-800">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <ul className="mt-8 space-y-3">
        {stages.map((stage) => {
          const state: NodeState = isCompleted(stage.id)
            ? "completed"
            : isUnlocked(stage.id)
              ? "active"
              : "locked";
          return (
            <li
              key={stage.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-surface-900/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <ProgressBadge state={state} />
                <div>
                  <p className="text-sm font-medium text-white">{stage.title}</p>
                  <p className="text-xs text-slate-500">
                    Stage {stage.order + 1} · {stage.difficulty} · {stage.type}
                  </p>
                </div>
              </div>

              {state === "active" && (
                <Button
                  variant="secondary"
                  isLoading={updateProgress.isPending}
                  onClick={() => updateProgress.mutate({ roadmapId: roadmap.id, stageId: stage.id })}
                >
                  Mark complete
                </Button>
              )}
              {state === "locked" && <Badge tone="neutral">Locked</Badge>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
