import {
  ContactMessage,
  DealReport,
  RetailerCollaborationRequest,
} from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import {
  optionalString,
  requirePhoneNumber,
  requireString,
} from "../utils/validationRules.js";

const DATA_ACCESS_CONSENT_TEXT =
  "I confirm that I am authorised to request LekkerDeal to access, monitor, index and display publicly available offer information from this store website for deal discovery and referral purposes.";

export const createDealReport = asyncHandler(async (req, res) => {
  const report = await DealReport.create({
    userId: req.user.id,
    reporterName: publicAuthorName(req.user),
    reporterPhoneNumber: req.user.phoneNumber,
    reporterProvince: req.user.province || "",
    reporterCity: req.user.city || "",
    dealId: optionalString(req.body.dealId, 500),
    productKey: optionalString(req.body.productKey, 160),
    dealTitle: optionalString(req.body.dealTitle, 220),
    retailer: optionalString(req.body.retailer, 80),
    comment: requireString(req.body.comment, {
      field: "comment",
      label: "Report comment",
      min: 8,
      max: 500,
    }),
  });
  res.status(201).json({ ok: true, data: { report } });
});

export const createContactMessage = asyncHandler(async (req, res) => {
  const message = requireString(req.body.message, {
    field: "message",
    label: "Message",
    min: 8,
    max: 4000,
  });
  if (wordCount(message) > 500) {
    throw new AppError("Message must be 500 words or fewer.", {
      statusCode: 400,
      code: "CONTACT_MESSAGE_TOO_LONG",
      field: "message",
    });
  }
  const contactMessage = await ContactMessage.create({
    name: requireString(req.body.name, {
      field: "name",
      label: "Name",
      min: 2,
      max: 80,
    }),
    phoneNumber: requirePhoneNumber(req.body.phoneNumber),
    subject: requireString(req.body.subject, {
      field: "subject",
      label: "Subject",
      min: 2,
      max: 120,
    }),
    message,
  });
  res.status(201).json({ ok: true, data: { contactMessage } });
});

export const createRetailerCollaborationRequest = asyncHandler(
  async (req, res) => {
    const hasConsent = req.body.dataAccessConsent === true;
    if (!hasConsent) {
      throw new AppError("Consent is required before submitting this request.", {
        statusCode: 400,
        code: "DATA_ACCESS_CONSENT_REQUIRED",
        field: "dataAccessConsent",
      });
    }
    const request = await RetailerCollaborationRequest.create({
      userId: req.user.id,
      requesterName: publicAuthorName(req.user),
      requesterPhoneNumber: req.user.phoneNumber,
      requesterProvince: req.user.province || "",
      requesterCity: req.user.city || "",
      businessName: requireString(req.body.businessName, {
        field: "businessName",
        label: "Business name",
        min: 2,
        max: 120,
      }),
      websiteUrl: requireString(req.body.websiteUrl, {
        field: "websiteUrl",
        label: "Website URL",
        min: 8,
        max: 300,
      }),
      offerType: requireString(req.body.offerType, {
        field: "offerType",
        label: "What you offer",
        min: 2,
        max: 120,
      }),
      notes: optionalString(req.body.notes, 500),
      dataAccessConsent: true,
      consentText: DATA_ACCESS_CONSENT_TEXT,
    });
    res.status(201).json({ ok: true, data: { request } });
  },
);

function publicAuthorName(user) {
  return user.username || "LekkerDeal shopper";
}

function wordCount(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
