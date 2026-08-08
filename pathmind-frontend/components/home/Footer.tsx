import Link from "next/link";
import { Star } from "./Star";
import { GeometryShapes } from "./GeometryShapes";

const MAIN_MENU = [
  { href: "/", label: "Home" },
  { href: "/saved", label: "Saved roadmaps" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
];

const PRODUCT = [
  { href: "/auth/register", label: "Create account" },
  { href: "/auth/login", label: "Log in" },
  { href: "#start", label: "Generate a roadmap" },
];

const MARQUEE_WORDS = [
  "Vidhyora",
  "Learn in sequence",
  "Unlock the next stage",
  "Freshness-verified",
  "Your AI digital twin",
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink">
      <GeometryShapes variant="footer" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="logo-chip flex h-10 w-10 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vidhyora-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10"
              />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-paper">
              Vidhyora
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Your AI digital twin for learning — turn any topic into a sequenced, freshness-verified
            roadmap.
          </p>
        </div>

        <FooterColumn title="Main menu" links={MAIN_MENU} />
        <FooterColumn title="Product" links={PRODUCT} />

        <div>
          <h4 className="font-display text-sm font-medium uppercase tracking-wider text-muted">
            Get in touch
          </h4>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            <li>
              <a href="mailto:hello@vidhyora.app" className="transition-colors hover:text-accent">
                hello@vidhyora.app
              </a>
            </li>
            <li>
              <a href="#start" className="transition-colors hover:text-accent">
                Start learning free
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 border-t border-line/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted sm:flex-row">
          <p>© 2026 Vidhyora. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-accent">
              Terms &amp; Conditions
            </a>
            <a href="#" className="transition-colors hover:text-accent">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* Acjon copyright-slider pattern: repeating wordmark strip */}
      <div className="overflow-hidden border-t border-line/10 py-6" aria-hidden>
        <div className="inline-flex w-max animate-marquee items-center motion-reduce:animate-none">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="inline-flex items-center gap-6 px-6 font-display text-xl uppercase text-muted/50"
            >
              {word}
              <Star className="h-5 w-5 text-accent/60" />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h4>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-slate-500 transition-colors hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
