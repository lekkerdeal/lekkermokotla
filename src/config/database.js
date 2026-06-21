import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./environment.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  assertLekkeDealDatabase();
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

function assertLekkeDealDatabase() {
  const databaseName = getDatabaseName(env.mongoUri);
  if (
    env.allowSharedMongoDatabase ||
    databaseName.toLowerCase().includes("lekkedeal")
  ) {
    return;
  }

  throw new Error(
    `Refusing to start LekkeDeal with Mongo database "${databaseName}". Databases outside LekkeDeal belong to their own apps.`,
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
