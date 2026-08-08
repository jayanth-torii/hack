"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { Roadmap } from "@/types/roadmap";
import { buildRoadmapCurve } from "@/lib/curve";
import { useRoadmapScroll } from "@/hooks/useRoadmapScroll";
import { RoadmapPath } from "./RoadmapPath";
import { CameraRig } from "./CameraRig";
import { SceneLoader } from "./SceneLoader";
import { useQueryClient, QueryClientProvider } from "@tanstack/react-query";

export function RoadmapCanvas({ roadmap }: { roadmap: Roadmap }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRoadmapScroll(scrollContainerRef, roadmap.stages.length);
  const curve = useMemo(() => buildRoadmapCurve(roadmap.stages), [roadmap.stages]);
  const queryClient = useQueryClient();

  return (
    <>
      <SceneLoader />
      {/* Tall scroll container — its height IS the scroll journey's length.
          The Canvas itself is fixed/full-viewport; only this spacer scrolls. */}
      <div ref={scrollContainerRef} style={{ height: `${roadmap.stages.length * 100}vh` }}>
        <div className="fixed inset-0">
          <Canvas dpr={[1, 1.75]} gl={{ antialias: true }}>
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault fov={55} position={[0, 1.2, 4]} />
                <ambientLight intensity={0.25} />
                <Environment preset="night" />

                <RoadmapPath roadmap={roadmap} />
                <CameraRig curve={curve} progressRef={progressRef} />

                <EffectComposer multisampling={0}>
                  <Bloom
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.9}
                    intensity={0.6}
                    mipmapBlur
                  />
                  <Vignette eskil={false} offset={0.15} darkness={0.9} />
                </EffectComposer>
              </Suspense>
            </QueryClientProvider>
          </Canvas>
        </div>
      </div>
    </>
  );
}
