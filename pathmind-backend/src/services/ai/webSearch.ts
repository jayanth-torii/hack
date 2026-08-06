import { env } from "@/config/env";
import { logger } from "@/config/logger";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Web-grounding search used for (a) sourcing real "best resources" links
 * during generation and (b) re-searching stale/dead links in the freshness
 * worker. Wrapped behind one function so the concrete provider (Tavily,
 * Serper, Bing, ...) is an implementation detail set by SEARCH_PROVIDER.
 *
 * In MOCK_MODE this returns deterministic, plausible-looking results with no
 * network call — the AI providers are prompted to only cite URLs present in
 * this context, so even the mock path exercises the "don't hallucinate
 * URLs" guarantee end-to-end.
 */
export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  if (env.MOCK_MODE) {
    return mockSearch(query, limit);
  }

  if (!env.SEARCH_API_KEY) {
    logger.warn("SEARCH_API_KEY not set; falling back to mock search results");
    return mockSearch(query, limit);
  }

  try {
    // Tavily-compatible request shape; swap this block if SEARCH_PROVIDER differs.
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.SEARCH_API_KEY,
        query,
        max_results: limit,
      }),
    });
    if (!response.ok) throw new Error(`Search API responded ${response.status}`);
    const data = (await response.json()) as {
      results: Array<{ title: string; url: string; content: string }>;
    };
    return data.results.slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));
  } catch (err) {
    logger.error({ err }, "webSearch failed, falling back to mock results");
    return mockSearch(query, limit);
  }
}

function mockSearch(query: string, limit: number): SearchResult[] {
  const topic = query.trim().toLowerCase().replace(/\s+/g, "-");
  const templates: SearchResult[] = [
    {
      title: `${query} — freeCodeCamp Handbook`,
      url: `https://www.freecodecamp.org/news/${topic}-handbook/`,
      snippet: `A comprehensive, beginner-friendly guide to ${query}.`,
    },
    {
      title: `${query} full course — YouTube`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " full course")}`,
      snippet: `Top community-recommended video playlist covering ${query} end to end.`,
    },
    {
      title: `${query} — MDN / Official Docs`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
      snippet: `Official reference documentation relevant to ${query}.`,
    },
    {
      title: `${query} — GeeksforGeeks`,
      url: `https://www.geeksforgeeks.org/${topic}/`,
      snippet: `Structured tutorial and practice problems on ${query}.`,
    },
    {
      title: `Best ${query} certifications ranked (2026)`,
      url: `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
      snippet: `A ranked comparison of paid certifications for ${query}.`,
    },
  ];
  return templates.slice(0, limit);
}
