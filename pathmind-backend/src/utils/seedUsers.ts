import mongoose from "mongoose";
import { User } from "../models/User";
import { hashPassword } from "./bcrypt";
import { logger } from "../config/logger";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB for user seeding");

    const users = [
      { email: "user1@example.com", password: "password123" },
      { email: "user2@example.com", password: "password123" }
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const passwordHash = await hashPassword(u.password);
        await User.create({ email: u.email, passwordHash, savedRoadmaps: [] });
        logger.info({ email: u.email }, "User created");
      } else {
        logger.info({ email: u.email }, "User already exists");
      }
    }

    logger.info("User seeding complete");
  } catch (err) {
    logger.error({ err }, "Error seeding users");
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
