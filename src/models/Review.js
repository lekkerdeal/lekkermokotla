import mongoose from "mongoose";
import { enumField, publicAuthorFields, requiredUserRef, textField, visibilityFields } from "./schemaFields.js";

const { Schema } = mongoose;

export const REVIEW_TYPES = [
  "product-review",
  "deal-win",
  "retailer-request",
  "price-issue",
  "alert-feedback",
  "general",
];

const reviewSchema = new Schema(
  {
    userId: requiredUserRef(),
    ...publicAuthorFields(),
    dealId: textField({ max: 500, index: true }),
    productKey: textField({ max: 160, index: true }),
    dealTitle: textField({ max: 220 }),
    retailer: textField({ max: 80 }),
    reviewType: enumField(REVIEW_TYPES, { required: true, index: true }),
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: textField({ required: true, min: 12, max: 280 }),
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dislikedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    ...visibilityFields(),
  },
  { timestamps: true },
);

reviewSchema.index({ productKey: 1, createdAt: -1 });
reviewSchema.index({ dealId: 1, createdAt: -1 });
reviewSchema.index(
  { userId: 1, productKey: 1 },
  {
    unique: true,
    partialFilterExpression: { productKey: { $type: "string", $gt: "" } },
  },
);
reviewSchema.index(
  { userId: 1, dealId: 1 },
  {
    unique: true,
    partialFilterExpression: { dealId: { $type: "string", $gt: "" } },
  },
);

export const Review = mongoose.model("Review", reviewSchema);
