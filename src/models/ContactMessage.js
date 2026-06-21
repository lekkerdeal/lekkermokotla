import mongoose from "mongoose";
import { textField } from "./schemaFields.js";

const contactMessageSchema = new mongoose.Schema(
  {
    name: textField({ max: 80 }),
    phoneNumber: textField({ max: 20 }),
    subject: textField({ required: true, min: 2, max: 120 }),
    message: textField({ required: true, min: 8, max: 4000 }),
    status: {
      type: String,
      enum: ["new", "reviewing", "responded", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ phoneNumber: 1, createdAt: -1 });

export const ContactMessage = mongoose.model(
  "ContactMessage",
  contactMessageSchema,
);
