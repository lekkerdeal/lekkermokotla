import { Router } from "express";
import {
  createDealReport,
  createContactMessage,
  createRetailerCollaborationRequest,
} from "../controllers/submissionController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import {
  privateSubmissionLimiter,
  publicSubmissionLimiter,
  writeLimiter,
} from "../middleware/rateLimits.js";

export const submissionRoutes = Router();

submissionRoutes.post("/contact-messages", publicSubmissionLimiter, createContactMessage);
submissionRoutes.post(
  "/deal-reports",
  requireAuth,
  privateSubmissionLimiter,
  writeLimiter,
  createDealReport,
);
submissionRoutes.post(
  "/retailer-collaboration-requests",
  requireAuth,
  privateSubmissionLimiter,
  writeLimiter,
  createRetailerCollaborationRequest,
);
