"use client";

import { useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import type { ResourceType } from "@/types/resource";
import { VideoCover } from "./VideoCover";

/** True when the URL actually points at YouTube or Vimeo (any of their
 *  surfaces: watch, short, playlist, search, channel...). Used to decide
 *  whether a resource deserves a video-style preview panel at all. */
export function isVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

interface ParsedVideo {
  provider: "youtube" | "vimeo";
  /** Canonical video id, when the URL resolves to a single video. */
  videoId: string | null;
  canonical: string;
}

function parseVideoUrl(url: string): ParsedVideo | null {
  if (!isVideoUrl(url)) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = u.pathname.split("/")[1] ?? null;
    } else if (host === "vimeo.com" || host === "player.vimeo.com") {
      videoId = u.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) {
      videoId = u.pathname.split("/")[2] ?? null;
    } else {
      videoId = u.searchParams.get("v");
    }
    // YouTube video ids are exactly 11 chars; "videoseries" (playlist embed)
    // and any other non-id path segment must not become a thumbnail url.
    if (host.includes("youtube") || host === "youtu.be") {
      videoId = videoId && videoId.length === 11 ? videoId : null;
    }

    return {
      provider: host.includes("vimeo") ? "vimeo" : "youtube",
      videoId,
      canonical: url,
    };
  } catch {
    return null;
  }
}

/**
 * YouTube thumbnail for a video id. hqdefault (480×360) is the most reliable
 * size — maxresdefault only exists for some uploads — and object-cover crops
 * the 4:3 art to the panel's 16:9 frame.
 */
function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Real video thumbnail when the URL resolves to a single video. The
 * generated VideoCover always sits underneath, so a failed/absent thumbnail
 * (e.g. age-restricted videos) falls back seamlessly.
 */
function ThumbnailLayer({ parsed }: { parsed: ParsedVideo }) {
  const [failed, setFailed] = useState(false);
  if (parsed.provider !== "youtube" || !parsed.videoId || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={youtubeThumb(parsed.videoId)}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

/** Official YouTube icon (red rounded square + white triangle). */
function YouTubeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5.5" fill="#FF0000" />
      <path d="M10 8.2v7.6L16.4 12 10 8.2Z" fill="#fff" />
    </svg>
  );
}

function VimeoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5.5" fill="#1ab7ea" />
      <path
        d="M18.2 8.9c-.6.6-2.2 1.8-3.2 1.1-.5-.3-.4-1.2-1.1-1.5-.7-.3-1.5.7-2.2 1.5-.6.7-1.4 2.2-2 3.9-.6 1.6-.7.8-1.2 0-.2-.5-.6-1.3-1-2-.3-.5-.8-.4-1.3-.3-.9.2-1.7.5-2.5 1 .5 1.3 1 2.4 1.3 3.2.7 1.6 1.5 3.3 2.7 4.6 1.4 1.6 2.8 1.2 3.7.7 2.4-1.5 4.7-6 5.4-9 .7-2.9 1.4-4.5 2.2-4.8 1.3-.5 2.4.4 3 1 .3.3.9 1 1.5 1.6-2.6 1.4-4.5 1.7-5.3.9Z"
        fill="#fff"
      />
    </svg>
  );
}

interface VideoPreviewProps {
  url: string;
  title: string;
  /** Resource type — kept for API parity; only video/playlist/doc that
   *  actually points at YouTube/Vimeo render a panel. */
  type?: ResourceType;
  verified?: boolean;
  className?: string;
}

/**
 * Video-style preview panel for a YouTube/Vimeo resource, shown in the
 * alternating timeline column opposite each stage card.
 *
 * When the URL resolves to a single video the panel shows that video's real
 * thumbnail (YouTube i.ytimg.com); otherwise a *generated* cover (VideoCover)
 * — a designed, theme-matched thumbnail with the resource title — is used.
 * The generated cover always sits underneath as a graceful fallback. The
 * official provider icon sits top-left, a play button floats center, and
 * clicking the panel opens the video in a new tab. Non-video URLs return null.
 */
export function VideoPreview({ url, title, className }: VideoPreviewProps) {
  const parsed = useMemo(() => parseVideoUrl(url), [url]);

  if (!parsed) return null;

  const providerLabel = parsed.provider === "youtube" ? "YouTube" : "Vimeo";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        "group relative block aspect-video w-full overflow-hidden rounded-2xl border border-line/10 bg-ink",
        className
      )}
      aria-label={`Watch on ${providerLabel}: ${title}`}
    >
      {/* generated cover art (base layer — also the fallback) */}
      <VideoCover title={title} seed={url} />

      {/* real video thumbnail on top when the URL has a video id */}
      <ThumbnailLayer parsed={parsed} />

      {/* legibility scrim over the top strip */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />

      {/* official provider icon */}
      <span className="absolute left-3.5 top-3 drop-shadow-md">
        {parsed.provider === "youtube" ? <YouTubeIcon /> : <VimeoIcon />}
      </span>

      {/* play button */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#0b0b0b] shadow-xl shadow-black/40 transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-on-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-white/30" />
        </span>
      </span>

      <span className="absolute bottom-3 right-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
        Watch on {providerLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}
