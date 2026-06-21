import { Comment } from "../models/index.js";
import { AppError } from "../utils/applicationError.js";
import { asyncHandler } from "../utils/asynchronousRouteHandler.js";
import { optionalString, requireEnum, requireString } from "../utils/validationRules.js";

const TARGET_TYPES = ["deal", "product", "review"];

export const listComments = asyncHandler(async (req, res) => {
  const filter = {
    targetType: requireEnum(req.query.targetType, TARGET_TYPES, "targetType"),
    targetId: requireString(req.query.targetId, { field: "targetId", label: "Target ID", max: 500 }),
    visibility: "public",
    moderationStatus: "visible"
  };
  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 50, 100))
    .lean();
  res.json({ ok: true, data: { comments } });
});

export const createComment = asyncHandler(async (req, res) => {
  const comment = await Comment.create({
    userId: req.user.id,
    authorName: publicAuthorName(req.user),
    authorProvince: req.user.province || "",
    authorCity: req.user.city || "",
    targetType: requireEnum(req.body.targetType, TARGET_TYPES, "targetType"),
    targetId: requireString(req.body.targetId, { field: "targetId", label: "Target ID", max: 500 }),
    body: requireString(req.body.body, { field: "body", label: "Comment", min: 2, max: 280 }),
    visibility: req.body.visibility === "private" ? "private" : "public"
  });
  res.status(201).json({ ok: true, data: { comment } });
});

export const listMyComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: { comments } });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.commentId,
    userId: req.user.id,
  });
  if (!comment) {
    throw new AppError("Reply not found.", {
      statusCode: 404,
      code: "COMMENT_NOT_FOUND",
    });
  }
  comment.body = requireString(req.body.body, {
    field: "body",
    label: "Reply",
    min: 2,
    max: 280,
  });
  await comment.save();
  res.json({ ok: true, data: { comment } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const deleted = await Comment.findOneAndDelete({
    _id: req.params.commentId,
    userId: req.user.id,
  });
  if (!deleted) {
    throw new AppError("Reply not found.", {
      statusCode: 404,
      code: "COMMENT_NOT_FOUND",
    });
  }
  res.status(204).send();
});

export const reactToComment = asyncHandler(async (req, res) => {
  const reaction = requireEnum(req.body.reaction, ["like", "dislike", "clear"], "reaction");
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    throw new AppError("Reply not found.", {
      statusCode: 404,
      code: "COMMENT_NOT_FOUND",
    });
  }
  comment.likedBy.pull(req.user.id);
  comment.dislikedBy.pull(req.user.id);
  if (reaction === "like") comment.likedBy.addToSet(req.user.id);
  if (reaction === "dislike") comment.dislikedBy.addToSet(req.user.id);
  await comment.save();
  res.json({
    ok: true,
    data: {
      comment: {
        id: comment.id,
        likes: comment.likedBy.length,
        dislikes: comment.dislikedBy.length,
      },
    },
  });
});

function publicAuthorName(user) {
  return user.username || "LekkerDeal shopper";
}
