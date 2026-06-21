import { Router } from "express";
import {
  deleteAccountWithOtp,
  deleteAccountWithPassword,
  login,
  me,
  register,
  requestAccountDeletionOtp,
  requestPasswordResetOtp,
  requestRegistrationOtp,
  resetPasswordWithOtp,
  updateMe,
  verifyPasswordResetOtp,
} from "../controllers/authenticationController.js";
import { requireAuth } from "../middleware/authenticationMiddleware.js";
import {
  authLimiter,
  loginPhoneLimiter,
  otpPhoneLimiter,
} from "../middleware/rateLimits.js";

export const authRoutes = Router();

authRoutes.post("/register/request-otp", authLimiter, otpPhoneLimiter, requestRegistrationOtp);
authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, loginPhoneLimiter, login);
authRoutes.post(
  "/password/request-reset-otp",
  authLimiter,
  otpPhoneLimiter,
  requestPasswordResetOtp,
);
authRoutes.post("/password/verify-reset-otp", authLimiter, verifyPasswordResetOtp);
authRoutes.post("/password/reset", authLimiter, resetPasswordWithOtp);
authRoutes.get("/me", requireAuth, me);
authRoutes.patch("/me", requireAuth, updateMe);
authRoutes.post(
  "/account/request-deletion-otp",
  authLimiter,
  requireAuth,
  requestAccountDeletionOtp,
);
authRoutes.delete("/account", authLimiter, requireAuth, deleteAccountWithOtp);
authRoutes.delete(
  "/account/password",
  authLimiter,
  requireAuth,
  deleteAccountWithPassword,
);
