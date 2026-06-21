import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/environment.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimits.js";
import { sanitizeRequest } from "./middleware/sanitize.js";
import { apiRoutes } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin: resolveCorsOrigin,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: env.bodyLimit }));
  app.use(sanitizeRequest);
  app.use(generalLimiter);
  if (env.nodeEnv !== "test")
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.frontendOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}
