import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Roboto is Material 3's reference typeface, and the type scale in
// tailwind.config.ts is specified against its metrics — the weights below are
// the ones M3 actually uses (400 body/display, 500 title/label, 700 for the
// few places the product wants extra emphasis). One family, no second webfont.
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"],
});

const SITE_URL = "https://vidhyora.vercel.app";
const SITE_TITLE = "Vidhyora — AI Learning Roadmap Generator & Personalized Study Planner";
const SITE_DESCRIPTION =
  "Turn any topic into a complete, difficulty-sequenced learning roadmap — AI syllabus, free verified resources, certifications, practice problems and a daily study timeline, unlocked one stage at a time.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Vidhyora" },
  description: SITE_DESCRIPTION,
  applicationName: "Vidhyora",
  authors: [{ name: "Jayanth", url: "https://jayanth45.vercel.app/" }],
  creator: "Jayanth",
  publisher: "Vidhyora",
  keywords: [
    "AI learning roadmap",
    "learning roadmap generator",
    "personalized study plan",
    "AI study planner",
    "AI syllabus generator",
    "free online learning resources",
    "skill learning roadmap",
    "coding practice problems",
    "DSA roadmap",
    "React learning roadmap",
    "machine learning roadmap",
    "system design roadmap",
    "certification roadmap",
    "daily study timeline",
    "Vidhyora",
    "Vidhyora AI",
    "AI roadmap generator",
    "learn anything roadmap",
    "AI learning path generator",
    "AI tutor learning path",
    "study plan generator",
    "personalized learning platform",
    "self-paced online learning",
    "learning path for beginners",
    "programming roadmap",
    "web development roadmap",
    "full stack developer roadmap",
    "python learning roadmap",
    "data structures and algorithms practice",
    "interview preparation roadmap",
    "free certifications online",
    "skill development platform",
    "learn coding step by step",
    "AI learning assistant",
  ],
  openGraph: {
    type: "website",
    siteName: "Vidhyora",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/vidhyora-logo.png", alt: "Vidhyora" }],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/vidhyora-logo.png"],
  },
  robots: { index: true, follow: true },
  // Google Search Console ownership verification (renders <meta name="google-site-verification">)
  verification: { google: "kB1sqTo6dF_UJ8eLCM2yUEazy0zuP_0B8LpzPLxixw0" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Vidhyora" },
  formatDetection: { telephone: false },
};

/**
 * `viewportFit: "cover"` lets the app paint edge-to-edge behind the notch and
 * the home indicator; every fixed bar then pays that back via the
 * `env(safe-area-inset-*)` tokens in globals.css. `maximumScale` is left
 * unset deliberately — pinch-zoom must stay available (WCAG 1.4.4).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // One colour, because the app ships dark-only (see LIGHT_MODE_ENABLED in
  // lib/useTheme.tsx). A light `themeColor` here would tint the browser chrome
  // light on a phone set to light mode while the page itself stayed dark.
  themeColor: "#010103",
};

// Structured data (JSON-LD) so search engines understand what Vidhyora is and who built it
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vidhyora",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  creator: { "@type": "Person", name: "Jayanth", url: "https://jayanth45.vercel.app/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="min-h-screen bg-ink font-sans text-subtle antialiased">
        {/* Keyboard users get past the fixed header without tabbing the nav */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-on-accent"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
