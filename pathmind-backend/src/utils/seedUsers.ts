import mongoose from "mongoose";
import { User } from "../models/User";
import { hashPassword } from "./bcrypt";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding.");

    const users = [
      { email: "user1@example.com", password: "password123" },
      { email: "user2@example.com", password: "password123" }
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const passwordHash = await hashPassword(u.password);
        await User.create({ email: u.email, passwordHash, savedRoadmaps: [] });
        console.log(`Created user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding users:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
