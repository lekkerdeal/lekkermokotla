import mongoose from "mongoose";
import { enumField, publicAuthorFields, requiredUserRef, textField, visibilityFields } from "./schemaFields.js";

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    userId: requiredUserRef(),
    ...publicAuthorFields(),
    targetType: enumField(["deal", "product", "review"], { required: true, index: true }),
    targetId: textField({ required: true, max: 500, index: true }),
    body: textField({ required: true, min: 2, max: 280 }),
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dislikedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    ...visibilityFields(),
  },
  { timestamps: true },
);

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
