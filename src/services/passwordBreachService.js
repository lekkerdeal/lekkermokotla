import crypto from "node:crypto";
import { AppError } from "../utils/applicationError.js";

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein123",
  "admin123",
  "welcome1",
  "iloveyou",
  "abc12345",
  "lekkedeal",
  "southafrica",
  "capetown",
  "johannesburg",
]);

export async function assertPasswordIsNotCompromised(password) {
  assertNotCommonPassword(password);
  await assertNotPwnedPassword(password);
}

function assertNotCommonPassword(password) {
  const normalized = String(password || "").trim().toLowerCase();
  if (!COMMON_PASSWORDS.has(normalized)) return;
  throw new AppError(
    "That password is too common. Try a stronger password that is not easy to guess.",
    {
      statusCode: 400,
      code: "PASSWORD_COMMON",
      field: "password",
    },
  );
}

async function assertNotPwnedPassword(password) {
  const hash = crypto
    .createHash("sha1")
    .update(String(password), "utf8")
    .digest("hex")
    .toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "LekkeDeal password safety check",
      },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return;
    const body = await response.text();
    const found = body
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
    if (!found) return;
    throw new AppError(
      "That password has appeared in public data breaches. Try a different password.",
      {
        statusCode: 400,
        code: "PASSWORD_BREACHED",
        field: "password",
      },
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.warn("Could not check pwned password range", error.message);
  }
}
