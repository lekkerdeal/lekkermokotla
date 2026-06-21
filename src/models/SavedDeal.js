import mongoose from "mongoose";
import { optionalNumber, requiredUserRef, textField } from "./schemaFields.js";

const { Schema } = mongoose;

const dealSnapshotSchema = new Schema(
  {
    dealId: textField({ required: true, max: 500 }),
    productKey: textField({ max: 160 }),
    title: textField({ required: true, max: 220 }),
    retailer: textField({ max: 80 }),
    category: textField({ max: 80 }),
    productUrl: textField({ max: 1000 }),
    imageUrl: textField({ max: 1000 }),
    currentPrice: optionalNumber(),
    oldPrice: optionalNumber(),
    discountPercent: optionalNumber(0),
    scrapedAt: { type: Date, default: null },
  },
  { _id: false },
);

const savedDealSchema = new Schema(
  {
    userId: requiredUserRef(),
    dealId: textField({ required: true, max: 500 }),
    productKey: textField({ max: 160, index: true }),
    snapshot: { type: dealSnapshotSchema, required: true },
    notes: textField({ max: 500 }),
  },
  { timestamps: true },
);

savedDealSchema.index({ userId: 1, dealId: 1 }, { unique: true });

export const SavedDeal = mongoose.model("SavedDeal", savedDealSchema);
