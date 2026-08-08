import type { Metadata } from "next";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
