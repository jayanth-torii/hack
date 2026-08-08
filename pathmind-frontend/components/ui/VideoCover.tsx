"use client";

import { useMemo } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Generated cover art for video preview panels. Deterministic per title/url
 * (no network, no external thumbnail service): an ink canvas with signature
 * lime/cyan glows, floating geometry and the resource title set in Poppins —
 * so every stage's preview looks like a designed video cover.
 */

const PALETTES = [
  { glow: "#c9f31d", glow2: "#38bdf8", accentText: "#c9f31d" },
  { glow: "#38bdf8", glow2: "#8b5cf6", accentText: "#7dd3fc" },
  { glow: "#8b5cf6", glow2: "#c9f31d", accentText: "#c4b5fd" },
  { glow: "#34d399", glow2: "#38bdf8", accentText: "#6ee7b7" },
  { glow: "#f472b6", glow2: "#c9f31d", accentText: "#f9a8d4" },
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function wrapLines(text: string, maxChars = 24): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
    if (lines.length === 2) break;
  }
  if (current && lines.length < 2) lines.push(current);
  if (lines.length === 0) lines.push(text);
  return lines.slice(0, 2);
}

interface VideoCoverProps {
  /** Resource title — drawn onto the cover. */
  title: string;
  /** Seed for deterministic palette/geometry (use the URL). */
  seed?: string;
  className?: string;
}

export function VideoCover({ title, seed = title, className }: VideoCoverProps) {
  const { palette, lines, ringPos, dotPos } = useMemo(() => {
    const h = hashCode(seed);
    return {
      palette: PALETTES[h % PALETTES.length]!,
      lines: wrapLines(title),
      ringPos: h % 2 === 0 ? "left" : "right",
      dotPos: (h >> 2) % 2 === 0 ? "top-right" : "bottom-left",
    };
  }, [seed, title]);

  const glow = palette.glow;
  const glow2 = palette.glow2;

  return (
    <svg
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid slice"
      className={clsx("absolute inset-0 h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="vc-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b0e12" />
          <stop offset="55%" stopColor="#06080a" />
          <stop offset="100%" stopColor="#0b0e12" />
        </linearGradient>
        <radialGradient id="vc-glow1" cx="0.2" cy="0.1" r="0.8">
          <stop offset="0%" stopColor={glow} stopOpacity="0.22" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vc-glow2" cx="0.9" cy="0.95" r="0.7">
          <stop offset="0%" stopColor={glow2} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow2} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1280" height="720" fill="url(#vc-bg)" />
      <rect width="1280" height="720" fill="url(#vc-glow1)" />
      <rect width="1280" height="720" fill="url(#vc-glow2)" />

      {/* film-grain dots */}
      <g fill={glow} opacity="0.35">
        {dotPos === "top-right" ? (
          <>
            <circle cx="1120" cy="120" r="5" />
            <circle cx="1170" cy="170" r="3.5" />
            <circle cx="1060" cy="185" r="3" />
            <circle cx="1210" cy="90" r="4" />
          </>
        ) : (
          <>
            <circle cx="180" cy="600" r="5" />
            <circle cx="230" cy="545" r="3.5" />
            <circle cx="130" cy="550" r="3" />
            <circle cx="270" cy="640" r="4" />
          </>
        )}
      </g>

      {/* big dashed ring on one side */}
      <g
        stroke={ringPos === "left" ? glow : glow2}
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeDasharray="10 14"
        fill="none"
        transform={ringPos === "left" ? "translate(90 80)" : "translate(980 420)"}
      >
        <circle cx="150" cy="150" r="150" />
        <circle cx="150" cy="150" r="112" />
      </g>

      {/* small filled ring on the opposite side */}
      <g stroke={ringPos === "left" ? glow2 : glow} strokeOpacity="0.5" strokeWidth="2" fill="none" transform={ringPos === "left" ? "translate(1040 470)" : "translate(150 90)"}>
        <circle cx="40" cy="40" r="40" />
        <circle cx="40" cy="40" r="40" strokeDasharray="4 10" strokeOpacity="0.35" />
      </g>

      {/* plus + triangle glyphs */}
      <g stroke={glow} strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" transform={ringPos === "left" ? "translate(150 620)" : "translate(1130 160)"}>
        <path d="M0 -26 V26 M-26 0 H26" />
      </g>
      <path
        d="M20 690 L60 690 L40 656 Z"
        fill={glow2}
        fillOpacity="0.4"
        transform={ringPos === "left" ? "translate(100 0)" : "translate(1150 0)"}
      />

      {/* bottom scrim for text legibility */}
      <rect x="0" y="430" width="1280" height="290" fill="url(#vc-bg)" opacity="0.55" />

      {/* accent rule */}
      <rect x="64" y="560" width="72" height="6" rx="3" fill={glow} />

      {/* title */}
      {lines.map((line, i) => (
        <text
          key={i}
          x="64"
          y={620 + i * 58}
          fill="#f5f7f5"
          fontFamily="Poppins, system-ui, sans-serif"
          fontSize={i === 0 ? 54 : 42}
          fontWeight="600"
          letterSpacing="-0.5"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
