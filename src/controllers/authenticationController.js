import { User } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import { signAccessToken, signShortToken, verifyShortToken } from "../utils/jsonWebToken.js";
import {
  optionalString,
  requirePhoneNumber,
  requireUsername,
} from "../utils/validationRules.js";
import {
  buildAlertPreferences,
  loginWithPhonePassword,
  registerPhonePasswordUser,
  resetPassword,
  softDeleteAccount,
  softDeleteAccountWithPassword,
} from "../services/accountService.js";
import { OTP_PURPOSES, sendOtp, verifyOtp } from "../services/oneTimePasswordService.js";
import { toUserDataTransferObject } from "../services/userDataTransferObject.js";

export const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const phoneNumber = requirePhoneNumber(req.body.phoneNumber);
  await assertPhoneAvailable(phoneNumber);
  const result = await sendOtp({
    phoneNumber,
    purpose: OTP_PURPOSES.REGISTRATION,
  });
  res.status(202).json({ ok: true, data: result });
});

export const register = asyncHandler(async (req, res) => {
  const { phoneNumber } = await verifyOtp({
    phoneNumber: req.body.phoneNumber,
    code: req.body.code,
    purpose: OTP_PURPOSES.REGISTRATION,
  });
  const user = await registerPhonePasswordUser({ ...req.body, phoneNumber });
  const token = signAccessToken(user);
  res.status(201).json({ ok: true, data: { token, user: toUserDataTransferObject(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await loginWithPhonePassword({
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
  });
  const token = signAccessToken(user);
  res.json({ ok: true, data: { token, user: toUserDataTransferObject(user) } });
});

export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const phoneNumber = requirePhoneNumber(req.body.phoneNumber);
  const user = await assertPhoneExists(phoneNumber);
  assertPasswordResetAllowed(user);
  const result = await sendOtp({
    phoneNumber,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
  });
  res.status(202).json({ ok: true, data: result });
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { phoneNumber } = await verifyOtp({
    phoneNumber: req.body.phoneNumber,
    code: req.body.code,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
  });
  const resetToken = signShortToken(
    { phoneNumber, purpose: "password_reset" },
    10 * 60,
  );
  res.json({ ok: true, data: { resetToken } });
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, purpose } = verifyPasswordResetToken(
    req.body.resetToken || "",
  );
  if (purpose !== "password_reset") {
    throw new AppError("Password reset token is invalid.", {
      statusCode: 400,
      code: "PASSWORD_RESET_TOKEN_INVALID",
      field: "resetToken",
    });
  }
  const user = await resetPassword({
    phoneNumber,
    password: req.body.password,
  });
  res.json({ ok: true, data: { user: toUserDataTransferObject(user) } });
});

export const requestAccountDeletionOtp = asyncHandler(async (req, res) => {
  const result = await sendOtp({
    phoneNumber: req.user.phoneNumber,
    userId: req.user.id,
    purpose: OTP_PURPOSES.ACCOUNT_DELETION,
  });
  res.status(202).json({ ok: true, data: result });
});

export const deleteAccountWithOtp = asyncHandler(async (req, res) => {
  await verifyOtp({
    phoneNumber: req.user.phoneNumber,
    code: req.body.code,
    purpose: OTP_PURPOSES.ACCOUNT_DELETION,
  });
  await softDeleteAccount(req.user);
  res.status(204).send();
});

export const deleteAccountWithPassword = asyncHandler(async (req, res) => {
  await softDeleteAccountWithPassword({
    user: req.user,
    password: req.body.password,
  });
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: { user: toUserDataTransferObject(req.user) } });
});

export const updateMe = asyncHandler(async (req, res) => {
  if (req.body.username !== undefined) {
    const username = requireUsername(req.body.username);
    await assertUsernameAvailable(username, req.user.id);
    req.user.username = username;
  }
  req.user.displayName =
    optionalString(req.body.displayName, 80) || req.user.displayName;
  req.user.province =
    optionalString(req.body.province, 60) || req.user.province;
  req.user.city = optionalString(req.body.city, 60) || req.user.city;
  if (req.body.alertPreferences)
    req.user.alertPreferences = buildAlertPreferences(
      req.body.alertPreferences,
    );
  if (req.body.marketingConsent === true)
    req.user.marketingConsentAt = new Date();
  await req.user.save();
  res.json({ ok: true, data: { user: toUserDataTransferObject(req.user) } });
});

async function assertPhoneAvailable(phoneNumber) {
  const owner = await User.findOne({ phoneNumber, deletedAt: null });
  if (owner) {
    throw new AppError("That phone number is already registered.", {
      statusCode: 409,
      code: "PHONE_ALREADY_REGISTERED",
      field: "phoneNumber",
    });
  }
}

async function assertPhoneExists(phoneNumber) {
  const owner = await User.findOne({ phoneNumber, deletedAt: null });
  if (!owner) {
    throw new AppError("No active account was found for that phone number.", {
      statusCode: 404,
      code: "ACCOUNT_NOT_FOUND",
      field: "phoneNumber",
    });
  }
  return owner;
}

function assertPasswordResetAllowed(user) {
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

function verifyPasswordResetToken(token) {
  try {
    return verifyShortToken(token);
  } catch (error) {
    throw new AppError("Password reset token is invalid or expired.", {
      statusCode: 400,
      code: "PASSWORD_RESET_TOKEN_INVALID",
      field: "resetToken",
    });
  }
}

async function assertUsernameAvailable(username, userId) {
  const owner = await User.findOne({
    username,
    _id: { $ne: userId },
    deletedAt: null,
  });
  if (owner) {
    throw new AppError("That username is already taken.", {
      statusCode: 409,
      code: "USERNAME_TAKEN",
      field: "username",
    });
  }
}
