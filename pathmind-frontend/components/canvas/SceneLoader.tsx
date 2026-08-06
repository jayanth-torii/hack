"use client";

import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Branded loading overlay driven by drei's useProgress (tracks Canvas asset
 * loading — textures, Environment HDRI, etc). Lives OUTSIDE the <Canvas> (it
 * reads a zustand store drei maintains globally, so this is plain DOM/HTML
 * and safe to render before the Canvas even mounts).
 */
export function SceneLoader() {
  const { progress, active } = useProgress();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface-950"
        >
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-surface-800">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-400 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-400">Building your 3D roadmap… {Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Static fallback shown while the Canvas chunk itself is still downloading (next/dynamic loading prop). */
export function CanvasLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface-950">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      <p className="text-sm text-slate-400">Loading 3D journey…</p>
    </div>
  );
}
