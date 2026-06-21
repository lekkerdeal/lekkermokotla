import mongoose from "mongoose";

const { Schema } = mongoose;

export function requiredUserRef() {
  return {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  };
}

export function textField({ required = false, max = 255, min, defaultValue = "", index = false, lowercase = false } = {}) {
  return {
    type: String,
    trim: true,
    required,
    ...(min ? { minlength: min } : {}),
    ...(max ? { maxlength: max } : {}),
    ...(defaultValue !== undefined && !required ? { default: defaultValue } : {}),
    ...(index ? { index: true } : {}),
    ...(lowercase ? { lowercase: true } : {}),
  };
}

export function enumField(values, { required = false, defaultValue, index = false } = {}) {
  return {
    type: String,
    enum: values,
    required,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(index ? { index: true } : {}),
  };
}

export function publicAuthorFields() {
  return {
    authorName: textField({ required: true, max: 80 }),
    authorProvince: textField({ max: 60 }),
    authorCity: textField({ max: 60 }),
  };
}

export function visibilityFields() {
  return {
    visibility: enumField(["public", "private"], { defaultValue: "public", index: true }),
    moderationStatus: enumField(["visible", "pending", "hidden"], { defaultValue: "visible", index: true }),
  };
}

export function optionalNumber(defaultValue = null) {
  return { type: Number, default: defaultValue };
}
