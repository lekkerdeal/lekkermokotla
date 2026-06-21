import { SecurityEvent } from "../models/index.js";
import { optionalString, normalizePhoneNumber } from "../utils/validationRules.js";

export async function logSecurityEvent({
  req,
  eventType,
  code = "",
  phoneNumber = "",
  userId = null,
  details = null,
} = {}) {
  try {
    await SecurityEvent.create({
      eventType: optionalString(eventType, 80) || "security_event",
      code: optionalString(code, 80),
      ipAddress: optionalString(req?.ip, 80),
      userAgent: optionalString(req?.get?.("user-agent"), 300),
      phoneNumber: normalizePhoneNumber(phoneNumber || req?.body?.phoneNumber),
      userId: userId || req?.user?.id || null,
      route: optionalString(req?.originalUrl, 200),
      method: optionalString(req?.method, 12),
      details,
    });
  } catch (error) {
    console.warn("Could not write security event", error.message);
  }
}
