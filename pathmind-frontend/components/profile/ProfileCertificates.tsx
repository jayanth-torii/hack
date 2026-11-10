"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCertificates, useDownloadCertificate } from "@/hooks/useProfileQuery";
import { AlertIcon, ArrowRightIcon, DownloadIcon, MedalIcon } from "./ProfileIcons";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Certificates this learner has actually earned.
 *
 * These are credentials Vidhyora issued for finishing a roadmap end to end —
 * not the third-party certification links that appear inside a stage. A
 * certificate only exists once the server has verified every stage is
 * complete, so this list is never aspirational.
 *
 * Each credential is an M3 filled card.
 */
export function ProfileCertificates() {
  const certificates = useCertificates();
  const download = useDownloadCertificate();

  if (certificates.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (certificates.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-md-error-container p-6 text-md-on-error-container"
      >
        <p className="flex items-center gap-2 text-title-md">
          <AlertIcon className="h-5 w-5 shrink-0" />
          Couldn&apos;t load your certificates
        </p>
        <p className="mt-1 text-body-md">
          Check your connection and reload — nothing has been lost.
        </p>
        <button
          type="button"
          onClick={() => void certificates.refetch()}
          className="press state-layer mt-3 inline-flex min-h-touch items-center rounded-full border border-current px-5 text-label-lg"
        >
          Try again
        </button>
      </div>
    );
  }

  if ((certificates.data ?? []).length === 0) {
    return (
      <div className="rounded-lg bg-md-surface-container-highest px-4 py-14 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-md-primary-container text-md-on-primary-container">
          <MedalIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-title-lg font-medium text-md-on-surface">No certificates yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-body-md text-md-on-surface-variant">
          Finish every stage of a roadmap and its certificate is issued automatically — you can
          download it here as a PDF.
        </p>
        <Link
          href="/saved"
          className="press state-layer mt-5 inline-flex min-h-touch items-center gap-2 rounded-full border border-md-outline px-5 text-label-lg text-md-primary"
        >
          Go to your roadmaps
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {(certificates.data ?? []).map((certificate) => (
        <li
          key={certificate.id}
          className="rounded-lg bg-md-surface-container-highest p-5 text-md-on-surface"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-md-primary-container text-md-on-primary-container">
              <MedalIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-title-md text-md-on-surface">{certificate.topic}</h2>
              <p className="mt-0.5 text-body-sm text-md-on-surface-variant">
                {certificate.stagesCompleted} stages · issued {formatDate(certificate.issuedAt)}
              </p>
            </div>
          </div>

          <dl className="mt-4 space-y-1.5 border-t border-md-outline-variant pt-4 text-body-sm">
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-md-on-surface-variant">Awarded to</dt>
              <dd className="min-w-0 truncate text-md-on-surface">{certificate.recipientName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-md-on-surface-variant">Serial</dt>
              {/* A serial has no spaces, so without an explicit break it is one
                  unbreakable word that pushes the card past the viewport. */}
              <dd className="min-w-0 break-all text-right font-mono text-label-sm text-md-on-surface">
                {certificate.serial}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => download.mutate({ id: certificate.id, topic: certificate.topic })}
            disabled={download.isPending}
            aria-busy={download.isPending}
            className="press state-layer mt-4 inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-full bg-md-primary px-5 text-label-lg text-md-on-primary disabled:pointer-events-none disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]"
          >
            <DownloadIcon className="h-4 w-4" />
            {download.isPending ? "Preparing…" : "Download PDF"}
          </button>
        </li>
      ))}
    </ul>
  );
}
