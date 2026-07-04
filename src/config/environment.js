import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const backendRootDirectory = resolve(currentDirectory, "../..");

dotenv.config({ path: resolve(backendRootDirectory, ".env") });

function readString(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const env = {
  nodeEnv: readString("NODE_ENV", "development"),
  port: readNumber("PORT", 4100),
  apiBaseUrl: readString("API_BASE_URL", "http://127.0.0.1:4100"),
  frontendOrigin: readString("FRONTEND_ORIGIN", "http://127.0.0.1:8080"),
  frontendOrigins: readList("FRONTEND_ORIGINS", [
    readString("FRONTEND_ORIGIN", "http://127.0.0.1:8080"),
    "http://localhost:8080",
  ]),
  trustProxy: readNumber("TRUST_PROXY", 0),
  mongoUri: readString("MONGODB_URI", "mongodb://127.0.0.1:27017/lekkedeal-dev"),
  allowSharedMongoDatabase: readString("ALLOW_SHARED_MONGODB_DATABASE", "") === "true",
  mongoDnsServers: readString("MONGODB_DNS_SERVERS", "1.1.1.1,8.8.8.8"),
  jwtSecret: readString("JWT_SECRET"),
  jwtExpiresIn: readString("JWT_EXPIRES_IN", "7d"),
  bodyLimit: readString("API_BODY_LIMIT", "1mb"),
  smsApiKey: readString("SMS_APIKEY") || readString("SMS_API_KEY"),
  smsBaseUrl: readString(
    "SMS_BASE_URL",
    "https://platform.clickatell.com/messages/http/send",
  ),
  otpCodeLength: readNumber("OTP_CODE_LENGTH", 6),
  otpExpiresInMinutes: readNumber("OTP_EXPIRES_IN_MINUTES", 5),
  passwordResetOtpExpiresInMinutes: readNumber(
    "PASSWORD_RESET_OTP_EXPIRES_IN_MINUTES",
    5,
  ),
  accountDeletionOtpExpiresInMinutes: readNumber(
    "ACCOUNT_DELETION_OTP_EXPIRES_IN_MINUTES",
    5,
  ),
  otpResendCooldownSeconds: readNumber("OTP_RESEND_COOLDOWN_SECONDS", 300),
  otpMaxAttempts: readNumber("OTP_MAX_ATTEMPTS", 5),
  vehicleTrackerEndpoint: readString(
    "VEHICLE_TRACKER_ENDPOINT",
    "https://returnxdigital.leadbyte.co.uk/api/submit.php",
  ),
  vehicleTrackerCampaignId: readString("VEHICLE_TRACKER_CAMPAIGN_ID", "VEHICLE-TRACKING"),
  vehicleTrackerSid: readString("VEHICLE_TRACKER_SID", "26900"),
  vehicleTrackerOfferId: readString("VEHICLE_TRACKER_OFFER_ID", "1523"),
  vehicleTrackerAffiliateShortcode: readString(
    "VEHICLE_TRACKER_AFFILIATE_SHORTCODE",
    "JMAFFSite26716",
  ),
  vehicleTrackerDailyCap: readNumber("VEHICLE_TRACKER_DAILY_CAP", 10),
};

function readList(name, fallback = []) {
  const value = process.env[name];
  if (!value) return fallback.filter(Boolean);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function assertRequiredEnv() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }

  if (env.nodeEnv !== "production") return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set in production.");
  }

  if (!env.smsApiKey) {
    throw new Error("SMS_APIKEY must be set in production.");
  }

  if (!process.env.FRONTEND_ORIGINS) {
    throw new Error("FRONTEND_ORIGINS must be set in production.");
  }
}
