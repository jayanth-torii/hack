// Augments Express's Request type with the decoded-JWT auth payload attached
// by auth.middleware.ts, so controllers get typed access without casts.
export interface AuthPayload {
  userId: string;
  email: string;
  /**
   * Carried for convenience (logging, cheap UI hints) only. **Never authorize
   * on it** — a token minted before a demotion still says "admin" for up to
   * its 15-minute lifetime. `requireAdmin` re-reads the role from the
   * database on every request, which is the authoritative check.
   */
  role?: "user" | "admin";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      /** Set by `requireAdmin` only, after a live database role check. */
      admin?: { userId: string; email: string };
    }
  }
}

export {};
