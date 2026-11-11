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

## 2. Design tokens — Material 3, single source of truth

The product is **Material 3**, dark scheme, on a tonal palette seeded from the
brand orange `#F97316`. Everything lives in `app/globals.css` (`:root`) and is
surfaced through `tailwind.config.ts`. **Never hardcode a colour, radius,
shadow or duration at a call site.**

Two layers exist, deliberately:

1. **`--md-*` — the M3 role set. New work uses these.**
2. The original `--color-*` names, now **aliases onto M3 roles**. They exist so
   the reskin didn't have to touch every call site at once. When you edit a
   file, migrate its colours to `md-*`.

| Group | Roles | Tailwind |
|---|---|---|
| Surfaces | `surface · surface-dim · surface-bright · surface-container-{lowest,low,—,high,highest}` | `bg-md-surface-container-high` |
| On-surface | `on-surface · on-surface-variant · outline · outline-variant` | `text-md-on-surface-variant` |
| Primary | `primary · on-primary · primary-container · on-primary-container · inverse-primary` | `bg-md-primary`, `text-md-on-primary` |
| Secondary / tertiary | same four-part shape | `bg-md-secondary-container` |
| Status | `error · success · warning · info`, each with `on-`, `-container`, `on-…-container` | `bg-md-error-container` |
| Inverse / scrim | `inverse-surface · inverse-on-surface · scrim` | snackbars, dialog scrims |
| Type scale | display · headline · title · body · label, each lg/md/sm | `text-headline-sm`, `text-label-lg` |
| Elevation | levels 1–5 | `shadow-e1` … `shadow-e5` |
| Shape | xs 4 · sm 8 · md 12 · lg 16 · xl 28 · full | `rounded-md`, `rounded-full` |
| Motion | `--dur-fast 200 · base 300 · slow 500` + 4 M3 curves | `duration-base`, `ease-decelerate` |
| Chrome | `--app-bar-h 64 · --bottom-nav-h 80 · --safe-*` | `h-app-bar`, `pt-safe`, `pb-nav` |
| Touch | 48px comfortable, 44px floor | `min-h-touch`, `min-h-touch-min` |

**Three Material rules that are easy to get wrong:**

- **The type scale carries its own line-height, tracking and weight.** Don't
  stack `font-bold leading-tight tracking-tight` on `text-headline-md` — if it
  needs to look different, you want a different step.
- **State is a layer, not a colour.** Hover/focus/press are a translucent wash
  of `currentColor` over the component. Use the `.state-layer` class; don't
  write `hover:bg-…` swaps, which break the moment a variant changes.
- **One filled button per view.** The variants are an emphasis ladder
  (filled → tonal → elevated → outlined → text). If two things look primary,
  neither is.

**Light mode is hidden** — `LIGHT_MODE_ENABLED` in `lib/useTheme.tsx` is
`false`, nothing sets `html.light`, and `ThemeToggle` renders nothing. The old
light palette is kept dormant in `globals.css`. Never write `slate-*`,
`rose-*`, `emerald-*` or a raw hex for anything semantic — that was the bug
class that made `Input` and `Button` unreadable, and under a role system it
also silently opts that element out of the whole theme.

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
  (inside `/roadmap/<id>` it shows that roadmap's views, elsewhere Home ·
  Courses · Library · Profile).
- The **admin entry point lives in `AppBar`**, rendered only when
  `user.role === "admin"`. That is a UI hint, not a gate: every `/admin`
  endpoint re-reads the role from the database, so a tampered client store
  buys an explanation screen, not access.
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
| `md/Button` | M3 common buttons: `filled · tonal · elevated · outlined · text` |
| `md/Dialog` | **every** modal — see below |
| `md/useBackClose` | hardware Back closes a full-screen surface |
| `courses/*` | catalog card, full-screen preview, stage builder |
| `admin/AdminPrimitives` | `Section · Metric · Sparkline · RecordCard · Field · Pager · TimeAgo` |

**No popups on phones.** `md/Dialog` is a centred modal from `md` up and a
**full-screen page** below it: `100dvh`, no radius or border, a top app bar
with a **back arrow** instead of an ✕, full-width stacked actions above the
home indicator, and `useBackClose` wiring the hardware Back button to it. A
full-screen dialog is a navigation destination, so Back has to work — otherwise
the first gesture an Android user reaches for leaves the app. Route all modal
content through it; don't hand-roll a second overlay.

`100dvh`, not `100vh`: the dynamic viewport unit tracks the collapsing mobile
URL bar, so the action row can't be pushed off-screen.

**Every data screen implements four states**: loading (skeleton matching the
real layout, not a spinner), empty (explain *why* and give the next action),
error (human copy + recovery — never a raw backend message), success.

**No tables in the admin area.** A six-column `<table>` cannot fit 360px
without sideways scrolling, which §3 forbids. Admin records are
`admin/RecordCard`s instead: the row reflows, and the column headings a table
would carry become per-field labels. One markup for both sizes — there is no
second mobile layout to keep in step.

---

## 5a. Course catalog

| Route | What it is |
|---|---|
| `/courses` | browse and pick — search, subject chips, sort, paging |
| `/courses/build` | assemble a personal course from catalog stages (no AI) |
| `/admin` | five tabs: overview · users · courses · resources · logs |

**A roadmap is a catalog course when it is published *and* categorised.**
Every AI-generated roadmap is also `isPublicTemplate: true` — that is how the
generation cache is shared — so a catalog defined as "public templates" fills
with whatever anyone ever typed into the topic box. The category is the
editorial act; `CATALOG_FILTER` in the backend is the single definition, used
by the list, the detail endpoint and the builder alike.

**`verified: false` on a resource means "search fallback", not "broken".** It
marks a URL that points at a search on a real site instead of at the thing
itself — it resolves fine. The admin Resources tab once badged it "Not
resolving" and called itself a broken-link queue, while persistence hardcoded
`verified: true`; the queue was therefore permanently empty *and* 126
fabricated links sat in the list badged healthy. Label it "Search fallback",
and if you ever want a real liveness signal, add a separate field — don't
overload this one.

**Never mint a URL from a hash.** The mock search provider used to build an
11-character YouTube id and an article slug out of the query. Both are
syntactically valid and point nowhere, and `youtube.com/watch?v=<dead id>`
answers 200, so nothing downstream could catch it. Mock links are search URLs
on real sites. `npm run resources:repair` rewrites any fabricated link still
in the database and is idempotent.

**There is deliberately no difficulty filter.** All 80 curated courses run
beginner → intermediate → advanced, so the control would return everything or
nothing whichever way it was defined. Cards show the **span**
("Beginner → Advanced"); only per-stage badges name a single level. If a
single-level course is ever seeded, reinstate the filter — the API still
supports `?level=`.

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

Then check the real thing at **360px and 390px** (dark — light mode is
hidden), with keyboard navigation, and confirm no new console errors. Report
what actually ran — never the intention.
