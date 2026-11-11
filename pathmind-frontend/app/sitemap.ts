import type { MetadataRoute } from "next";

const SITE_URL = "https://vidhyora.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only public, indexable pages. Auth, profile and saved-roadmap pages are
  // intentionally excluded (see robots.ts).
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The catalog is the one signed-out page with real content behind it,
      // so it is the page worth indexing after the home page.
      url: `${SITE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // The build page is the product's front door for a visitor who arrives
      // already knowing what they want to learn.
      url: `${SITE_URL}/build`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
