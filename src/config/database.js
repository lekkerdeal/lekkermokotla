import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./environment.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  assertLekkerDealDatabase();
  if (env.mongoUri.startsWith("mongodb+srv://") && env.mongoDnsServers) {
    dns.setServers(
      env.mongoDnsServers
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== "production"
  });
  return mongoose.connection;
}

function assertLekkerDealDatabase() {
  const databaseName = getDatabaseName(env.mongoUri);
  if (
    env.allowSharedMongoDatabase ||
    databaseName.toLowerCase().includes("lekkerdeal")
  ) {
    return;
  }

  throw new Error(
    `Refusing to start LekkerDeal with Mongo database "${databaseName}". Databases outside LekkerDeal belong to their own apps.`,
  );
}

function getDatabaseName(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.pathname.replace(/^\//, "") || "(no database selected)";
  } catch (error) {
    return "(could not parse database name)";
  }
}
