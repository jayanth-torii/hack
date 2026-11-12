"use client";

import { useMemo, useState, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Illustration } from "@/components/ui/Illustration";
import { ArrowRightIcon, CheckCircleIcon, MedalIcon } from "@/components/profile/ProfileIcons";
import type { CertProvider, Certification } from "@/types/resource";

/**
 * External certificates gathered from every stage of a roadmap.
 *
 * This is a sibling of the Resources and Practice tabs in
 * `components/sections/RoadmapJourney.tsx` and deliberately borrows their
 * opener (eyebrow → headline → one supporting line), their card shape and
 * their empty state, so switching to it doesn't feel like switching apps.
 *
 * The list arrives already flattened and de-duplicated across stages — this
 * component only orders, filters and renders it.
 */

/* ── Price semantics ──────────────────────────────────────────────────────
 *
 * `price` is three different statements wearing one field, and the UI has to
 * keep them apart or it lies:
 *
 *   0     the certificate itself costs nothing
 *   > 0   an **approximate** exam fee in USD — an estimate we hold, not a
 *         price anyone quoted today, so it is never rendered as an exact figure
 *   null  cost varies (subscription, or free to audit with a paid certificate)
 *         — and a number is never invented to fill the gap
 *
 * Each kind gets a word, not just a colour (CLAUDE.md §6).
 */
type PriceKind = "free" | "approx" | "varies";

function priceKind(price: number | null): PriceKind {
  if (price === null) return "varies";
  return price > 0 ? "approx" : "free";
}

/** Whole dollars — an estimate carrying cents would claim a precision it
 *  doesn't have. */
function usd(price: number): string {
  return `$${Math.round(price).toLocaleString("en-US")}`;
}

const PROVIDER_LABEL: Record<CertProvider, string> = {
  coursera: "Coursera",
  udemy: "Udemy",
  aws: "AWS",
  google: "Google",
  microsoft: "Microsoft",
  other: "Certificate",
};

/** Free first, then estimated fees, then the ones whose cost we can't state. */
const GROUP_ORDER: Record<PriceKind, number> = { free: 0, approx: 1, varies: 2 };

/* ── Icons — 24px grid, 1.8 stroke, no icon library (CLAUDE.md §1) ──────── */

const S = "currentColor";

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M11.3 3.5H4.9a1.4 1.4 0 00-1.4 1.4v6.4c0 .37.15.73.41 1l7.4 7.4a1.4 1.4 0 002 0l6.4-6.4a1.4 1.4 0 000-2l-7.4-7.4a1.4 1.4 0 00-1-.4z"
        stroke={S}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="8.2" r="1.4" stroke={S} strokeWidth="1.8" />
    </svg>
  );
}

function ScalesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4.2v15.6M6.5 19.8h11M4.2 9.2h15.6M6.2 5.8L4.2 9.2M17.8 5.8l2 3.4"
        stroke={S}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M1.8 13.4a3.1 3.1 0 004.8 0M17.4 13.4a3.1 3.1 0 004.8 0" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ── Price badge ─────────────────────────────────────────────────────────── */

/**
 * The badge always carries a word. "Free" is green *and* says Free; an
 * estimate wears a `≈` and the word "approx." so it can't be mistaken for a
 * checkout price; "Cost varies" states the uncertainty instead of papering
 * over it with a 0.
 */
function PriceBadge({ price }: { price: number | null }) {
  if (price !== null && price > 0) {
    return (
      <Badge tone="warning" icon={<TagIcon />}>
        {`≈ ${usd(price)} approx. fee`}
      </Badge>
    );
  }

  if (price !== null) {
    return (
      <Badge tone="success" icon={<CheckCircleIcon />}>
        Free
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" icon={<ScalesIcon />}>
      Cost varies
    </Badge>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────── */

/**
 * One certificate. The whole card is the link — the arrow is a desktop-only
 * hover affordance, and the tile is the touch target either way.
 */
function CertCard({ cert }: { cert: Certification }) {
  return (
    <li className="group min-w-0">
      <a
        href={cert.url}
        target="_blank"
        rel="noopener noreferrer"
        className="state-layer flex min-h-touch gap-4 rounded-lg border border-md-outline-variant/70 bg-md-surface-container-low/70 p-4 shadow-e1 backdrop-blur-sm transition-colors duration-fast ease-standard hover:border-md-primary/60"
      >
        <span className="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-md bg-md-primary-container text-md-on-primary-container">
          <MedalIcon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-label-sm uppercase tracking-[0.2em] text-md-primary">
            {PROVIDER_LABEL[cert.provider]}
          </span>
          <span className="mt-1.5 block break-words text-body-lg font-medium text-md-on-surface">
            {cert.title}
          </span>
          <span className="mt-2.5 flex">
            <PriceBadge price={cert.price} />
          </span>
        </span>

        <span
          aria-hidden
          className="mt-0.5 flex-none self-start text-md-on-surface-variant transition-transform duration-fast ease-standard group-hover:translate-x-1 group-hover:text-md-primary"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </span>
      </a>
    </li>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

/** Section opener, matching `TabIntro` in `RoadmapJourney`. */
function Intro({ title, copy }: { title: ReactNode; copy: string }) {
  return (
    <div className="mt-8 max-w-2xl">
      <Eyebrow>External certificates</Eyebrow>
      <h2 className="mt-4 text-headline-sm leading-[1.2] text-md-on-surface sm:text-headline-md">
        {title}
      </h2>
      <p className="mt-3 text-body-md text-md-on-surface-variant sm:text-body-lg">{copy}</p>
    </div>
  );
}

export function CertificatesPanel({
  certifications,
}: {
  certifications: Certification[];
}): JSX.Element {
  const [freeOnly, setFreeOnly] = useState(false);

  /** Free first, then estimated fees, then "varies"; `rank` holds inside each
   *  group, with the title as a tiebreak so the order can't wobble between
   *  renders when two entries share a rank. */
  const ordered = useMemo(
    () =>
      [...certifications].sort((a, b) => {
        const group = GROUP_ORDER[priceKind(a.price)] - GROUP_ORDER[priceKind(b.price)];
        if (group !== 0) return group;
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.title.localeCompare(b.title);
      }),
    [certifications]
  );

  const freeCount = useMemo(
    () => ordered.filter((cert) => priceKind(cert.price) === "free").length,
    [ordered]
  );

  const shown = freeOnly ? ordered.filter((cert) => priceKind(cert.price) === "free") : ordered;

  if (certifications.length === 0) {
    return (
      <div>
        <Intro
          title={
            <>
              Credentials worth <span className="text-md-primary">putting on a CV</span>
            </>
          }
          copy="Recognised certificates from the providers behind this roadmap's stages. They appear here as soon as a stage carries one."
        />
        <div className="mt-6 flex flex-col items-center rounded-xl border border-md-outline-variant/60 bg-md-surface-container-low/50 px-6 py-12 text-center backdrop-blur-sm">
          <Illustration name="certificate" glow alt="" className="h-32 w-32" />
          <p className="mt-6 text-title-md text-md-on-surface">No certificates yet</p>
          <p className="mt-2 max-w-sm text-body-md text-md-on-surface-variant">
            None of this roadmap&rsquo;s stages name an external certificate. Your Vidhyora
            completion certificate is unaffected — it&rsquo;s issued from your progress, not from
            this list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Intro
        title={
          <>
            Credentials worth <span className="text-md-primary">putting on a CV</span>
          </>
        }
        copy="Certificates offered by the providers behind this roadmap. Fees shown are approximate estimates in USD, not quoted prices — check the provider's page before you pay."
      />

      {/* Filter — an M3 filter chip on the same rail the tabs use. Hidden when
          everything is free or nothing is, since the control would then return
          all of the list or none of it. */}
      {freeCount > 0 && freeCount < ordered.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={freeOnly}
            onClick={() => setFreeOnly((value) => !value)}
            className={clsx(
              "state-layer press inline-flex min-h-touch items-center gap-2 rounded-sm border px-4 text-label-lg font-medium transition-colors duration-fast ease-standard",
              freeOnly
                ? "border-transparent bg-md-secondary-container text-md-on-secondary-container"
                : "border-md-outline text-md-on-surface-variant"
            )}
          >
            <CheckCircleIcon className="h-[1.125rem] w-[1.125rem]" />
            Free only ({freeCount})
          </button>
        </div>
      )}

      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
        {shown.map((cert) => (
          <CertCard key={`${cert.provider}-${cert.url}`} cert={cert} />
        ))}
      </ul>

      <p className="mt-4 text-body-sm text-md-on-surface-variant">
        Prices and availability are set by each provider and change without notice. &ldquo;Cost
        varies&rdquo; means the certificate sits behind a subscription, or the course is free to
        audit with a paid certificate.
      </p>
    </div>
  );
}
