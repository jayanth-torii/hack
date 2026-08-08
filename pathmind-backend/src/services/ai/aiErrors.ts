/**
 * Maps an AI SDK failure to a human-friendly message so users aren't shown a
 * raw 429/5xx error blob when generation fails.
 */
export function friendlyError(err: unknown): Error {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : undefined;

  if (status === 429) {
    return new Error("The AI service is busy — please wait a minute and try again.");
  }
  if (status && status >= 500) {
    return new Error("The AI service hit a temporary error — please try again.");
  }
  return new Error("The AI service is unreachable — please try again.");
}
