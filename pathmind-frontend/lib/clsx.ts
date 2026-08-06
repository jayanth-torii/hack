// Tiny className joiner so we don't need a dependency for something this small.
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
