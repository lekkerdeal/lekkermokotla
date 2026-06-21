import bcrypt from "bcryptjs";
import { AppError } from "../utils/applicationError.js";
import { requirePassword } from "../utils/validationRules.js";
import { assertPasswordIsNotCompromised } from "./passwordBreachService.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  const safePassword = requirePassword(password);
  await assertPasswordIsNotCompromised(safePassword);
  return bcrypt.hash(safePassword, SALT_ROUNDS);
}

export async function assertPasswordMatches(password, passwordHash) {
  const matches = passwordHash
    ? await bcrypt.compare(String(password ?? ""), passwordHash)
    : false;
  if (!matches) {
    throw new AppError("Phone number or password is incorrect.", {
      statusCode: 401,
      code: "LOGIN_INVALID",
    });
  }
}
