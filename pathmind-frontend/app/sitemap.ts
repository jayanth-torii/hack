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
  ];
}
