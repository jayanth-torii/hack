import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";
import { logger } from "./logger";

let connected = false;
let memoryServer: MongoMemoryServer | null = null;
let retrying = false;

/** Live connection state, used by GET /health to report honestly. */
export function isDbConnected(): boolean {
  // readyState 1 === connected. Trust mongoose over our own flag, so a
  // connection that drops after startup is reported as down.
  return mongoose.connection.readyState === 1;
}

export function dbStatus(): "connected" | "connecting" | "disconnected" {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    default:
      return "disconnected";
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (connected && isDbConnected()) return mongoose;
  mongoose.set("strictQuery", true);

  const uri = env.MONGO_URI;

  const conn = await mongoose.connect(uri, {
    // Default is 30s, which makes every failed attempt take half a minute
    // and delays the first useful error. 10s is long enough for a healthy
    // Atlas replica-set election and short enough to retry promptly.
    serverSelectionTimeoutMS: 10_000,
  });
  connected = true;
  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return mongoose;
}

/**
 * Turns a driver error into something a human can act on.
 *
 * `MongooseServerSelectionError` with every replica-set member reported as
 * `Unknown` means the driver never got a reply — which is almost always an
 * Atlas-side network block rather than anything wrong with this service.
 */
function explain(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.name !== "MongooseServerSelectionError") return null;
  return (
    "Could not reach MongoDB. This is usually an Atlas-side problem, not a bug in this service: " +
    "(1) the host's outbound IP is not on the Atlas IP Access List " +
    "(Atlas → Network Access), or " +
    "(2) a free-tier M0 cluster has auto-paused after inactivity (Atlas → resume it), or " +
    "(3) MONGO_URI points at the wrong cluster or has stale credentials."
  );
}

/**
 * Connects in the background, retrying with exponential backoff, and never
 * rejects.
 *
 * The server used to `await connectDB()` *before* `app.listen()`, so an
 * unreachable database meant the port was never bound — the platform's port
 * scan failed, the process exited 1, and it crash-looped. Binding first and
 * connecting here means the service stays up with an honest `/health`
 * signal, and recovers on its own the moment the database becomes reachable
 * (no redeploy needed).
 *
 * @param onConnected run once, the first time the connection succeeds.
 */
export function connectWithRetry(onConnected?: () => void): void {
  if (retrying) return;
  retrying = true;

  const BASE_DELAY_MS = 2_000;
  const MAX_DELAY_MS = 60_000;
  let attempt = 0;

  const attemptConnect = async (): Promise<void> => {
    attempt += 1;
    try {
      await connectDB();
      retrying = false;
      onConnected?.();
    } catch (err) {
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      const hint = explain(err);
      logger.error(
        { err, attempt, retryInMs: delay, ...(hint ? { hint } : {}) },
        "MongoDB connection failed — service is up but degraded; retrying"
      );
      setTimeout(() => void attemptConnect(), delay).unref();
    }
  };

  void attemptConnect();
}

export async function disconnectDB(): Promise<void> {
  retrying = false;
  if (!connected) return;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  connected = false;
}
