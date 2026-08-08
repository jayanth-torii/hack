import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";
import { logger } from "./logger";

let connected = false;
let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (connected) return mongoose;
  mongoose.set("strictQuery", true);

  let uri = env.MONGO_URI;

  const conn = await mongoose.connect(uri);
  connected = true;
  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  connected = false;
}
