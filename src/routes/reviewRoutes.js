import { Router } from "express";
import {
  createReview,
  deleteReview,
  getReviewCounts,
  listMyReviews,
  listReviews,
  reactToReview,
  updateReview,
} from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimits.js";

export const reviewRoutes = Router();

reviewRoutes.get("/", listReviews);
reviewRoutes.get("/mine", requireAuth, listMyReviews);
reviewRoutes.post("/counts", getReviewCounts);
reviewRoutes.post("/", requireAuth, writeLimiter, createReview);
reviewRoutes.patch("/:reviewId", requireAuth, writeLimiter, updateReview);
reviewRoutes.delete("/:reviewId", requireAuth, writeLimiter, deleteReview);
reviewRoutes.post("/:reviewId/reactions", requireAuth, writeLimiter, reactToReview);
