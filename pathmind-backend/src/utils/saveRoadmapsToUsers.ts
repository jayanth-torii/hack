import mongoose from "mongoose";
import { User } from "../models/User";
import { Roadmap } from "../models/Roadmap";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function saveToUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const topics = ["Dynamic Programming", "React", "System Design", "Machine Learning"];
    
    // Find the roadmaps
    const roadmaps = await Roadmap.find({ topic: { $in: topics } });
    const roadmapIds = roadmaps.map((r) => r._id);

    console.log(`Found ${roadmaps.length} roadmaps in DB.`);

    // Add them to all users
    const result = await User.updateMany(
      {}, 
      { $addToSet: { savedRoadmaps: { $each: roadmapIds } } }
    );

    console.log(`Updated ${result.modifiedCount} users to include these roadmaps in their saved list.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

saveToUsers();
