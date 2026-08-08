import { clsx } from "@/lib/clsx";

// The Acjon text-slider separator glyph (four-point star, see index.html
// "text slider start") shared by the home Marquee and Footer strips.
export function Star({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={clsx("h-5 w-5 shrink-0", className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.2466 0.59799C17.0724 10.1992 25.4559 17.3574 35.0679 16.6685C25.4667 17.4942 18.3085 25.8777 18.9974 35.4897C18.1717 25.8885 9.78818 18.7303 0.17618 19.4193C9.7774 18.5935 16.9356 10.21 16.2466 0.59799Z" />
    </svg>
  );
}
