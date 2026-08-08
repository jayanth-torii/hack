"use client";

import { Suspense, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { THEME } from "@/lib/theme";

const NODE_COLORS = [
  THEME.status.locked, // slate — not started
  THEME.brand400, // sky — in progress
  THEME.accent, // lime — the Vidhyora signature
  THEME.brand400,
  THEME.status.complete, // emerald — completed
  THEME.accent,
  THEME.status.locked,
  THEME.brand400,
];

/**
 * Floating 3D preview of the Vidhyora experience, adapted from the Acjon
 * template's WebGL showcase sensibility but built on the same R3F primitives
 * as the roadmap journey (RoadmapCanvas/Node): a spiraling CatmullRom tube
 * with alternating learn (icosahedron) / practice (sphere) checkpoints in
 * the shared THEME colors, soft bloom, slow drift, and pointer parallax.
 *
 * `animate` is passed false for prefers-reduced-motion users so the scene
 * renders as a static showcase without an animation loop.
 */
export default function HeroScene3D({ animate }: { animate?: boolean }) {
  // Default to the OS reduced-motion preference unless the caller overrides.
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate ?? !prefersReduced;

  return (
    <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} className="!h-full !w-full">
      <PerspectiveCamera makeDefault fov={50} position={[0, 0.2, 6.4]} />
      <ambientLight intensity={0.35} />
      <pointLight color={THEME.accent} intensity={1.4} distance={10} position={[3.5, 3, 3]} />
      <pointLight color={THEME.brand400} intensity={1.2} distance={12} position={[-4, -2, 0]} />
      <Suspense fallback={null}>
        <SpiralPath animate={shouldAnimate} />
        <CameraRig animate={shouldAnimate} />
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            intensity={0.7}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

function SpiralPath({ animate }: { animate: boolean }) {
  const groupRef = useRef<Group>(null);
  const nodeRefs = useRef<Array<Mesh | null>>([]);

  const curve = useMemo(() => {
    const points: Vector3[] = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 4.4;
      const radius = 3.7 - t * 2.3;
      points.push(
        new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.7) * 0.85 + (t - 0.5) * 1.3,
          t * 6.5 - 3.25
        )
      );
    }
    return new CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  const nodePositions = useMemo(() => {
    const positions: Vector3[] = [];
    for (let i = 0; i < NODE_COLORS.length; i++) {
      positions.push(curve.getPointAt(i / (NODE_COLORS.length - 1)));
    }
    return positions;
  }, [curve]);

  const tubeArgs = useMemo<[CatmullRomCurve3, number, number, number, boolean]>(
    () => [curve, 220, 0.045, 8, false],
    [curve]
  );
  const guidePoints = useMemo(() => curve.getPoints(160), [curve]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current && animate) {
      groupRef.current.rotation.y = t * 0.14;
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.18;
    }
    nodeRefs.current.forEach((mesh, i) => {
      if (mesh && animate) {
        const material = mesh.material as MeshStandardMaterial;
        material.emissiveIntensity = 0.55 + Math.sin(t * 1.7 + i * 0.8) * 0.35;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <tubeGeometry args={tubeArgs} />
        <meshStandardMaterial
          color={THEME.brand400}
          emissive={THEME.brand500}
          emissiveIntensity={0.35}
          transparent
          opacity={0.5}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <Line points={guidePoints} color={THEME.brand400} lineWidth={1} transparent opacity={0.55} />

      {nodePositions.map((pos, i) => {
        const color = NODE_COLORS[i]!;
        const isPractice = i % 2 === 1; // alternate learn/practice like the real roadmaps
        return (
          <mesh
            key={i}
            position={pos}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
          >
            {isPractice ? <sphereGeometry args={[0.17, 24, 24]} /> : <icosahedronGeometry args={[0.19, 0]} />}
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              roughness={0.25}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CameraRig({ animate }: { animate: boolean }) {
  const { camera, pointer } = useThree();
  const lookAt = useRef(new Vector3(0, 0, -1.5));

  useFrame(() => {
    if (!animate) return;
    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.8, 0.05);
    camera.position.y = MathUtils.lerp(camera.position.y, pointer.y * 0.55 + 0.2, 0.05);
    camera.lookAt(lookAt.current);
  });

  return null;
}
