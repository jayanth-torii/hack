import mongoose from "mongoose";
import { User } from "./src/models/User";
import { comparePassword } from "./src/utils/bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pathmind");
  const user = await User.findOne({ email: "user1@example.com" }).select("+passwordHash");
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found:", user.email);
    const valid = await comparePassword("password123", user.passwordHash);
    console.log("Password valid:", valid);
  }
  process.exit(0);
}
run();
