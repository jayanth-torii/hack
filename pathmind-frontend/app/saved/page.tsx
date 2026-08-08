import Link from "next/link";
import { SavedRoadmaps } from "@/components/sections/SavedRoadmaps";

export default function SavedPage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/10 bg-card/70 px-6 py-4 backdrop-blur-xl">
        <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Vidhyora home">
          <span className="logo-chip flex h-7 w-7 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vidhyora-logo.png"
              alt=""
              width={30}
              height={30}
              className="h-7 w-7"
            />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Vidhyora
          </span>
        </Link>
      </header>
      <main className="pt-24">
        <SavedRoadmaps />
      </main>
    </>
  );
}
