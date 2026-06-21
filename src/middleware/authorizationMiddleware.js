import { AppError } from "../utils/applicationError.js";

export function requireAdmin(req, res, next) {
  if (Array.isArray(req.user?.roles) && req.user.roles.includes("admin")) {
    next();
    return;
  }
  next(
    new AppError("Admin access required.", {
      statusCode: 403,
      code: "ADMIN_REQUIRED",
    }),
  );
}
