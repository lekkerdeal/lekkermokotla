import { Router } from "express";
import { authRoutes } from "./authenticationRoutes.js";
import { adminRoutes } from "./adminRoutes.js";
import { commentRoutes } from "./commentRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import { reviewRoutes } from "./reviewRoutes.js";
import { savedDealRoutes } from "./savedDealRoutes.js";
import { submissionRoutes } from "./submissionRoutes.js";

export const apiRoutes = Router();

apiRoutes.use("/health", healthRoutes);
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/saved-deals", savedDealRoutes);
apiRoutes.use("/submissions", submissionRoutes);
apiRoutes.use("/reviews", reviewRoutes);
apiRoutes.use("/comments", commentRoutes);
