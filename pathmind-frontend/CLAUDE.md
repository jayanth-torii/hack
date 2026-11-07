# Vidhyora frontend — UI/UX & animation standards

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind 3.
These rules are binding for all future UI work in this package.

---

## 1. Installed libraries — do not add duplicates

| Purpose | Library | Notes |
|---|---|---|
| Timelines, scroll-scrub, pinning, parallax, text reveals | **GSAP + ScrollTrigger** | `lib/gsap-config.ts` registers the plugin once |
| React enter/exit, layout, gesture, modals | **Framer Motion** (`framer-motion` 11) | |
| Smooth scroll | **Lenis** | one instance, via `initSmoothScroll()` |
| 3D hero / roadmap scene | **@react-three/fiber + drei + postprocessing** | always `next/dynamic` with `ssr: false` |
| Data fetching | **@tanstack/react-query** | |
| Forms | **react-hook-form + zod** | |
| Client state | **zustand** | |

There is **no icon library** — icons are inline SVG on a 24px grid with 1.8
stroke and round caps. Keep that family; don't introduce Lucide or emoji
alongside it.

**One animation, one library.** GSAP for scroll-driven and timeline work,
Framer Motion for React component motion, CSS for hover and simple state
changes. Never animate the same property with two of them.

---

## 2. Design tokens — the single source of truth

Everything lives in `app/globals.css` (`:root` and `html.light`) and is
surfaced through `tailwind.config.ts`. **Never hardcode a colour, radius,
shadow or duration at a call site.**

| Group | Tokens | Tailwind |
|---|---|---|
| Surface / text | `--color-ink · paper · card · muted · subtle · line` | `bg-ink`, `text-paper`, … |
| Brand | `--color-accent · accent-hover · on-accent · accent-text · cyan-text` | `bg-accent`, `text-accent-text` |
| Status | `--color-success · warning · danger · info` | `text-danger`, `border-success/30` |
| Radius | `--radius-xs 8 · sm 12 · md 16 · lg 20 · xl 24` | `rounded-sm`, `rounded-md`, … |
| Elevation | `--elev-1 · 2 · 3` | `shadow-e1`, `shadow-e2`, `shadow-e3` |
| Motion | `--dur-fast 140 · base 220 · slow 380`, `--ease-standard`, `--ease-emphasized` | `duration-fast`, `ease-standard` |
| Chrome | `--app-bar-h 56 · --bottom-nav-h 64 · --safe-*` | `h-app-bar`, `pt-safe`, `pb-nav` |
| Touch | 48px comfortable, 44px floor | `min-h-touch`, `min-h-touch-min` |

**Both themes must work.** The dark palette is the default; `html.light` is a
genuinely different palette, not an inversion. Never write `slate-*`,
`rose-*` or a raw hex for anything semantic — that was the bug class that made
`Input` and `Button` unreadable in light mode.

---

## 3. Mobile rules (non-negotiable)

- **Safe areas.** `viewport-fit=cover` is set in `app/layout.tsx`. Every fixed
  bar pays it back with `pt-safe` / `pb-safe`. **Apply the inset once** — a
  safe-area-padded bar inside a safe-area-padded container double-pads.
- **Heights.** Use `.min-h-screen-safe` (100svh), never `min-h-screen`
  (100vh) — 100vh ignores mobile browser chrome and makes sections jump.
- **Touch targets.** 48px (`min-h-touch`), 44px absolute floor
  (`min-h-touch-min`). Inline links inside a sentence are exempt.
- **Inputs are 16px on mobile** (enforced globally in `globals.css`) or iOS
  Safari zooms the page on focus. Don't override it below `md`.
- **Hover is desktop-only.** Wrap hover-only affordance in
  `@media (hover: hover) and (pointer: fine)` or use the `.hover-lift` helper.
  Use `.press` for the touch pressed state.
- **No horizontal page scroll, ever.** `body` has `overflow-x: hidden`; that's
  a safety net, not a licence to overflow.
- **Phone gutter is `px-4`, `sm:px-6`.** Not `px-6` everywhere.

### Fixed positioning + backdrop-blur

A `backdrop-filter` makes an element a **containing block for
`position: fixed` descendants.** Both `Header` and `AppBar` use
`backdrop-blur`, so anything fixed/modal rendered inside them will size to the
bar instead of the viewport. **Portal overlays to `document.body`** — see
`components/home/MobileMenu.tsx`. This already bit us once.

---

## 4. Navigation architecture

| Breakpoint | Pattern |
|---|---|
| `< md` | `<BottomNav>` — contextual, max 4 destinations, icon **and** label |
| `≥ md` | `<AppBar actions={…}>` inline links |

- `components/ui/AppBar.tsx` is **the** app bar for every signed-in screen.
  Do not hand-roll another header; four near-identical ones were consolidated
  into it.
- `components/ui/BottomNav.tsx` derives destinations from the pathname
  (inside `/roadmap/<id>` it shows that roadmap's views, elsewhere the
  top-level set).
- Any scroll container under the bottom nav needs `pb-nav`; any screen under
  the app bar needs `pt-app-bar`.

---

## 5. Component rules

Reuse these before writing anything new:

| Component | Use for |
|---|---|
| `ui/Button` | variants `accent · primary · tonal · outlined · ghost · danger`, sizes `sm · md · lg` |
| `ui/Input` | optional `label · helperText · error · required · startAdornment · endAdornment`; bare usage still works |
| `ui/Skeleton` | `RoadmapSkeleton`, `CardGridSkeleton`, `DashboardSkeleton` |
| `ui/StateView` | empty and error states with recovery actions |
| `ui/AppBar`, `ui/BottomNav` | app shell |
| `home/MobileMenu` | marketing nav sheet |

**Every data screen implements four states**: loading (skeleton matching the
real layout, not a spinner), empty (explain *why* and give the next action),
error (human copy + recovery — never a raw backend message), success.

---

## 6. Accessibility

- Semantic elements; `button` for actions, `a` for navigation.
- Accessible name on every icon-only control.
- Visible focus is global (`:focus-visible` in `globals.css`) — never remove it.
- **Status is never colour alone** — pair with an icon or text.
- Modals: focus trap, Escape to close, scroll lock, focus restored on close.
- `role="alert"` on validation and async error messages.
- Auto-playing looping media needs a pause control (WCAG 2.2.2) — the intro
  reel has one, and it starts paused under reduced motion.

---

## 7. Motion & performance

- `prefers-reduced-motion` is handled globally in CSS **and** must be checked
  in JS: `useReducedMotion()` (Framer) or `matchMedia` before a GSAP timeline.
  Reduced motion means **no movement**, not faster movement — and content must
  still end in its final, readable state.
- **Always `ctx.revert()`** a `gsap.context` on unmount. Leaked ScrollTriggers
  are the top cause of creeping jank.
- Animate `transform` and `opacity` only.
- Lenis: `syncTouch` stays **off** — it breaks native momentum scrolling and
  pull-to-refresh on phones. `smoothWheel` is gated on a fine pointer.
- Heavy visuals (`three`, video) stay `next/dynamic` + `ssr: false` with a
  sized placeholder so there's no layout shift.
- `CustomCursor` is gated on `(pointer: coarse)` — keep it that way.

---

## 8. Do not

Squeeze desktop layouts onto phones · invent per-screen padding · nest cards ·
use colour as the only status cue · ship a spinner where a skeleton belongs ·
show raw backend errors · duplicate an existing component with slightly
different styling · add a dependency the project already has · remove a video
section.

---

## 9. Before claiming done

```bash
npx tsc --noEmit      # typecheck
npx next lint         # lint
npx next build        # production build
```

Then check the real thing at **360px and 390px, in both themes**, with
keyboard navigation, and confirm no new console errors. Report what actually
ran — never the intention.
