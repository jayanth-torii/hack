import mongoose from "mongoose";
import { generateOrGetRoadmap } from "../services/roadmap.service";
import { logger } from "../config/logger";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
process.env.MOCK_MODE = "true";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB for roadmap seeding");

    const topics = ["Dynamic Programming", "React", "System Design", "Machine Learning"];

    for (const topic of topics) {
      logger.info({ topic }, "Generating roadmap...");
      await generateOrGetRoadmap(topic);
      logger.info({ topic }, "Roadmap generated and cached");
    }

    logger.info("All roadmaps seeded successfully");
  } catch (err) {
    logger.error({ err }, "Error seeding roadmaps");
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
