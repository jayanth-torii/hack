"use client";

import { motion } from "framer-motion";
import type { Roadmap } from "@/types/roadmap";
import { NodeCard } from "@/components/ui/NodeCard";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";

/**
 * Replaces the 3D scroll journey for mobile viewports and
 * prefers-reduced-motion users (spec requirement) — same NodeCard content
 * and the exact same useUnlockLogic hook the 3D view uses, so unlock state
 * and displayed content can never drift between the two.
 */
export function MobileTimeline({ roadmap }: { roadmap: Roadmap }) {
  const { isUnlocked, isCompleted } = useUnlockLogic();
  const stages = [...roadmap.stages].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-white">{roadmap.topic}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {stages.length} sequenced checkpoints — complete each to unlock the next.
        </p>
      </header>

      <ol className="relative border-l border-slate-700 pl-6">
        {stages.map((stage, i) => {
          const state = isCompleted(stage.id) ? "completed" : isUnlocked(stage.id) ? "active" : "locked";
          return (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="relative mb-6"
            >
              <span
                className="absolute -left-[29px] top-2 h-3 w-3 rounded-full"
                style={{
                  background:
                    state === "completed" ? "#22c55e" : state === "active" ? "#38bdf8" : "#475569",
                }}
              />
              <NodeCard stage={stage} state={state} roadmapId={roadmap.id} topic={roadmap.topic} />
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
