"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AnimatePresence } from "framer-motion";
import { BLOOM_LAYER } from "./layers";
import type { Mesh, MeshStandardMaterial } from "three";
import type { Stage } from "@/types/roadmap";
import type { NodeState } from "@/components/ui/ProgressBadge";
import { NodeCard } from "@/components/ui/NodeCard";
import { THEME } from "@/lib/theme";

const COLOR_BY_STATE: Record<NodeState, string> = {
  locked: THEME.status.locked,
  active: THEME.status.active,
  completed: THEME.status.complete,
};

interface NodeProps {
  stage: Stage;
  state: NodeState;
  isFocused: boolean;
  onSelect: (stage: Stage) => void;
  roadmapId: string;
  topic: string;
}

/**
 * A single 3D checkpoint. "learn" stages render as an Icosahedron, "practice"
 * stages (LeetCode/CodeChef/HackerRank-backed) render as a Sphere — the
 * spec's "visually distinct shape" requirement. Color reflects unlock state;
 * locked nodes are dimmed/low-opacity and skip the bloom-selective layer so
 * postprocessing only highlights active/completed checkpoints.
 */
export function Node({ stage, state, isFocused, onSelect, roadmapId, topic }: NodeProps) {
  const meshRef = useRef<Mesh>(null);
  const color = COLOR_BY_STATE[state];
  const locked = state === "locked";

  // Selective bloom (postprocessing) only renders objects on BLOOM_LAYER —
  // locked nodes are excluded so the bloom pass never highlights them.
  useEffect(() => {
    if (!meshRef.current) return;
    if (locked) meshRef.current.layers.disable(BLOOM_LAYER);
    else meshRef.current.layers.enable(BLOOM_LAYER);
  }, [locked]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = state === "active" ? 0.4 + Math.sin(clock.elapsedTime * 2) * 0.25 : state === "completed" ? 0.9 : 0.05;
    const material = meshRef.current.material as MeshStandardMaterial;
    material.emissiveIntensity = pulse;

    if (isFocused) {
      meshRef.current.scale.setScalar(1.15 + Math.sin(clock.elapsedTime * 3) * 0.03);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={stage.position} onClick={() => !locked && onSelect(stage)}>
      <mesh ref={meshRef}>
        {stage.type === "practice" ? (
          <sphereGeometry args={[0.4, 24, 24]} />
        ) : (
          <icosahedronGeometry args={[0.45, 0]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={locked ? 0.35 : 1}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <pointLight color={color} intensity={locked ? 0 : 1.2} distance={4} />

      <AnimatePresence>
        {isFocused && !locked && (
          <Html transform occlude distanceFactor={8} position={[1.2, 0, 0]} zIndexRange={[10, 0]}>
            <NodeCard stage={stage} state={state} roadmapId={roadmapId} topic={topic} compact />
          </Html>
        )}
      </AnimatePresence>
    </group>
  );
}
