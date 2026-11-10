/**
 * Icon set for the profile, library and roadmap screens.
 *
 * Inline SVG on the project's 24px grid with round caps — CLAUDE.md §1 forbids
 * pulling in an icon library alongside the existing hand-rolled family.
 */

type IconProps = { className?: string };

const S = "currentColor";

export function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke={S} strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke={S} strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke={S} strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke={S} strokeWidth="1.8" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4.2" cy="6.5" r="1.3" fill={S} />
      <circle cx="4.2" cy="12" r="1.3" fill={S} />
      <circle cx="4.2" cy="17.5" r="1.3" fill={S} />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3.2l8.4 4.3-8.4 4.3-8.4-4.3L12 3.2z" fill={S} />
      <path d="M4.2 12.1l7.8 4 7.8-4" stroke={S} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.2 16.3l7.8 4 7.8-4" stroke={S} strokeWidth="1.8" strokeLinejoin="round" opacity=".55" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3.6 5.2A14.6 14.6 0 0112 4a14.6 14.6 0 018.4 1.2v13A14.6 14.6 0 0012 17a14.6 14.6 0 00-8.4 1.2v-13z"
        stroke={S}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 4.6v12.2" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="14.5" r="5.5" stroke={S} strokeWidth="1.8" />
      <path d="M9 9.2L6.5 3.5h11L15 9.2" stroke={S} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10.2 14.5l1.3 1.3 2.5-2.6" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="13" width="4" height="7.5" rx="1.2" fill={S} />
      <rect x="10" y="8.5" width="4" height="12" rx="1.2" fill={S} />
      <rect x="16.5" y="3.5" width="4" height="17" rx="1.2" fill={S} />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3.8 12a8.2 8.2 0 103-6.3M3.5 4.2v3.6h3.6"
        stroke={S}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 7.6V12l2.8 1.7" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3.2" stroke={S} strokeWidth="1.8" />
      <path
        d="M12 2.8l1.3 2.3 2.6-.5.5 2.6 2.3 1.3-1.3 2.3 1.3 2.3-2.3 1.3-.5 2.6-2.6-.5L12 21.2l-1.3-2.3-2.6.5-.5-2.6-2.3-1.3L6.6 12 5.3 9.7l2.3-1.3.5-2.6 2.6.5L12 2.8z"
        stroke={S}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.8s4.8 3.6 4.8 8.4a4.8 4.8 0 01-1.5 3.5c.1-1.8-.9-3.3-2.2-4.2.2 2.4-1 3.6-1 3.6s-.7-1-1.8-1.3c.4 1.6-.6 2.6-.6 2.6a4.2 4.2 0 01-2.5-3.8c0-2.2 1.3-3.6 1.3-3.6s.3 1.2 1.2 1.8c-.4-3.2 2.3-5.4 2.3-7z"
        fill={S}
      />
      <path d="M12 21.2a6.4 6.4 0 006.4-6.4c0-1-.2-2-.6-2.9" stroke={S} strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.4" stroke={S} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" stroke={S} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1" fill={S} />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 4.2h10v4.3a5 5 0 11-10 0V4.2z" stroke={S} strokeWidth="1.8" strokeLinejoin="round" />
      <path
        d="M7 5.6H4.4v1.6A3.2 3.2 0 007.2 10.3M17 5.6h2.6v1.6a3.2 3.2 0 01-2.8 3.1M9.6 19.8h4.8M12 13.6v6.2"
        stroke={S}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RocketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13.8 3.4c3.4-.5 6.3 2.4 5.8 5.8-.4 2.9-2.5 5.6-5.2 7.3l-.9 3.6-3-1.8-1.8-3-3-1.8 3.6-.9c1.7-2.7 4.4-4.8 7.3-5.2z"
        stroke={S}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="14.6" cy="8.6" r="1.6" stroke={S} strokeWidth="1.8" />
      <path d="M6.6 17.4l-2.4 2.4" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 2.5L4.8 13.2a.6.6 0 00.48.97H11l-.9 7.33 8.2-10.7a.6.6 0 00-.48-.97H12.1L13 2.5z"
        fill={S}
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.25" y="5.25" width="17.5" height="15.5" rx="3" stroke={S} strokeWidth="1.8" />
      <path d="M3.5 10h17M8 3.5v3.5M16 3.5v3.5" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill={S} />
      <path
        d="M7.8 12.3l2.9 2.9 5.5-6"
        stroke="rgb(var(--color-ink))"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.4" stroke={S} strokeWidth="1.9" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4.6" y="10.2" width="14.8" height="10" rx="2.6" stroke={S} strokeWidth="1.8" />
      <path d="M8 10.2V7a4 4 0 118 0v3.2" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.6l5.9-.8L12 3.4z"
        stroke={S}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={filled ? S : "none"}
      />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3.6v11M7.6 10.4l4.4 4.4 4.4-4.4" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.4 16.6v1.8a2 2 0 002 2h11.2a2 2 0 002-2v-1.8" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 19.5h3.2L19 8.2a2.3 2.3 0 00-3.2-3.2L4.5 16.3v3.2z"
        stroke={S}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14.6 6.2l3.2 3.2" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SignOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14.4 4.4H6.8a2 2 0 00-2 2v11.2a2 2 0 002 2h7.6" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.8 12h7.4M17.4 8.6l3.4 3.4-3.4 3.4" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5.2v13.6M5.2 12h13.6" stroke={S} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4.8 12h14m0 0l-5.2-5.2M18.8 12l-5.2 5.2" stroke={S} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.4" stroke={S} strokeWidth="1.8" />
      <path d="M12 7.4V12l3 1.8" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9.5 7.8v8.4a.6.6 0 00.92.5l6.3-4.2a.6.6 0 000-1l-6.3-4.2a.6.6 0 00-.92.5z" fill={S} />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.6" stroke={S} strokeWidth="1.8" />
      <path d="M15.2 8.8l-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6z" stroke={S} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.6" stroke={S} strokeWidth="1.8" />
      <path d="M12 7.6v5" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15.9" r="1.1" fill={S} />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4.8 12.6l4.6 4.6 9.8-9.8" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8" stroke={S} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Maps the backend's achievement icon keys onto the set above. */
export const ACHIEVEMENT_ICONS = {
  rocket: RocketIcon,
  bolt: BoltIcon,
  book: BookIcon,
  flame: FlameIcon,
  trophy: TrophyIcon,
  target: TargetIcon,
} as const;
