import mongoose from "mongoose";
import { textField } from "./schemaFields.js";

const securityEventSchema = new mongoose.Schema(
  {
    eventType: textField({ required: true, max: 80, index: true }),
    code: textField({ max: 80, index: true }),
    ipAddress: textField({ max: 80, index: true }),
    userAgent: textField({ max: 300 }),
    phoneNumber: textField({ max: 20, index: true }),
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    route: textField({ max: 200 }),
    method: textField({ max: 12 }),
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ eventType: 1, createdAt: -1 });

export const SecurityEvent = mongoose.model(
  "SecurityEvent",
  securityEventSchema,
);
