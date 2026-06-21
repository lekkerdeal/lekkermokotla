import mongoose from "mongoose";
import { requiredUserRef, textField } from "./schemaFields.js";

const dealReportSchema = new mongoose.Schema(
  {
    userId: requiredUserRef(),
    reporterName: textField({ required: true, max: 80 }),
    reporterPhoneNumber: textField({ required: true, max: 20 }),
    reporterProvince: textField({ max: 60 }),
    reporterCity: textField({ max: 60 }),
    dealId: textField({ max: 500, index: true }),
    productKey: textField({ max: 160, index: true }),
    dealTitle: textField({ max: 220 }),
    retailer: textField({ max: 80 }),
    comment: textField({ required: true, min: 8, max: 500 }),
    status: {
      type: String,
      enum: ["new", "reviewing", "responded", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

dealReportSchema.index({ createdAt: -1 });
dealReportSchema.index({ status: 1, createdAt: -1 });
dealReportSchema.index({ reporterPhoneNumber: 1, createdAt: -1 });

export const DealReport = mongoose.model("DealReport", dealReportSchema);
