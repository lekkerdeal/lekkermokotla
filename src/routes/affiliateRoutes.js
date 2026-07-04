import { Router } from "express";
import { createVehicleTrackerLead } from "../controllers/affiliateController.js";
import { publicSubmissionLimiter } from "../middleware/rateLimits.js";

export const affiliateRoutes = Router();

affiliateRoutes.post("/vehicle-tracker/leads", publicSubmissionLimiter, createVehicleTrackerLead);
