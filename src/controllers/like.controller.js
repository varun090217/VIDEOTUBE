import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id; // Assuming the user ID is added to `req.user` by auth middleware

  if (!videoId) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], "Video ID is required"));
  }

  // Check if a like already exists for the user and video
  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    // If a like exists, remove it
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    // If no like exists, create one
    const newLike = new Like({
      video: videoId,
      likedBy: userId,
    });
    await newLike.save();
    return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
  }
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id; // Assuming the user ID is added to `req.user` by auth middleware

  // Check if a like already exists for the user and video
  const existingLike = await Like.findOne({
    video: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    // If a like exists, remove it
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    // If no like exists, create one
    const newLike = new Like({
      comment: commentId,
      likedBy: userId,
    });
    await newLike.save();
    return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id; // Assuming the user ID is added to `req.user` by auth middleware

  // Check if a like already exists for the user and video
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (existingLike) {
    // If a like exists, remove it
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, null, "Like removed"));
  } else {
    // If no like exists, create one
    const newLike = new Like({
      tweet: tweetId,
      likedBy: userId,
    });
    await newLike.save();
    return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // Assuming the user ID is stored in req.user by the auth middleware

  console.log("userId: " + userId);

  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], "User not authenticated"));
  }

  // Find all likes by the user for videos
  const userLikes = await Like.find({
    likedBy: userId,
  });

  console.log("userLikes: " + userLikes);

  if (userLikes.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No liked videos found"));
  }

  // Extract video IDs from the likes
  const likedVideoIds = userLikes.map((like) => like.video);

  console.log("likedVideoIds: " + likedVideoIds);

  // Find videos based on the liked video IDs
  const likedVideos = await Video.find({ _id: { $in: likedVideoIds } })
    .select("-likes") // Exclude the likes field from the response
    .populate("owner", "fullname username avatar") // Populate owner details
    .sort({ createdAt: -1 }); // Optionally sort by the latest videos first

  // Return the liked videos
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos retrieved successfully")
    );
});
export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
