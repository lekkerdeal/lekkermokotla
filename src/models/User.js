import mongoose from "mongoose";
import { textField } from "./schemaFields.js";

const { Schema } = mongoose;

const alertPreferencesSchema = new Schema(
  {
    channels: {
      type: [String],
      enum: ["whatsapp", "sms"],
      default: ["whatsapp"],
    },
    preferredCategories: { type: [String], default: [] },
    preferredRetailers: { type: [String], default: [] },
    minimumDiscount: { type: Number, min: 0, max: 95, default: 0 },
    minimumPrice: { type: Number, min: 0, default: null },
    maximumPrice: { type: Number, min: 0, default: null },
    alertsEnabled: { type: Boolean, default: false },
    consentedAt: { type: Date, default: null },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    username: textField({ min: 3, max: 32, lowercase: true }),
    displayName: textField({ max: 80 }),
    email: textField({ max: 120, lowercase: true }),
    phoneNumber: textField({ max: 20 }),
    phoneVerified: { type: Boolean, default: false },
    province: textField({ max: 60 }),
    city: textField({ max: 60 }),
    passwordHash: { type: String, select: false, default: "" },
    alertPreferences: { type: alertPreferencesSchema, default: () => ({}) },
    roles: { type: [String], default: ["user"] },
    marketingConsentAt: { type: Date, default: null },
    popiaConsentAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordResetAt: { type: Date, default: null },
    disabledAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $type: "string", $gt: "" } },
  },
);
userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: "string", $gt: "" } },
  },
);
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" } },
  },
);
export const User = mongoose.model("User", userSchema);
