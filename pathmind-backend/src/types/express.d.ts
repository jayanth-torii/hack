// Augments Express's Request type with the decoded-JWT auth payload attached
// by auth.middleware.ts, so controllers get typed access without casts.
export interface AuthPayload {
  userId: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export {};
