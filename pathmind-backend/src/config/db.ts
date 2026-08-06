import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

let connected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (connected) return mongoose;
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(env.MONGO_URI);
  connected = true;
  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
