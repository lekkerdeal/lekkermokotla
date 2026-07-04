import { env } from "../config/environment.js";
import { AffiliateCampaignDailyCap } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";

const CAMPAIGN_KEY = "vehicle-tracker-1523";

export async function submitVehicleTrackerLead({ firstName, lastName, phoneNumber, optInUrl }) {
  const day = new Date().toISOString().slice(0, 10);
  await reserveDailyCapacity(day);

  try {
    const submissionUrl = new URL(env.vehicleTrackerEndpoint);
    submissionUrl.searchParams.set("campid", env.vehicleTrackerCampaignId);
    submissionUrl.searchParams.set("sid", env.vehicleTrackerSid);
    submissionUrl.searchParams.set("returnjson", "yes");
    const body = new URLSearchParams({
      firstname: firstName,
      lastname: lastName,
      phone1: phoneNumber,
      sid: env.vehicleTrackerSid,
      optinurl: optInUrl,
      optindate: formatLeadByteDate(new Date()),
      acceptterms: "true",
      offer_id: env.vehicleTrackerOfferId,
      product: "JMTracker",
      leadsource: "LekkeDeal",
      affiliateshortcode: env.vehicleTrackerAffiliateShortcode,
      channel: "JMAff",
    });
    const response = await fetch(submissionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.code !== 1) {
      await releaseDailyCapacity(day);
      console.warn("Vehicle Tracker lead rejected", {
        code: payload?.code,
        response: payload?.response,
        info: payload?.info,
      });
      throw new AppError(providerMessage(payload), {
        statusCode: providerStatus(payload),
        code: providerCode(payload),
      });
    }
    return { leadId: payload.leadId || null };
  } catch (error) {
    if (error instanceof AppError) throw error;
    await releaseDailyCapacity(day);
    throw new AppError("The vehicle tracking service is temporarily unavailable. Please try again later.", {
      statusCode: 502,
      code: "VEHICLE_TRACKER_UNAVAILABLE",
    });
  }
}

async function reserveDailyCapacity(day) {
  const cap = Math.max(1, env.vehicleTrackerDailyCap);
  let reservation = await AffiliateCampaignDailyCap.findOneAndUpdate(
    { campaign: CAMPAIGN_KEY, day, count: { $lt: cap } },
    { $inc: { count: 1 } },
    { new: true },
  );
  if (!reservation) {
    try {
      reservation = await AffiliateCampaignDailyCap.create({ campaign: CAMPAIGN_KEY, day, count: 1 });
    } catch (error) {
      if (error?.code === 11000) {
        reservation = await AffiliateCampaignDailyCap.findOneAndUpdate(
          { campaign: CAMPAIGN_KEY, day, count: { $lt: cap } },
          { $inc: { count: 1 } },
          { new: true },
        );
      } else throw error;
    }
  }
  if (!reservation) {
    throw new AppError("Today's vehicle tracker quote limit has been reached. Please try again tomorrow.", {
      statusCode: 429,
      code: "VEHICLE_TRACKER_DAILY_CAP_REACHED",
    });
  }
}

async function releaseDailyCapacity(day) {
  await AffiliateCampaignDailyCap.updateOne(
    { campaign: CAMPAIGN_KEY, day, count: { $gt: 0 } },
    { $inc: { count: -1 } },
  ).catch(() => {});
}

function formatLeadByteDate(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

function providerCode(payload) {
  if (payload?.code === -2) return "VEHICLE_TRACKER_DUPLICATE";
  if (payload?.code === -4) return "VEHICLE_TRACKER_PROVIDER_CAP_REACHED";
  if (payload?.code === -5) return "VEHICLE_TRACKER_VALIDATION_FAILED";
  return "VEHICLE_TRACKER_REJECTED";
}

function providerStatus(payload) {
  if (payload?.code === -2 || payload?.code === -5) return 422;
  if (payload?.code === -4) return 429;
  return 502;
}

function providerMessage(payload) {
  if (payload?.code === -2) return "This phone number has already requested a quote recently.";
  if (payload?.code === -4) return "The vehicle tracker quote limit has been reached. Please try again later.";
  if (payload?.code === -5) {
    const reason = safeProviderReason(payload);
    return reason
      ? `The quote details could not be accepted: ${reason}`
      : "The quote details could not be accepted. Please check them and try again.";
  }
  return "The vehicle tracking partner could not accept the request. Please try again later.";
}

function safeProviderReason(payload) {
  const values = [payload?.response];
  if (typeof payload?.info === "string") values.push(payload.info);
  if (Array.isArray(payload?.info)) values.push(...payload.info);
  if (payload?.info && typeof payload.info === "object" && !Array.isArray(payload.info)) {
    values.push(...Object.entries(payload.info).map(([field, value]) => `${field}: ${value}`));
  }
  return values
    .map((value) => String(value ?? "").replace(/[^A-Za-z0-9 ._:'()-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((value) => value && value.toLowerCase() !== "validation error")
    .join("; ")
    .slice(0, 220);
}
