"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils, type CatmullRomCurve3 } from "three";
import type { ScrollProgressRef } from "@/hooks/useRoadmapScroll";

interface CameraRigProps {
  curve: CatmullRomCurve3;
  // A plain mutable-ref shape (not React.RefObject, whose `current` is
  // nullable) — useRoadmapScroll always initializes this via useRef(value).
  progressRef: { current: ScrollProgressRef };
}

const LOOKAHEAD = 0.02;
const DAMP_LAMBDA = 4;

/**
 * Moves the PerspectiveCamera along `curve` each frame based on the scroll
 * progress tracked by useRoadmapScroll (read via a ref, not React state, so
 * this never causes a re-render on scroll). Position/lookAt are damped
 * (exponential smoothing) so fast scroll doesn't snap the camera.
 */
export function CameraRig({ curve, progressRef }: CameraRigProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());

  useFrame((_, delta) => {
    const progress = progressRef.current.progress;
    curve.getPointAt(progress, targetPosition.current);
    curve.getPointAt(Math.min(progress + LOOKAHEAD, 1), targetLookAt.current);

    camera.position.x = MathUtils.damp(camera.position.x, targetPosition.current.x, DAMP_LAMBDA, delta);
    camera.position.y = MathUtils.damp(
      camera.position.y,
      targetPosition.current.y + 1.2,
      DAMP_LAMBDA,
      delta
    );
    camera.position.z = MathUtils.damp(camera.position.z, targetPosition.current.z, DAMP_LAMBDA, delta);

    currentLookAt.current.lerp(targetLookAt.current, 1 - Math.exp(-DAMP_LAMBDA * delta));
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
