import { env } from "../config/environment.js";
import { AppError } from "../utils/applicationError.js";
import { requirePhoneNumber } from "../utils/validationRules.js";

function formatClickatellPhoneNumber(value) {
  const phoneNumber = requirePhoneNumber(value);
  return `27${phoneNumber.slice(1)}`;
}

export async function sendSms({ to, content }) {
  if (!env.smsApiKey) {
    throw new AppError("SMS provider is not configured.", {
      statusCode: 500,
      code: "SMS_NOT_CONFIGURED",
    });
  }

  const safeContent = String(content ?? "").trim();
  if (!safeContent) {
    throw new AppError("SMS content is required.", {
      statusCode: 400,
      code: "SMS_CONTENT_REQUIRED",
      field: "content",
    });
  }

  const url = new URL(env.smsBaseUrl);
  url.searchParams.set("apiKey", env.smsApiKey);
  url.searchParams.set("to", formatClickatellPhoneNumber(to));
  url.searchParams.set("content", safeContent);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new AppError("SMS provider request failed.", {
      statusCode: 502,
      code: "SMS_SEND_FAILED",
      details: {
        provider: "clickatell",
        status: response.status,
        response: payload,
      },
    });
  }

  return { provider: "clickatell", response: payload };
}
