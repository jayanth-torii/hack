import { CatmullRomCurve3, Vector3 } from "three";
import type { Stage } from "@/types/roadmap";

export function buildRoadmapCurve(stages: Stage[]): CatmullRomCurve3 {
  const points = stages.map((s) => new Vector3(...s.position));
  // Need at least 2 points for a valid curve; pad a single-stage roadmap.
  if (points.length < 2) {
    points.push(new Vector3(0, 0, -8));
  }
  return new CatmullRomCurve3(points, false, "catmullrom", 0.3);
}
