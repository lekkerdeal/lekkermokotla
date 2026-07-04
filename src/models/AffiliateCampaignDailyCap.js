import mongoose from "mongoose";

const affiliateCampaignDailyCapSchema = new mongoose.Schema(
  {
    campaign: { type: String, required: true, trim: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    count: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

affiliateCampaignDailyCapSchema.index({ campaign: 1, day: 1 }, { unique: true });

export const AffiliateCampaignDailyCap = mongoose.model(
  "AffiliateCampaignDailyCap",
  affiliateCampaignDailyCapSchema,
);
