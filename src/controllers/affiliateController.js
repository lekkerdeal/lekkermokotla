import { submitVehicleTrackerLead } from "../services/vehicleTrackerService.js";
import { env } from "../config/environment.js";
import { AppError } from "../utils/applicationError.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import { requirePhoneNumber, requireString } from "../utils/validationRules.js";

export const createVehicleTrackerLead = asyncHandler(async (req, res) => {
  if (req.body.acceptTerms !== true) {
    throw new AppError("Consent is required before requesting a quote.", {
      statusCode: 400,
      code: "VEHICLE_TRACKER_CONSENT_REQUIRED",
      field: "acceptTerms",
    });
  }
  const firstName = requirePersonName(req.body.firstName, "firstName", "First name");
  const lastName = requirePersonName(req.body.lastName, "lastName", "Last name");
  const phoneNumber = requirePhoneNumber(req.body.phoneNumber);
  const result = await submitVehicleTrackerLead({
    firstName,
    lastName,
    phoneNumber,
    optInUrl: validatedOptInUrl(),
  });
  res.status(201).json({ ok: true, data: { submitted: true, leadId: result.leadId } });
});

function requirePersonName(value, field, label) {
  const name = requireString(value, { field, label, min: 2, max: 50 });
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(name)) {
    throw new AppError(`${label} may contain letters, spaces, apostrophes and hyphens only.`, {
      statusCode: 400,
      code: "NAME_INVALID",
      field,
    });
  }
  return name;
}

function validatedOptInUrl() {
  try {
    const url = new URL(env.vehicleTrackerOptInUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("invalid protocol");
    url.hash = "";
    return url.toString();
  } catch (error) {
    throw new AppError("The vehicle tracker consent URL is not configured correctly.", {
      statusCode: 500,
      code: "VEHICLE_TRACKER_OPTIN_URL_INVALID",
    });
  }
}
