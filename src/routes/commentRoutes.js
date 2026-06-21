import { Router } from "express";
import {
  createComment,
  deleteComment,
  listComments,
  listMyComments,
  reactToComment,
  updateComment,
} from "../controllers/commentController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import { writeLimiter } from "../middleware/rateLimits.js";

export const commentRoutes = Router();

commentRoutes.get("/", listComments);
commentRoutes.get("/mine", requireAuth, listMyComments);
commentRoutes.post("/", requireAuth, writeLimiter, createComment);
commentRoutes.patch("/:commentId", requireAuth, writeLimiter, updateComment);
commentRoutes.delete("/:commentId", requireAuth, writeLimiter, deleteComment);
commentRoutes.post("/:commentId/reactions", requireAuth, writeLimiter, reactToComment);
