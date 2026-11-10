import type { MetadataRoute } from "next";

const SITE_URL = "https://vidhyora.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / account pages should not be indexed
        disallow: ["/auth/", "/profile", "/saved", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
