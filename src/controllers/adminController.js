import {
  ContactMessage,
  DealReport,
  RetailerCollaborationRequest,
  SecurityEvent,
} from "../models/index.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";

const MAX_LIMIT = 100;

export const listContactMessages = asyncHandler(async (req, res) => {
  const rows = await ContactMessage.find({})
    .sort({ createdAt: -1 })
    .limit(limit(req.query.limit))
    .lean();
  res.json({ ok: true, data: { contactMessages: rows } });
});

export const listDealReports = asyncHandler(async (req, res) => {
  const rows = await DealReport.find({})
    .sort({ createdAt: -1 })
    .limit(limit(req.query.limit))
    .lean();
  res.json({ ok: true, data: { dealReports: rows } });
});

export const listRetailerCollaborationRequests = asyncHandler(async (req, res) => {
  const rows = await RetailerCollaborationRequest.find({})
    .sort({ createdAt: -1 })
    .limit(limit(req.query.limit))
    .lean();
  res.json({ ok: true, data: { retailerCollaborationRequests: rows } });
});

export const listSecurityEvents = asyncHandler(async (req, res) => {
  const rows = await SecurityEvent.find({})
    .sort({ createdAt: -1 })
    .limit(limit(req.query.limit))
    .lean();
  res.json({ ok: true, data: { securityEvents: rows } });
});

function limit(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, MAX_LIMIT)
    : 50;
}
