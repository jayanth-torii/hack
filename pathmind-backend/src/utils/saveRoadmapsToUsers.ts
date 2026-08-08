import mongoose from "mongoose";
import { User } from "../models/User";
import { Roadmap } from "../models/Roadmap";
import { logger } from "../config/logger";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function saveToUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");

    const topics = ["Dynamic Programming", "React", "System Design", "Machine Learning"];
    
    // Find the roadmaps
    const roadmaps = await Roadmap.find({ topic: { $in: topics } });
    const roadmapIds = roadmaps.map((r) => r._id);

    logger.info({ count: roadmaps.length }, "Roadmaps found in DB");

    // Add them to all users
    const result = await User.updateMany(
      {}, 
      { $addToSet: { savedRoadmaps: { $each: roadmapIds } } }
    );

    logger.info({ modifiedUsers: result.modifiedCount }, "Users updated with saved roadmaps");
  } catch (err) {
    logger.error({ err }, "Error saving roadmaps to users");
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

saveToUsers();
