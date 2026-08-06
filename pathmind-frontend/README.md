# PathMind Frontend

Next.js 14 (App Router) + TypeScript + Three.js frontend for PathMind — a scroll-driven 3D learning-roadmap journey, with a full mobile/reduced-motion fallback.

## Quick start

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:4000
npm install
npm run dev
```

Requires the backend (`pathmind-backend`) running, ideally with `MOCK_MODE=true` so `/roadmaps/generate` works with no external API keys.

## Structure

- `components/canvas/` — the 3D scene: `RoadmapCanvas` (Canvas root + postprocessing), `RoadmapPath` (tube + virtualized nodes), `Node` (learn/practice shapes, locked/active/completed color states, mounts the `<Html>` detail panel), `CameraRig` (scroll-driven camera).
- `components/ui/` — `SearchBar`, `NodeCard` (syllabus/resources/certs/practice/timeline), `FreshnessBadge`, `ProgressBadge`, `CalendarExportButton`, shared primitives.
- `components/sections/` — `Hero`, `RoadmapJourney` (picks 3D vs. mobile), `ProgressDashboard`, `SavedRoadmaps`, `MobileTimeline`.
- `hooks/useUnlockLogic.ts` — the **single** source of truth for locked/unlocked/completed state, shared by the 3D view, the mobile timeline, and the dashboard.
- `hooks/useRoadmapScroll.ts` + `components/canvas/CameraRig.tsx` — GSAP ScrollTrigger + Lenis-driven camera, read via a ref (no per-scroll-pixel re-render).
- `lib/mappers.ts` + `lib/zod-schemas.ts` — the only place the backend's Mongoose-JSON shape is translated (and runtime-validated) into the frontend's `types/*` shape.

## Performance / accessibility

- The 3D `Canvas` is `next/dynamic`-imported with `ssr: false` and a `Suspense`/`useProgress` loading overlay.
- Nodes are virtualized to a ±6-stage window around the active stage.
- `prefers-reduced-motion` or viewport <768px renders `MobileTimeline` instead of the 3D journey — identical content and unlock logic, just no WebGL.

## Verified in this environment

- `tsc --noEmit`: clean, strict, no `any`.
- `npm run build`: production build succeeds; all 8 routes compile (static + dynamic).
- Manual end-to-end click-through against a live backend was **not** run in this sandbox (no MongoDB/Redis/Docker available here) — verify `npm run dev` against a running `pathmind-backend` (`MOCK_MODE=true`) in your own environment.
