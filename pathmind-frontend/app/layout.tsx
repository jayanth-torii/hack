import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "PathMind — AI Digital Twin for Learning",
  description: "Turn any topic into a complete, sequenced learning roadmap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-950 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
