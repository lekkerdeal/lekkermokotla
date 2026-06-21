import rateLimit from "express-rate-limit";
import { normalizePhoneNumber } from "../utils/validationRules.js";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many authentication attempts. Please wait and try again.",
    },
  },
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpPhoneLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 4,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${req.ip}:${normalizePhoneNumber(req.body?.phoneNumber) || "no-phone"}`,
  message: {
    ok: false,
    error: {
      code: "OTP_RATE_LIMITED",
      message: "Too many OTP requests. Please wait before trying again.",
    },
  },
});

export const loginPhoneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${req.ip}:${normalizePhoneNumber(req.body?.phoneNumber) || "no-phone"}`,
  message: {
    ok: false,
    error: {
      code: "LOGIN_RATE_LIMITED",
      message: "Too many login attempts. Please wait and try again.",
    },
  },
});

export const publicSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: "SUBMISSION_RATE_LIMITED",
      message: "Too many submissions. Please wait before trying again.",
    },
  },
});

export const privateSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.user?.id || "anonymous"}`,
  message: {
    ok: false,
    error: {
      code: "SUBMISSION_RATE_LIMITED",
      message: "Too many submissions. Please wait before trying again.",
    },
  },
});
