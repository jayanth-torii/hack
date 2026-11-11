import Link from "next/link";
import { Star } from "./Star";
import { GeometryShapes } from "./GeometryShapes";

const MAIN_MENU = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Course catalog" },
  { href: "/saved", label: "Saved roadmaps" },
  { href: "#how", label: "How it works" },
];

const PRODUCT = [
  { href: "/courses/build", label: "Build a course" },
  { href: "/auth/register", label: "Create account" },
  { href: "/auth/login", label: "Log in" },
  { href: "/build", label: "Build your path" },
];

const MARQUEE_WORDS = [
  "Vidhyora",
  "Learn in sequence",
  "Unlock the next stage",
  "Freshness-verified",
  "Your AI digital twin",
];

export function Footer() {
  // The fixed BottomNav is mobile-only, so the footer pays back its height
  // here; `main` must not, or the page grows an empty band above the footer
  // while the footer itself still sits behind the nav.
  return (
    <footer className="relative overflow-hidden bg-md-surface-container-lowest pb-[calc(var(--bottom-nav-h)+var(--safe-bottom))] md:pb-0">
      <GeometryShapes variant="footer" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-20 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex min-h-touch-min items-center gap-2.5">
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
            <span className="text-title-lg text-md-on-surface">Vidhyora</span>
          </Link>
          <p className="mt-4 max-w-xs text-body-md text-md-on-surface-variant">
            Your AI digital twin for learning — turn any topic into a sequenced, freshness-verified
            roadmap.
          </p>
        </div>

        <FooterColumn title="Main menu" links={MAIN_MENU} />
        <FooterColumn title="Product" links={PRODUCT} />

        <div>
          <h4 className="text-title-sm uppercase tracking-wider text-md-on-surface">
            Get in touch
          </h4>
          <ul className="mt-5 space-y-5 text-body-md text-md-on-surface-variant sm:space-y-3">
            <li>
              <a
                href="mailto:hello@vidhyora.app"
                className="-my-2.5 inline-flex min-h-touch-min items-center transition-colors duration-fast hover:text-md-primary"
              >
                hello@vidhyora.app
              </a>
            </li>
            <li>
              <a
                href="#start"
                className="-my-2.5 inline-flex min-h-touch-min items-center transition-colors duration-fast hover:text-md-primary"
              >
                Start learning free
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 border-t border-md-outline-variant/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-body-sm text-md-on-surface-variant sm:flex-row sm:px-6">
          <p>
            © 2026 Vidhyora. All rights reserved. Built by{" "}
            <a
              href="https://jayanth45.vercel.app/"
              target="_blank"
              rel="noopener author"
              className="font-medium text-md-on-surface transition-colors duration-fast hover:text-md-primary"
            >
              Jayanth
            </a>
          </p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="-my-2.5 inline-flex min-h-touch-min items-center transition-colors duration-fast hover:text-md-primary"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy"
              className="-my-2.5 inline-flex min-h-touch-min items-center transition-colors duration-fast hover:text-md-primary"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Acjon copyright-slider pattern: repeating wordmark strip */}
      <div className="overflow-hidden border-t border-md-outline-variant/60 py-6" aria-hidden>
        <div className="inline-flex w-max animate-marquee items-center motion-reduce:animate-none">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="inline-flex items-center gap-6 px-6 text-title-lg uppercase text-md-on-surface-variant/50"
            >
              {word}
              <Star className="h-5 w-5 text-md-primary/60" />
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
      <h4 className="text-title-sm uppercase tracking-wider text-md-on-surface">{title}</h4>
      <ul className="mt-5 space-y-5 text-body-md sm:space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="-my-2.5 inline-flex min-h-touch-min items-center text-md-on-surface-variant transition-colors duration-fast hover:text-md-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
