/**
 * Attaches EVERY public-template roadmap to EVERY user's `savedRoadmaps`.
 *
 * This touches all users, so it is opt-in: without `--yes` it refuses to run.
 *
 *   npx tsx src/utils/saveRoadmapsToUsers.ts --dry-run   report the counts, write nothing
 *   npx tsx src/utils/saveRoadmapsToUsers.ts --yes       actually attach them
 *
 * Idempotent — `$addToSet` never duplicates an already-saved roadmap.
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { User } from "../models/User";
import { Roadmap } from "../models/Roadmap";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

const USAGE = `Attach all public-template roadmaps to all users.

  --yes       required to write; without it this script does nothing
  --dry-run   connect and report the counts, but write nothing

Example: npx tsx src/utils/saveRoadmapsToUsers.ts --yes`;

async function saveToUsers(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const confirmed = argv.includes("--yes");

  if (!dryRun && !confirmed) {
    console.error(`Refusing to modify every user without --yes.\n\n${USAGE}`);
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  // Never log MONGO_URI — it carries credentials.
  console.log("Connected to MongoDB");

  try {
    const roadmaps = await Roadmap.find({ isPublicTemplate: true }).select("_id topic").lean();
    const roadmapIds = roadmaps.map((r) => r._id);
    const userCount = await User.countDocuments({});

    console.log(`Public-template roadmaps: ${roadmaps.length}`);
    console.log(`Users: ${userCount}`);

    if (roadmapIds.length === 0) {
      console.log("No public-template roadmaps found — nothing to attach.");
      return;
    }

    if (dryRun) {
      console.log(
        `Dry run — would attach ${roadmapIds.length} roadmap(s) to ${userCount} user(s). Nothing written.`
      );
      return;
    }

    const result = await User.updateMany(
      {},
      { $addToSet: { savedRoadmaps: { $each: roadmapIds } } }
    );

    console.log(
      `Attached ${roadmapIds.length} roadmap(s): matched ${result.matchedCount} user(s), modified ${result.modifiedCount}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

saveToUsers()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("Error saving roadmaps to users:", err);
    process.exit(1);
  });
