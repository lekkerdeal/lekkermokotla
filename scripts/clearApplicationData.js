import mongoose from "mongoose";
import { env } from "../src/config/environment.js";
import {
  Comment,
  OtpVerification,
  Review,
  SavedDeal,
  User,
} from "../src/models/index.js";

const shouldRun = process.argv.includes("--yes");
const allowSharedDatabase = process.argv.includes("--allow-shared-database");

const collections = [
  ["users", User],
  ["comments", Comment],
  ["reviews", Review],
  ["saved deals", SavedDeal],
  ["OTP records", OtpVerification],
];

if (!shouldRun) {
  console.error("Refusing to clear data without --yes.");
  process.exit(1);
}

try {
  await mongoose.connect(env.mongoUri, { autoIndex: false });
  console.log(`Connected to database: ${mongoose.connection.name}`);
  if (
    !allowSharedDatabase &&
    !mongoose.connection.name.toLowerCase().includes("lekkedeal")
  ) {
    throw new Error(
      `Refusing to clear non-LekkeDeal database "${mongoose.connection.name}".`,
    );
  }

  for (const [label, model] of collections) {
    const beforeCount = await model.countDocuments({});
    const result = await model.deleteMany({});
    console.log(`${label}: deleted ${result.deletedCount} of ${beforeCount}`);
  }
} catch (error) {
  console.error(`Failed to clear application data: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
