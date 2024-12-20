import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Convert page and limit to integers
  const pageNumber = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);

  // Calculate skip value for pagination
  const skip = (pageNumber - 1) * pageLimit;

  // Get all comments for the video
  const comments = await Comment.find({ video: videoId })
    .sort({ createdAt: -1 }) // Sort by the latest comment first
    .skip(skip) // Skip based on page number
    .limit(pageLimit); // Limit the number of comments per page

  if (!comments || comments.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No comments found for this video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params; // Video ID from URL
  const { content } = req.body; // Comment text from request body

  console.log(content, req.user);

  // Validate the request
  if (!content || content.trim().length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Comment text is required"));
  }
  console.log("text generated");
  // Create a new comment object
  const newComment = new Comment({
    content,
    video: videoId, // Reference to the video being commented on
    owner: req.user.id, // Reference to the user making the comment
  });

  // Save the new comment to the database
  await newComment.save();

  console.log("Comment Saved");

  // Optionally, populate the comment with user data (e.g., fullname, username, avatar)
  const populatedComment = await Comment.findById(newComment._id);

  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params; // Comment ID from URL
  const { content } = req.body; // New text for the comment

  // Validate the input
  if (!content || content.trim().length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Comment text is required"));
  }

  // Find the comment by ID
  const comment = await Comment.findById(commentId);

  console.log("Comment: " + JSON.stringify(comment));

  // Check if the comment exists
  if (!comment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Comment not found"));
  }

  // Check if the user is the owner of the comment
  if (comment.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          null,
          "You are not authorized to update this comment"
        )
      );
  }

  // Update the comment text
  comment.content = content;

  // Save the updated comment
  await comment.save();

  // Optionally, populate user data (e.g., fullname, username, avatar)
  const updatedComment = await Comment.findById(comment._id)

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params; // Get the comment ID from the URL

  // Find the comment by ID
  const comment = await Comment.findById(commentId);

  // Check if the comment exists
  if (!comment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Comment not found"));
  }

  // Check if the user is the owner of the comment
  if (comment.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          null,
          "You are not authorized to delete this comment"
        )
      );
  }

  // Delete the comment
  try {
    const commentRemoved = await Comment.findByIdAndDelete(commentId);
  } catch (error) {
    throw new ApiError(500, "Something went wrong while deleting the comment");
    _;
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
