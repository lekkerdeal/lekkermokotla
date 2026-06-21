import { Router } from "express";
import {
  deleteSavedDeal,
  listSavedDeals,
  saveDeal,
} from "../controllers/savedDealController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimits.js";

export const savedDealRoutes = Router();

savedDealRoutes.use(requireAuth);
savedDealRoutes.get("/", listSavedDeals);
savedDealRoutes.post("/", writeLimiter, saveDeal);
savedDealRoutes.delete("/:dealId", writeLimiter, deleteSavedDeal);
