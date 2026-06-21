import { AppError } from "../utils/applicationError.js";
import { logSecurityEvent } from "../services/securityEventService.js";

const SECURITY_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_RATE_LIMITED",
  "LOGIN_RATE_LIMITED",
  "LOGIN_INVALID",
  "OTP_RATE_LIMITED",
  "OTP_COOLDOWN_ACTIVE",
  "OTP_INVALID",
  "OTP_NOT_FOUND",
  "OTP_CODE_REQUIRED",
  "PASSWORD_WEAK",
  "PASSWORD_BREACHED",
  "PASSWORD_COMMON",
  "PHONE_ALREADY_REGISTERED",
  "PASSWORD_RESET_DAILY_LIMIT",
]);

export function notFoundHandler(req, res, next) {
  next(
    new AppError("Route not found.", {
      statusCode: 404,
      code: "ROUTE_NOT_FOUND",
    }),
  );
}

export function errorHandler(error, req, res, next) {
  const statusCode = Number(error.statusCode) || 500;
  const payload = {
    ok: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: statusCode >= 500 ? "Something went wrong." : error.message,
    },
  };

  if (error.field) payload.error.field = error.field;
  if (error.details && process.env.NODE_ENV !== "production")
    payload.error.details = error.details;
  if (SECURITY_ERROR_CODES.has(payload.error.code)) {
    logSecurityEvent({
      req,
      eventType: "security_error",
      code: payload.error.code,
      details: { statusCode },
    });
  }
  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json(payload);
}
