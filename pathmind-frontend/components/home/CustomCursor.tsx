"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap-config";

// ─────────────────────────────────────────────────────────────────────────────
// "Ink pen" cursor — a fingertip that draws a fading line behind it, like a pen
// inking a stroke:
//
//   • Head     — a precise lime bead (the fingertip) pinned to the pointer.
//   • Ink line — while you move, a tapered lime→cyan line is drawn behind the
//                head and dissolves after ~340ms, so the path you trace stays
//                visible for a beat.
//   • Hover    — over links/buttons/inputs the custom cursor politely steps
//                aside: the native pointer (or text caret on fields) takes
//                over, exactly like a normal site cursor.
//   • Click    — a small ripple ring bursts at the press.
//
// Native cursor is hidden only while this is mounted (home page). Touch
// devices and reduced-motion users keep the native cursor untouched.
// ─────────────────────────────────────────────────────────────────────────────

const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, label, [role='button'], [data-cursor]";

// Injected via dangerouslySetInnerHTML (NOT as JSX children) so the style's
// text is byte-identical on server and client — React escapes text children
// differently on each side, which would otherwise cause a hydration error.
const CURSOR_CSS = `
  html.has-custom-cursor,
  html.has-custom-cursor * { cursor: none !important; }
  /* Over interactive elements the native cursor takes over. */
  html.has-custom-cursor a,
  html.has-custom-cursor button,
  html.has-custom-cursor [role='button'],
  html.has-custom-cursor label,
  html.has-custom-cursor [data-cursor] { cursor: pointer !important; }
  /* Text fields keep the I-beam caret. */
  html.has-custom-cursor input,
  html.has-custom-cursor textarea,
  html.has-custom-cursor select { cursor: text !important; }
  /* Disabled controls still show the not-allowed affordance. */
  html.has-custom-cursor button:disabled,
  html.has-custom-cursor a[aria-disabled='true'] { cursor: not-allowed !important; }
`;

// Trail rendering
const SEGMENTS = 26; // line segments in the drawn trail
const LIFETIME_MS = 340; // how long a point stays visible behind the head
const MIN_STEP = 3; // px of mouse travel before a new point is sampled

// Brand ink colors for the drawn line (tail → head)
const LIME: [number, number, number] = [201, 243, 29];
const CYAN: [number, number, number] = [56, 189, 248];

const ACCENT = "rgb(var(--color-accent))";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = rootRef.current;
    const svg = svgRef.current;
    const head = headRef.current;
    if (!root || !svg || !head) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([head], { xPercent: -50, yPercent: -50, x: -200, y: -200, autoAlpha: 0 });
    gsap.set(svg, { autoAlpha: 0 });

    // Position followers — the head is snappy like a pen nib.
    const headX = gsap.quickTo(head, "x", { duration: 0.06, ease: "power3.out" });
    const headY = gsap.quickTo(head, "y", { duration: 0.06, ease: "power3.out" });

    const points: { x: number; y: number; t: number }[] = [];
    const mouse = { x: -200, y: -200 };
    const lines = lineRefs.current;
    let visible = false;
    let hidden = false; // hovering an interactive element → native cursor

    // One rAF loop: sample trail points and rebuild the drawn ink line.
    const tick = (_time: number, _deltaTime: number) => {
      const now = performance.now();

      // Sample a fresh point whenever the head travels far enough.
      const lastPt = points[points.length - 1];
      if (
        visible &&
        !hidden &&
        (!lastPt || Math.hypot(mouse.x - lastPt.x, mouse.y - lastPt.y) > MIN_STEP)
      ) {
        points.push({ x: mouse.x, y: mouse.y, t: now });
      }
      // Prune points that aged past the lifetime (or exceeded the cap).
      while (points.length > 1 && (now - points[1]!.t > LIFETIME_MS || points.length > SEGMENTS + 1)) {
        points.shift();
      }
      if (points.length && now - points[points.length - 1]!.t > LIFETIME_MS) points.length = 0;

      const drawing = visible && !hidden;

      // Rebuild the ink line: each segment fades + tapers toward the tail.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        if (drawing && i < points.length - 1) {
          const a = points[i]!;
          const b = points[i + 1]!;
          const life = clamp((now - b.t) / LIFETIME_MS, 0, 1); // 0 fresh → 1 gone
          const keep = 1 - life;
          line.setAttribute("x1", String(a.x));
          line.setAttribute("y1", String(a.y));
          line.setAttribute("x2", String(b.x));
          line.setAttribute("y2", String(b.y));
          line.setAttribute("stroke-opacity", String(0.04 + keep * 0.55));
          line.setAttribute("stroke-width", String(1 + keep * 3.5));
          line.setAttribute("stroke", `rgb(${mix(CYAN, LIME, keep).join(",")})`);
        } else {
          line.setAttribute("stroke-opacity", "0");
        }
      }
    };
    gsap.ticker.add(tick);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        visible = true;
        if (!hidden) {
          gsap.to([head, svg], { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
        }
      }
      headX(e.clientX);
      headY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      const interactive = target.closest?.(INTERACTIVE_SELECTOR);

      if (interactive && !hidden) {
        // Let the native pointer / text caret take over.
        hidden = true;
        gsap.to([head, svg], { autoAlpha: 0, duration: 0.18 });
      } else if (!interactive && hidden) {
        hidden = false;
        if (visible) gsap.to([head, svg], { autoAlpha: 1, duration: 0.2 });
      }
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || hidden) return;
      // Ripple ring bursting from the press.
      const r = document.createElement("span");
      r.style.cssText = `position:absolute;top:0;left:0;width:26px;height:26px;border-radius:9999px;border:1.5px solid ${ACCENT};will-change:transform,opacity;`;
      root.appendChild(r);
      gsap.fromTo(
        r,
        { x: e.clientX - 13, y: e.clientY - 13, scale: 0.5, autoAlpha: 0.9 },
        {
          x: e.clientX - 13,
          y: e.clientY - 13,
          scale: 2.9,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          onComplete: () => r.remove(),
        }
      );
    };

    const onLeave = () => {
      visible = false;
      points.length = 0;
      gsap.to([head, svg], { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      gsap.ticker.remove(tick);
      gsap.killTweensOf([head, svg]);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CURSOR_CSS }} />
      <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[200]">
        {/* Drawn ink line */}
        <svg
          ref={svgRef}
          className="absolute left-0 top-0 h-full w-full"
          style={{ filter: "drop-shadow(0 0 3px rgba(201,243,29,0.16))" }}
        >
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <line
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              stroke="#c9f31d"
              strokeLinecap="round"
              strokeOpacity="0"
            />
          ))}
        </svg>

        {/* Fingertip head */}
        <div
          ref={headRef}
          className="absolute h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(201,243,29,0.8)] will-change-transform"
        />
      </div>
    </>
  );
}
