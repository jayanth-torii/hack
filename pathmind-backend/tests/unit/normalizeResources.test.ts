import {
  canonicalizeYouTubeUrl,
  normalizeResources,
} from "@/services/ai/normalizeResources";
import type { FreeResourceDraft } from "@/services/ai/AIProvider.interface";

describe("canonicalizeYouTubeUrl", () => {
  it("keeps a canonical watch URL and marks it a video", () => {
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      kind: "video",
    });
  });

  it("converts youtu.be links to canonical watch URLs", () => {
    expect(canonicalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      kind: "video",
    });
  });

  it("converts shorts and embed links to canonical watch URLs", () => {
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")!.url).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")!.url).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });

  it("keeps real playlists as playlists", () => {
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/playlist?list=PL1234567890")).toEqual({
      url: "https://www.youtube.com/playlist?list=PL1234567890",
      kind: "playlist",
    });
  });

  it("rejects search, channel, and homepage URLs", () => {
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/results?search_query=react")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/@freecodecamp")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://m.youtube.com/results?search_query=rust")).toBeNull();
  });

  it("rejects invalid or reserved ids", () => {
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/watch?v=abc")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ123")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/embed/videoseries?list=PL123")).toBeNull();
    expect(canonicalizeYouTubeUrl("https://youtu.be/videoseries")).toBeNull();
  });
});

describe("normalizeResources", () => {
  const draft = (partial: Partial<FreeResourceDraft>): FreeResourceDraft => ({
    title: "resource",
    url: "https://example.com/",
    type: "doc",
    ...partial,
  });

  it("canonicalizes a youtu.be video and types it video even when mislabeled doc", () => {
    const out = normalizeResources([draft({ url: "https://youtu.be/dQw4w9WgXcQ", type: "doc" })]);
    expect(out[0]).toEqual({
      title: "resource",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "video",
    });
  });

  it("drops YouTube search and channel URLs entirely", () => {
    const out = normalizeResources([
      draft({ url: "https://www.youtube.com/results?search_query=react", type: "video" }),
      draft({ url: "https://www.youtube.com/@channel", type: "playlist" }),
      draft({ url: "https://react.dev/learn", type: "doc" }),
    ]);
    expect(out.map((r) => r.url)).toEqual(["https://react.dev/learn"]);
  });

  it("drops search-results pages (MDN and generic) as resources", () => {
    const out = normalizeResources([
      draft({ url: "https://developer.mozilla.org/en-US/search?q=system%20design", type: "doc" }),
      draft({ url: "https://www.geeksforgeeks.org/search/?q=design", type: "doc" }),
      draft({ url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", type: "doc" }),
    ]);
    expect(out.map((r) => r.url)).toEqual(["https://developer.mozilla.org/en-US/docs/Web/HTTP"]);
  });

  it("retypes an article labeled playlist to doc", () => {
    const out = normalizeResources([
      draft({ url: "https://www.freecodecamp.org/news/x-handbook/", type: "playlist" }),
    ]);
    expect(out[0]!.type).toBe("doc");
  });

  it("retypes a Vimeo video as type video", () => {
    const out = normalizeResources([draft({ url: "https://vimeo.com/12345678", type: "doc" })]);
    expect(out[0]!.type).toBe("video");
  });

  it("dedupes URLs that canonicalize to the same watch link", () => {
    const base = { title: "x", url: "https://youtu.be/dQw4w9WgXcQ", type: "video" as const };
    const out = normalizeResources([base, { ...base, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }]);
    expect(out).toHaveLength(1);
  });

  it("caps the result at 4 resources", () => {
    const many = normalizeResources(
      Array.from({ length: 6 }, (_, i) => draft({ url: `https://example.com/${i}` }))
    );
    expect(many).toHaveLength(4);
  });
});
