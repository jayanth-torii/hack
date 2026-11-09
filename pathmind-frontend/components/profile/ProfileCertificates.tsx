"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCertificates, useDownloadCertificate } from "@/hooks/useProfileQuery";
import { ArrowRightIcon, DownloadIcon, MedalIcon } from "./ProfileIcons";

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
 */
export function ProfileCertificates() {
  const certificates = useCertificates();
  const download = useDownloadCertificate();

  if (certificates.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (certificates.isError) {
    return (
      <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-6">
        <p className="text-sm font-semibold text-danger">Couldn&apos;t load your certificates</p>
        <p className="mt-1 text-sm text-muted">
          Check your connection and reload — nothing has been lost.
        </p>
      </div>
    );
  }

  if ((certificates.data ?? []).length === 0) {
    return (
      <div className="rounded-xl border border-accent/20 bg-card/40 px-6 py-14 text-center backdrop-blur-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-accent/30 bg-accent/[0.10] text-accent-text">
          <MedalIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-paper">No certificates yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Finish every stage of a roadmap and its certificate is issued automatically — you can
          download it here as a PDF.
        </p>
        <Link
          href="/saved"
          className="press mt-5 inline-flex min-h-touch items-center gap-2 rounded-full border border-accent/45 px-5 text-sm font-semibold text-accent-text transition-colors duration-fast hover:bg-accent/12"
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
          className="rounded-xl border border-accent/25 bg-card/40 p-5 shadow-[0_0_50px_-24px_rgb(var(--color-accent)/0.6)] backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-accent/35 bg-accent/[0.10] text-accent-text">
              <MedalIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-bold text-paper">
                {certificate.topic}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {certificate.stagesCompleted} stages · issued {formatDate(certificate.issuedAt)}
              </p>
            </div>
          </div>

          <dl className="mt-4 space-y-1.5 border-t border-line/10 pt-4 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Awarded to</dt>
              <dd className="truncate font-medium text-subtle">{certificate.recipientName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Serial</dt>
              <dd className="font-mono text-[0.6875rem] text-subtle">{certificate.serial}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => download.mutate({ id: certificate.id, topic: certificate.topic })}
            disabled={download.isPending}
            aria-busy={download.isPending}
            className="press mt-4 inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
          >
            <DownloadIcon className="h-4 w-4" />
            {download.isPending ? "Preparing…" : "Download PDF"}
          </button>
        </li>
      ))}
    </ul>
  );
}
