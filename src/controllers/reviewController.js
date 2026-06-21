import { Comment, REVIEW_TYPES, Review } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import { optionalString, requireEnum, requireString } from "../utils/validationRules.js";

export const listReviews = asyncHandler(async (req, res) => {
  const filter = { visibility: "public", moderationStatus: "visible" };
  if (req.query.dealId) filter.dealId = optionalString(req.query.dealId, 500);
  if (req.query.productKey) filter.productKey = optionalString(req.query.productKey, 160);
  if (req.query.reviewType) filter.reviewType = requireEnum(req.query.reviewType, REVIEW_TYPES, "reviewType");

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 50, 100))
    .lean();
  const reviewIds = reviews.map((review) => String(review._id));
  const replies = reviewIds.length
    ? await Comment.find({
        targetType: "review",
        targetId: { $in: reviewIds },
        visibility: "public",
        moderationStatus: "visible",
      })
        .sort({ createdAt: 1 })
        .lean()
    : [];
  const repliesByReviewId = replies.reduce((map, reply) => {
    const key = String(reply.targetId);
    if (!map[key]) map[key] = [];
    map[key].push(reply);
    return map;
  }, {});
  const hydratedReviews = reviews.map((review) => ({
    ...review,
    likes: review.likedBy?.length || 0,
    dislikes: review.dislikedBy?.length || 0,
    replies: repliesByReviewId[String(review._id)] || [],
  }));

  res.json({ ok: true, data: { reviews: hydratedReviews } });
});

export const getReviewCounts = asyncHandler(async (req, res) => {
  const dealIds = sanitizeStringList(req.body.dealIds, 500);
  const productKeys = sanitizeStringList(req.body.productKeys, 160);

  const [dealCounts, productCounts] = await Promise.all([
    aggregateReviewCounts("dealId", dealIds),
    aggregateReviewCounts("productKey", productKeys),
  ]);

  res.json({
    ok: true,
    data: {
      deals: dealCounts,
      products: productCounts,
    },
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const productKey = optionalString(req.body.productKey, 160);
  const dealId = optionalString(req.body.dealId, 500);
  await assertNoDuplicateReview({
    userId: req.user.id,
    productKey,
    dealId,
  });
  const review = await Review.create({
    userId: req.user.id,
    authorName: publicAuthorName(req.user),
    authorProvince: req.user.province || "",
    authorCity: req.user.city || "",
    dealId,
    productKey,
    dealTitle: optionalString(req.body.dealTitle, 220),
    retailer: optionalString(req.body.retailer, 80),
    reviewType: requireEnum(req.body.reviewType, REVIEW_TYPES, "reviewType"),
    rating: requireRating(req.body.rating),
    comment: requireString(req.body.comment, { field: "comment", label: "Comment", min: 12, max: 280 }),
    visibility: req.body.visibility === "private" ? "private" : "public"
  });
  res.status(201).json({ ok: true, data: { review } });
});

async function assertNoDuplicateReview({ userId, productKey, dealId }) {
  const filter = { userId };
  if (productKey) {
    filter.productKey = productKey;
  } else if (dealId) {
    filter.dealId = dealId;
  } else {
    return;
  }
  const existing = await Review.exists(filter);
  if (existing) {
    throw new AppError("You have already reviewed this product.", {
      statusCode: 409,
      code: "REVIEW_DUPLICATE",
      field: "productKey",
    });
  }
}

export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: { reviews } });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.reviewId,
    userId: req.user.id,
  });
  if (!review) {
    throw new AppError("Review not found.", {
      statusCode: 404,
      code: "REVIEW_NOT_FOUND",
    });
  }
  review.reviewType = requireEnum(req.body.reviewType, REVIEW_TYPES, "reviewType");
  review.rating = requireRating(req.body.rating);
  review.retailer = optionalString(req.body.retailer, 80);
  review.comment = requireString(req.body.comment, {
    field: "comment",
    label: "Comment",
    min: 12,
    max: 280,
  });
  await review.save();
  res.json({ ok: true, data: { review } });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const deleted = await Review.findOneAndDelete({
    _id: req.params.reviewId,
    userId: req.user.id,
  });
  if (!deleted) {
    throw new AppError("Review not found.", {
      statusCode: 404,
      code: "REVIEW_NOT_FOUND",
    });
  }
  await Comment.deleteMany({ targetType: "review", targetId: req.params.reviewId });
  res.status(204).send();
});

export const reactToReview = asyncHandler(async (req, res) => {
  const reaction = requireEnum(req.body.reaction, ["like", "dislike", "clear"], "reaction");
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    throw new AppError("Review not found.", {
      statusCode: 404,
      code: "REVIEW_NOT_FOUND",
    });
  }
  review.likedBy.pull(req.user.id);
  review.dislikedBy.pull(req.user.id);
  if (reaction === "like") review.likedBy.addToSet(req.user.id);
  if (reaction === "dislike") review.dislikedBy.addToSet(req.user.id);
  await review.save();
  res.json({
    ok: true,
    data: {
      review: {
        id: review.id,
        likes: review.likedBy.length,
        dislikes: review.dislikedBy.length,
      },
    },
  });
});

function requireRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 5;
  }
  return rating;
}

function publicAuthorName(user) {
  return user.username || "LekkeDeal shopper";
}

function sanitizeStringList(value, maxLength) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => optionalString(item, maxLength))
        .filter(Boolean)
        .slice(0, 1000),
    ),
  ];
}

async function aggregateReviewCounts(field, values) {
  if (!values.length) return [];
  const rows = await Review.aggregate([
    {
      $match: {
        [field]: { $in: values },
        visibility: "public",
        moderationStatus: "visible",
      },
    },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return rows.map((row) => ({ key: row._id, count: row.count }));
}
