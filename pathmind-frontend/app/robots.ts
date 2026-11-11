import type { MetadataRoute } from "next";

const SITE_URL = "https://vidhyora.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / account pages should not be indexed
        // `/courses` itself stays indexable — only the account-bound pages
        // and the admin area are excluded.
        disallow: ["/auth/", "/profile", "/saved", "/admin", "/courses/build", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
