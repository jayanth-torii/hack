/**
 * Grants or revokes the admin role from the command line.
 *
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 *   npm run admin:grant -- --list
 *
 * This is the **only** way the first admin can exist. Nothing in the HTTP API
 * can mint one from nothing: `POST /auth/register` always writes `role: "user"`
 * and `PATCH /admin/users/:id` already requires an admin to call it. Without a
 * deliberate out-of-band step, a self-service "make me an admin" path would
 * have to exist somewhere, and that path is always the weakest link in the
 * system.
 *
 * Revoking refuses to remove the last active admin, matching the same guard in
 * the admin API — locking everyone out of the dashboard should take more than
 * one typo.
 */
import path from "path";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/User";

interface Options {
  email?: string;
  revoke: boolean;
  list: boolean;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { revoke: false, list: false };
  for (const arg of argv) {
    if (arg === "--revoke") opts.revoke = true;
    else if (arg === "--list") opts.list = true;
    else if (arg.startsWith("--")) throw new Error(`Unknown argument: ${arg}`);
    else if (!opts.email) opts.email = arg.trim().toLowerCase();
    else throw new Error(`Unexpected extra argument: ${arg}`);
  }
  if (!opts.list && !opts.email) {
    throw new Error(
      "Usage: npm run admin:grant -- <email> [--revoke]\n" +
        "       npm run admin:grant -- --list"
    );
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmind";

  await mongoose.connect(MONGO_URI);
  // Never log MONGO_URI — it carries credentials.
  console.log("Connected to MongoDB");

  try {
    if (opts.list) {
      const admins = await User.find({ role: "admin" })
        .select("email suspended createdAt")
        .sort({ createdAt: 1 })
        .lean();
      if (admins.length === 0) {
        console.log("No admins yet. Grant one with: npm run admin:grant -- <email>");
        return;
      }
      console.log(`${admins.length} admin(s):`);
      for (const a of admins) {
        console.log(`  ${a.email}${a.suspended ? "  (SUSPENDED)" : ""}`);
      }
      return;
    }

    const user = await User.findOne({ email: opts.email });
    if (!user) {
      // Deliberately explicit here, unlike the API: this runs on a trusted
      // machine, and "nothing happened" with no reason is a worse experience
      // than naming the problem.
      throw new Error(
        `No account found for ${opts.email}. Register the account first, then grant it.`
      );
    }

    const nextRole = opts.revoke ? "user" : "admin";
    if (user.role === nextRole) {
      console.log(`${user.email} is already ${nextRole}. Nothing to do.`);
      return;
    }

    if (opts.revoke) {
      const remaining = await User.countDocuments({
        role: "admin",
        suspended: false,
        _id: { $ne: user._id },
      });
      if (remaining === 0) {
        throw new Error(
          `${user.email} is the last active admin. Grant another account first.`
        );
      }
    }

    user.role = nextRole;
    await user.save();
    console.log(`${user.email} is now ${nextRole}.`);
    if (!opts.revoke) {
      console.log("They must sign out and back in for the change to reach their session.");
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    });
}
