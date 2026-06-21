import { SavedDeal } from "../models/index.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import { optionalString, requireString } from "../utils/validationRules.js";

export const listSavedDeals = asyncHandler(async (req, res) => {
  const savedDeals = await SavedDeal.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: { savedDeals } });
});

export const saveDeal = asyncHandler(async (req, res) => {
  const snapshot = buildSnapshot(req.body.snapshot || req.body);
  const savedDeal = await SavedDeal.findOneAndUpdate(
    { userId: req.user.id, dealId: snapshot.dealId },
    {
      $set: {
        userId: req.user.id,
        dealId: snapshot.dealId,
        productKey: snapshot.productKey,
        snapshot,
        notes: optionalString(req.body.notes, 500)
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ ok: true, data: { savedDeal } });
});

export const deleteSavedDeal = asyncHandler(async (req, res) => {
  const productKey = optionalString(req.query.productKey, 160);
  await SavedDeal.deleteMany({
    userId: req.user.id,
    $or: [
      { dealId: req.params.dealId },
      ...(productKey ? [{ productKey }] : []),
    ],
  });
  res.status(204).send();
});

function buildSnapshot(payload) {
  return {
    dealId: requireString(payload.dealId, { field: "dealId", label: "Deal ID", max: 500 }),
    productKey: optionalString(payload.productKey, 160),
    title: requireString(payload.title, { field: "title", label: "Deal title", max: 220 }),
    retailer: optionalString(payload.retailer, 80),
    category: optionalString(payload.category, 80),
    productUrl: optionalString(payload.productUrl, 1000),
    imageUrl: optionalString(payload.imageUrl, 1000),
    currentPrice: numberOrNull(payload.currentPrice),
    oldPrice: numberOrNull(payload.oldPrice),
    discountPercent: Number(payload.discountPercent) || 0,
    scrapedAt: payload.scrapedAt ? new Date(payload.scrapedAt) : null
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
