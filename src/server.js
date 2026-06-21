import { createServer } from "node:http";
import { createApp } from "./expressApplication.js";
import { connectDatabase } from "./config/database.js";
import { assertRequiredEnv, env } from "./config/environment.js";

async function main() {
  assertRequiredEnv();
  await connectDatabase();

  const server = createServer(createApp());
  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.keepAliveTimeout = 5_000;

  server.listen(env.port, () => {
    console.log(`LekkerDeal API listening on http://127.0.0.1:${env.port}`);
  });
}

main().catch((error) => {
  console.error("LekkerDeal API failed to start", error);
  process.exit(1);
});
