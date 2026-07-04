import { submitVehicleTrackerLead } from "../services/vehicleTrackerService.js";
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
    optInUrl: publicOptInUrl(req),
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

function publicOptInUrl(req) {
  const origin = req.get("origin");
  return origin && /^https?:\/\//i.test(origin) ? `${origin}/#vehicle-tracker` : "https://lekkedeal.co.za/#vehicle-tracker";
}
