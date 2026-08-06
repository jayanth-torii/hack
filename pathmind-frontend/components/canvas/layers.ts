// Shared Three.js layer index used by Node.tsx (opt-in) and the selective
// Bloom pass in RoadmapCanvas.tsx (reads only this layer) — so bloom only
// ever highlights active/completed checkpoints, never locked ones.
export const BLOOM_LAYER = 1;
