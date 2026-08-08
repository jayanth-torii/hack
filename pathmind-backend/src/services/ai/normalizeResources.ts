import type { FreeResourceDraft } from "./AIProvider.interface";

/**
 * Resource normalization applied to AI-generated free-resource drafts at the
 * persistence choke point (roadmap.service.ts), so every provider — real or
 * mock — ships deep-linkable URLs only.
 *
 * Guarantees:
 * - YouTube video links are canonicalized to https://www.youtube.com/watch?v={id}
 *   (youtu.be, /shorts/, /embed/ and playlist-inside-watch all resolve to a
 *   plain watch URL) and typed "video".
 * - YouTube search pages (/results?search_query=), channel pages, and
 *   homepages are dropped entirely — they are not watchable resources and the
 *   frontend preview panels rely on real video ids for thumbnails.
 * - "playlist" only ever means a real YouTube playlist URL.
 * - Type mislabels (e.g. a YouTube video typed "doc", or an article typed
 *   "playlist"/"video") are corrected.
 * - Duplicate canonical URLs collapse; the result is capped at 4 resources.
 */

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;
// "videoseries" is Google's reserved id for playlist embeds — 11 chars, so it
// would otherwise pass the id regex and produce a bogus thumbnail URL.
const RESERVED_YT_IDS = new Set(["videoseries"]);

export interface CanonicalYoutube {
  url: string;
  kind: "video" | "playlist";
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isValidYtId(id: string | null | undefined): id is string {
  return Boolean(id && YT_ID_RE.test(id) && !RESERVED_YT_IDS.has(id));
}

export function isYouTubeUrl(url: string): boolean {
  const host = hostOf(url);
  return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
}

function isVimeoUrl(url: string): boolean {
  const host = hostOf(url);
  return host === "vimeo.com" || host === "player.vimeo.com";
}

/**
 * Search-results pages (MDN /search, generic /search paths) are navigation,
 * not learning resources — dropping them prevents the AI from padding a stage
 * with a search page when it couldn't find a real doc/video URL.
 */
function isSearchPageUrl(raw: string): boolean {
  try {
    const path = new URL(raw).pathname;
    if (path === "/search" || path.startsWith("/search/")) return true;
    if (path.startsWith("/en-US/search")) return true; // MDN
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolves a YouTube URL to a canonical, deep-linkable form, or null when the
 * URL is not a watchable video/playlist (search pages, channels, homepages,
 * invalid ids, live streams...).
 */
export function canonicalizeYouTubeUrl(raw: string): CanonicalYoutube | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.split("/")[1] ?? null;
    return isValidYtId(id)
      ? { url: `https://www.youtube.com/watch?v=${id}`, kind: "video" }
      : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;

  const path = u.pathname;
  if (path === "/playlist" || path.startsWith("/playlist/")) {
    const list = u.searchParams.get("list");
    return list
      ? { url: `https://www.youtube.com/playlist?list=${list}`, kind: "playlist" }
      : null;
  }
  if (path.startsWith("/shorts/") || path.startsWith("/embed/")) {
    const id = u.pathname.split("/")[2] ?? null;
    return isValidYtId(id)
      ? { url: `https://www.youtube.com/watch?v=${id}`, kind: "video" }
      : null;
  }
  if (path === "/watch") {
    const id = u.searchParams.get("v");
    return isValidYtId(id)
      ? { url: `https://www.youtube.com/watch?v=${id}`, kind: "video" }
      : null;
  }

  // /results, /@channel, /user, homepage, /live, ... → not a deep link.
  return null;
}

/**
 * Normalizes a batch of free-resource drafts. Order is preserved; non-video
 * URLs that are already docs/blogs pass through untouched.
 */
export function normalizeResources(drafts: FreeResourceDraft[]): FreeResourceDraft[] {
  const seen = new Set<string>();
  const out: FreeResourceDraft[] = [];

  for (const draft of drafts) {
    const yt = canonicalizeYouTubeUrl(draft.url);
    let url = draft.url;
    let type = draft.type;

    if (yt) {
      url = yt.url;
      type = yt.kind === "video" ? "video" : "playlist";
    } else if (isYouTubeUrl(draft.url)) {
      // Search/channel/homepage — not watchable, drop entirely.
      continue;
    } else if (isSearchPageUrl(draft.url)) {
      // Search-results pages aren't resources — drop entirely.
      continue;
    } else if (isVimeoUrl(draft.url)) {
      type = "video";
    } else if (type === "playlist" || type === "video") {
      // Neither type applies to a plain article/docs URL — fix the mislabel.
      type = "doc";
    }

    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ title: draft.title, url, type });
  }

  return out.slice(0, 4);
}
