import crypto from "node:crypto";
import { env } from "../config/environment.js";
import { OtpVerification } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import { requirePhoneNumber } from "../utils/validationRules.js";
import { sendSms } from "./textMessageService.js";
import { logSecurityEvent } from "./securityEventService.js";

export const OTP_PURPOSES = {
  REGISTRATION: "registration",
  PASSWORD_RESET: "password_reset",
  ACCOUNT_DELETION: "account_deletion",
};

function hashOtpCode({ phoneNumber, code, purpose }) {
  return crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${purpose}:${phoneNumber}:${code}`)
    .digest("hex");
}

function generateOtpCode() {
  const digits = Math.max(4, env.otpCodeLength);
  const max = 10 ** digits;
  return String(crypto.randomInt(0, max)).padStart(digits, "0");
}

function expiryMinutesForPurpose(purpose) {
  if (purpose === OTP_PURPOSES.PASSWORD_RESET)
    return env.passwordResetOtpExpiresInMinutes;
  if (purpose === OTP_PURPOSES.ACCOUNT_DELETION)
    return env.accountDeletionOtpExpiresInMinutes;
  return env.otpExpiresInMinutes;
}

function messageForPurpose({ purpose, code, expiresInMinutes }) {
  if (purpose === OTP_PURPOSES.PASSWORD_RESET) {
    return `LekkeDeal password reset code: ${code}. It expires in ${expiresInMinutes} minute(s).`;
  }
  if (purpose === OTP_PURPOSES.ACCOUNT_DELETION) {
    return `LekkeDeal account deletion code: ${code}. It expires in ${expiresInMinutes} minute(s).`;
  }
  return `LekkeDeal registration code: ${code}. It expires in ${expiresInMinutes} minute(s).`;
}

export async function sendOtp({ phoneNumber, purpose, userId = null }) {
  const safePhoneNumber = requirePhoneNumber(phoneNumber);
  const expiresInMinutes = expiryMinutesForPurpose(purpose);
  const activeOtp = await OtpVerification.findOne({
    phoneNumber: safePhoneNumber,
    purpose,
    verifiedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (
    activeOtp?.cooldownUntil &&
    activeOtp.cooldownUntil.getTime() > Date.now()
  ) {
    throw new AppError(
      "This OTP is still active. Please wait before requesting another one.",
      {
        statusCode: 429,
        code: "OTP_COOLDOWN_ACTIVE",
        details: { cooldownUntil: activeOtp.cooldownUntil },
      },
    );
  }

  const code = generateOtpCode();
  const otpPayload = {
    phoneNumber: safePhoneNumber,
    userId,
    purpose,
    otpCodeHash: hashOtpCode({ phoneNumber: safePhoneNumber, code, purpose }),
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    cooldownUntil: new Date(Date.now() + env.otpResendCooldownSeconds * 1000),
  };

  await sendSms({
    to: safePhoneNumber,
    content: messageForPurpose({ purpose, code, expiresInMinutes }),
  });
  const otp = await OtpVerification.create(otpPayload);
  await logSecurityEvent({
    eventType: "otp_sent",
    code: purpose,
    phoneNumber: safePhoneNumber,
    userId,
  });

  return {
    phoneNumber: safePhoneNumber,
    purpose,
    expiresAt: otp.expiresAt,
    cooldownUntil: otp.cooldownUntil,
  };
}

export async function verifyOtp({ phoneNumber, code, purpose }) {
  const safePhoneNumber = requirePhoneNumber(phoneNumber);
  const safeCode = String(code ?? "").replace(/\D/g, "");

  if (!safeCode) {
    throw new AppError("OTP code is required.", {
      statusCode: 400,
      code: "OTP_CODE_REQUIRED",
      field: "code",
    });
  }

  const otp = await OtpVerification.findOne({
    phoneNumber: safePhoneNumber,
    purpose,
  }).sort({ createdAt: -1 });
  if (!otp || otp.verifiedAt || otp.expiresAt.getTime() < Date.now()) {
    throw new AppError("No active OTP was found.", {
      statusCode: 400,
      code: "OTP_NOT_FOUND",
    });
  }

  const expectedHash = hashOtpCode({
    phoneNumber: safePhoneNumber,
    code: safeCode,
    purpose,
  });
  if (otp.otpCodeHash !== expectedHash) {
    otp.attemptCount += 1;
    if (otp.attemptCount >= env.otpMaxAttempts) otp.expiresAt = new Date();
    await otp.save();
    await logSecurityEvent({
      eventType: "otp_invalid",
      code: purpose,
      phoneNumber: safePhoneNumber,
      userId: otp.userId,
      details: {
        attemptsRemaining: Math.max(0, env.otpMaxAttempts - otp.attemptCount),
      },
    });
    throw new AppError("OTP is invalid.", {
      statusCode: 400,
      code: "OTP_INVALID",
      details: {
        attemptsRemaining: Math.max(0, env.otpMaxAttempts - otp.attemptCount),
      },
    });
  }

  otp.verifiedAt = new Date();
  await otp.save();
  return { phoneNumber: safePhoneNumber, otp };
}
