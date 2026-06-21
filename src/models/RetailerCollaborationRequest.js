import mongoose from "mongoose";
import { requiredUserRef, textField } from "./schemaFields.js";

const retailerCollaborationRequestSchema = new mongoose.Schema(
  {
    userId: requiredUserRef(),
    requesterName: textField({ required: true, max: 80 }),
    requesterPhoneNumber: textField({ required: true, max: 20 }),
    requesterProvince: textField({ max: 60 }),
    requesterCity: textField({ max: 60 }),
    businessName: textField({ required: true, min: 2, max: 120 }),
    websiteUrl: textField({ required: true, max: 300 }),
    offerType: textField({ required: true, min: 2, max: 120 }),
    notes: textField({ max: 500 }),
    dataAccessConsent: { type: Boolean, required: true },
    consentText: textField({ required: true, max: 500 }),
    status: {
      type: String,
      enum: ["new", "reviewing", "approved", "declined", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

retailerCollaborationRequestSchema.index({ createdAt: -1 });
retailerCollaborationRequestSchema.index({ status: 1, createdAt: -1 });
retailerCollaborationRequestSchema.index({ businessName: 1 });
retailerCollaborationRequestSchema.index({ requesterPhoneNumber: 1, createdAt: -1 });

export const RetailerCollaborationRequest = mongoose.model(
  "RetailerCollaborationRequest",
  retailerCollaborationRequestSchema,
);
