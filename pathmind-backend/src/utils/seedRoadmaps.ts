import mongoose from "mongoose";
import { generateOrGetRoadmap } from "../services/roadmap.service";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
process.env.MOCK_MODE = "true";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for roadmap seeding.");

    const topics = ["Dynamic Programming", "React", "System Design", "Machine Learning"];

    for (const topic of topics) {
      console.log(`Generating roadmap for: ${topic}...`);
      await generateOrGetRoadmap(topic);
      console.log(`Successfully generated and cached roadmap for: ${topic}`);
    }

    console.log("All roadmaps seeded successfully.");
  } catch (err) {
    console.error("Error seeding roadmaps:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
