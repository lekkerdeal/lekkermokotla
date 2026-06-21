import { SavedDeal, User } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import {
  optionalString,
  requireLoginPassword,
  requirePassword,
  requirePhoneNumber,
  requireUsername,
} from "../utils/validationRules.js";
import { assertPasswordMatches, hashPassword } from "./passwordService.js";

export async function registerPhonePasswordUser(payload) {
  const phoneNumber = requirePhoneNumber(payload.phoneNumber);
  const requestedUsername = requireUsername(payload.username);
  const password = requirePassword(payload.password);
  const existingPhoneAccount = await User.findOne({
    phoneNumber,
    deletedAt: null,
  });

  if (existingPhoneAccount) {
    throw new AppError("That phone number is already registered.", {
      statusCode: 409,
      code: "PHONE_ALREADY_REGISTERED",
      field: "phoneNumber",
    });
  }

  const userPayload = {
    phoneNumber,
    phoneVerified: true,
    passwordHash: await hashPassword(password),
    province: optionalString(payload.province, 60),
    city: optionalString(payload.city, 60),
    marketingConsentAt: payload.marketingConsent === true ? new Date() : null,
    popiaConsentAt: new Date(),
    alertPreferences: buildAlertPreferences(payload.alertPreferences || payload),
  };

  return createUserWithUniqueUsername({ requestedUsername, userPayload });
}

async function createUserWithUniqueUsername({ requestedUsername, userPayload }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = await buildUniqueUsername(requestedUsername);
    try {
      return await User.create({
        ...userPayload,
        username,
        displayName: username,
      });
    } catch (error) {
      if (error?.code !== 11000 || !error?.keyPattern?.username) throw error;
    }
  }

  throw new AppError("Could not create a unique username. Try again.", {
    statusCode: 409,
    code: "USERNAME_UNAVAILABLE",
    field: "username",
  });
}

async function buildUniqueUsername(requestedUsername) {
  if (await isUsernameAvailable(requestedUsername)) return requestedUsername;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const base = requestedUsername.slice(0, 32 - suffix.length);
    const username = `${base}${suffix}`;
    if (await isUsernameAvailable(username)) return username;
  }

  throw new AppError("Could not create a unique username. Try again.", {
    statusCode: 409,
    code: "USERNAME_UNAVAILABLE",
    field: "username",
  });
}

async function isUsernameAvailable(username) {
  const existingUser = await User.exists({ username, deletedAt: null });
  return !existingUser;
}

export async function loginWithPhonePassword({ phoneNumber, password }) {
  const safePhoneNumber = requirePhoneNumber(phoneNumber);
  requireLoginPassword(password);
  const user = await User.findOne({
    phoneNumber: safePhoneNumber,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user || !user.passwordHash) {
    throw new AppError("Phone number or password is incorrect.", {
      statusCode: 401,
      code: "LOGIN_INVALID",
    });
  }

  await assertPasswordMatches(password, user.passwordHash);
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export async function resetPassword({ phoneNumber, password }) {
  const safePhoneNumber = requirePhoneNumber(phoneNumber);
  const safePassword = requirePassword(password);
  const user = await User.findOne({
    phoneNumber: safePhoneNumber,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user) {
    throw new AppError("No active account was found for that phone number.", {
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
      field: "phoneNumber",
    });
  }
  assertPasswordResetWindow(user);

  user.passwordHash = await hashPassword(safePassword);
  user.passwordResetAt = new Date();
  await user.save();
  return user;
}

export async function softDeleteAccountWithPassword({ user, password }) {
  const userWithPassword = await User.findById(user.id).select("+passwordHash");
  if (!userWithPassword || userWithPassword.deletedAt) {
    throw new AppError("Account was not found.", {
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
    });
  }
  await assertPasswordMatches(password, userWithPassword.passwordHash);
  await softDeleteAccount(userWithPassword);
}

function assertPasswordResetWindow(user) {
  const lastResetAt = user.passwordResetAt?.getTime?.() || 0;
  const waitMs = 24 * 60 * 60 * 1000 - (Date.now() - lastResetAt);
  if (waitMs <= 0) return;
  const waitHours = Math.ceil(waitMs / (60 * 60 * 1000));
  throw new AppError(`Password can only be reset once every 24 hours. Try again in about ${waitHours} hour${waitHours === 1 ? "" : "s"}.`, {
    statusCode: 429,
    code: "PASSWORD_RESET_DAILY_LIMIT",
    field: "phoneNumber",
  });
}

export async function softDeleteAccount(user) {
  const suffix = `${user.id}-${Date.now()}`;
  user.username = "";
  user.email = "";
  user.phoneNumber = `deleted-${suffix}`;
  user.displayName = "Deleted user";
  user.phoneVerified = false;
  user.passwordHash = "";
  user.disabledAt = new Date();
  user.deletedAt = new Date();
  user.alertPreferences = {
    channels: [],
    preferredCategories: [],
    preferredRetailers: [],
    minimumDiscount: 0,
    minimumPrice: null,
    maximumPrice: null,
    alertsEnabled: false,
    consentedAt: null,
  };
  await Promise.all([user.save(), SavedDeal.deleteMany({ userId: user.id })]);
}

export function buildAlertPreferences(payload) {
  const allowedChannels = new Set(["whatsapp", "sms"]);
  const channels = Array.isArray(payload.channels)
    ? payload.channels.filter((channel) => allowedChannels.has(channel))
    : [];
  const alertsEnabled = payload.alertsEnabled === true || channels.length > 0;

  return {
    channels: channels.length ? channels : ["whatsapp"],
    preferredCategories: arrayOfStrings(payload.preferredCategories, 40),
    preferredRetailers: arrayOfStrings(payload.preferredRetailers, 60),
    minimumDiscount: clampNumber(payload.minimumDiscount, 0, 95, 0),
    minimumPrice: nullableNumber(payload.minimumPrice),
    maximumPrice: nullableNumber(payload.maximumPrice),
    alertsEnabled,
    consentedAt: alertsEnabled ? new Date() : null,
  };
}

function arrayOfStrings(value, maxLength) {
  return Array.isArray(value)
    ? value
        .map((item) => optionalString(item, maxLength))
        .filter(Boolean)
        .slice(0, 30)
    : [];
}

function nullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
