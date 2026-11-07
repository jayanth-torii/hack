import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Poppins is the site-wide font family (per the Acjon template's body type —
// see templates/acjon/assets/scss/utils/_typography.scss). Display headings
// use heavier Poppins weights with tight tracking instead of a second font.
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vidhyora — Your AI Digital Twin for Learning",
  description:
    "Turn any topic into a complete, difficulty-sequenced learning roadmap — syllabus, free resources, certifications, practice problems and a daily timeline, unlocked one stage at a time.",
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#010103" },
    { media: "(prefers-color-scheme: light)", color: "#f6f8f6" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-ink font-sans text-subtle antialiased">
        {/* Apply the saved/system theme before hydration to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("vidhyora-theme");if(t==="light"||(!t&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.classList.add("light")}catch(e){}`,
          }}
        />
        {/* Keyboard users get past the fixed header without tabbing the nav */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-on-accent"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
