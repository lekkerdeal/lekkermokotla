import { AppError } from "./applicationError.js";

export function cleanString(value, maxLength = 500) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[<>`{}[\]\\]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function normalizePhoneNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 11 && digits.startsWith("27"))
    return `0${digits.slice(2)}`;
  if (digits.length === 12 && digits.startsWith("270"))
    return `0${digits.slice(3)}`;
  return "";
}

export function requirePhoneNumber(value, field = "phoneNumber") {
  const phoneNumber = normalizePhoneNumber(value);
  if (!/^0\d{9}$/.test(phoneNumber)) {
    throw new AppError("Enter a valid South African phone number.", {
      statusCode: 400,
      code: "PHONE_INVALID",
      field,
    });
  }
  return phoneNumber;
}

export function requireString(
  value,
  { field, label = field, min = 1, max = 500 },
) {
  const safe = cleanString(value, max);
  if (safe.length < min) {
    throw new AppError(`${label} is required.`, {
      statusCode: 400,
      code: "VALIDATION_REQUIRED",
      field,
    });
  }
  return safe;
}

export function optionalString(value, max = 500) {
  return cleanString(value, max);
}

export function requireEnum(value, allowed, field) {
  const safe = cleanString(value, 60);
  if (!allowed.includes(safe)) {
    throw new AppError(`${field} is invalid.`, {
      statusCode: 400,
      code: "VALIDATION_ENUM_INVALID",
      field,
    });
  }
  return safe;
}

export function normalizeUsername(value) {
  return cleanString(value, 32)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export function requireUsername(value) {
  const username = normalizeUsername(value);
  const reserved = new Set([
    "admin",
    "api",
    "support",
    "lekkedeal",
    "root",
    "system",
  ]);
  if (username.length < 3 || reserved.has(username)) {
    throw new AppError(
      "Choose a valid username with at least 3 letters or numbers.",
      {
        statusCode: 400,
        code: "USERNAME_INVALID",
        field: "username",
      },
    );
  }
  return username;
}

export function requirePassword(value) {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 128) {
    throw new AppError(
      "Password must be 8 to 128 characters. Use a password you do not use elsewhere.",
      {
        statusCode: 400,
        code: "PASSWORD_WEAK",
        field: "password",
      },
    );
  }
  return password;
}

export function requireLoginPassword(value) {
  const password = String(value ?? "");
  if (!password) {
    throw new AppError("Password is required.", {
      statusCode: 400,
      code: "PASSWORD_REQUIRED",
      field: "password",
    });
  }
  return password;
}
