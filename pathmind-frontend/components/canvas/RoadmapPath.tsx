"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { CatmullRomCurve3 } from "three";
import type { Roadmap } from "@/types/roadmap";
import { buildRoadmapCurve } from "@/lib/curve";
import { useUnlockLogic } from "@/hooks/useUnlockLogic";
import { useRoadmapStore } from "@/store/roadmapStore";
import { Node } from "./Node";
import { THEME } from "@/lib/theme";

// Only mount nodes within this window of the active stage — caps draw calls
// on long roadmaps per the spec's "virtualize path segments" requirement.
const VIRTUALIZATION_WINDOW = 6;

export function RoadmapPath({ roadmap }: { roadmap: Roadmap }) {
  const activeStageIndex = useRoadmapStore((s) => s.activeStageIndex);
  const setActiveStageIndex = useRoadmapStore((s) => s.setActiveStageIndex);
  const { isUnlocked, isCompleted } = useUnlockLogic();

  const curve = useMemo(() => buildRoadmapCurve(roadmap.stages), [roadmap.stages]);
  const tubeGeometryArgs = useMemo(
    (): [CatmullRomCurve3, number, number, number, boolean] => [
      curve,
      Math.max(roadmap.stages.length * 12, 64),
      0.15,
      8,
      false,
    ],
    [curve, roadmap.stages.length]
  );
  const guidePoints = useMemo(
    () => curve.getPoints(Math.max(roadmap.stages.length * 20, 100)),
    [curve, roadmap.stages.length]
  );
  const visibleStages = useMemo(
    () =>
      roadmap.stages.filter((s) => Math.abs(s.order - activeStageIndex) <= VIRTUALIZATION_WINDOW),
    [roadmap.stages, activeStageIndex]
  );

  return (
    <group>
      <mesh>
        <tubeGeometry args={tubeGeometryArgs} />
        <meshStandardMaterial
          color={THEME.brand400}
          emissive={THEME.brand500}
          emissiveIntensity={0.15}
          transparent
          opacity={0.22}
          roughness={0.4}
        />
      </mesh>

      <Line points={guidePoints} color={THEME.brand500} lineWidth={1.25} transparent opacity={0.6} />

      {visibleStages.map((stage) => {
        const state = isCompleted(stage.id) ? "completed" : isUnlocked(stage.id) ? "active" : "locked";
        return (
          <Node
            key={stage.id}
            stage={stage}
            state={state}
            isFocused={stage.order === activeStageIndex}
            onSelect={(s) => setActiveStageIndex(s.order)}
            roadmapId={roadmap.id}
            topic={roadmap.topic}
          />
        );
      })}
    </group>
  );
}
