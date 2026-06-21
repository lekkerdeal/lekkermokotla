import { Router } from "express";
import {
  listContactMessages,
  listDealReports,
  listRetailerCollaborationRequests,
  listSecurityEvents,
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import { requireAdmin } from "../middleware/authorizationMiddleware.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/contact-messages", listContactMessages);
adminRoutes.get("/deal-reports", listDealReports);
adminRoutes.get(
  "/retailer-collaboration-requests",
  listRetailerCollaborationRequests,
);
adminRoutes.get("/security-events", listSecurityEvents);
