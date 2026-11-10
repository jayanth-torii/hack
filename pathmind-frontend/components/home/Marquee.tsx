import { clsx } from "@/lib/clsx";
import { Star } from "./Star";

// Acjon text-slider pattern (see index.html "text slider start"): rows of
// repeated keywords separated by star glyphs, drifting in opposite
// directions. Pure CSS animation, disabled for reduced-motion users.

const ROW_ONE = [
  "AI syllabus",
  "Freshness-verified resources",
  "Practice arena",
  "Calendar export",
  "Difficulty-sequenced",
  "Free tutorials",
];

const ROW_TWO = [
  "Learn one stage at a time",
  "Server-enforced progress",
  "Ranked certifications",
  "Daily timeline",
  "Zero hallucinated links",
  "Your AI learning twin",
];

function Row({
  items,
  reverse = false,
  variant = "ink",
}: {
  items: string[];
  reverse?: boolean;
  variant?: "ink" | "accent";
}) {
  // Two identical copies of the list make translateX(-50%) loop seamlessly.
  const list = [...items, ...items];
  return (
    <div
      className={clsx(
        "overflow-hidden whitespace-nowrap py-5",
        // M3 keeps large fields on a *container* role rather than the vivid
        // primary, so the strip stays brand-coloured without shouting over the
        // one filled button on the page.
        variant === "ink"
          ? "border-y border-md-outline-variant/60 bg-md-surface"
          : "bg-md-primary-container"
      )}
    >
      <div
        className={clsx(
          "inline-flex items-center motion-reduce:animate-none",
          reverse ? "animate-marqueeReverse" : "animate-marquee"
        )}
      >
        {list.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={clsx(
              "inline-flex items-center gap-6 px-6 uppercase",
              variant === "ink" ? "text-md-on-surface" : "text-md-on-primary-container",
              reverse ? "text-label-lg md:text-title-md" : "text-title-lg md:text-headline-sm"
            )}
          >
            {item}
            <Star
              className={clsx(
                "h-5 w-5 md:h-6 md:w-6",
                variant === "ink" ? "text-md-primary" : "text-md-on-primary-container/70"
              )}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-hidden>
      <Row items={ROW_ONE} />
      <Row items={ROW_TWO} reverse variant="accent" />
    </section>
  );
}
