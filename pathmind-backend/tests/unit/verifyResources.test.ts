import { verifyResourceLinks } from "@/services/ai/verifyResources";
import type { FreeResourceDraft } from "@/services/ai/AIProvider.interface";

const draft = (url: string): FreeResourceDraft => ({
  title: "Resource",
  url,
  type: "doc",
});

const check =
  (status: (url: string) => number | undefined) =>
  async (url: string) => {
    const s = status(url);
    return s === undefined ? { alive: false } : { alive: s < 400, status: s };
  };

describe("verifyResourceLinks", () => {
  it("drops resources that return a definitive 404/410", async () => {
    const resources = [draft("https://a.example/ok"), draft("https://b.example/gone"), draft("https://c.example/missing")];
    const out = await verifyResourceLinks(
      resources,
      check((url) => (url.includes("gone") ? 404 : url.includes("missing") ? 410 : 200))
    );
    expect(out.map((r) => r.url)).toEqual(["https://a.example/ok"]);
  });

  it("keeps resources on any uncertainty (timeouts, network errors, 5xx, 403)", async () => {
    const resources = [
      draft("https://a.example/timeout"),
      draft("https://b.example/rate-limited"),
      draft("https://c.example/blocked"),
      draft("https://d.example/slow"),
    ];
    const out = await verifyResourceLinks(
      resources,
      check((url) => {
        if (url.includes("timeout")) return undefined; // network error — no status
        if (url.includes("rate-limited")) return 429;
        if (url.includes("blocked")) return 403;
        return 503;
      })
    );
    expect(out).toHaveLength(4);
  });

  it("returns an empty array for no resources", async () => {
    await expect(verifyResourceLinks([], check(() => 200))).resolves.toEqual([]);
  });
});
