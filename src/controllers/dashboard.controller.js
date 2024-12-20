import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
  console.log("requesting channel");

  const { channelId } = req.params;

  console.log("Channel ID: " + channelId);

  // Get the channel (User) details
  const channel = await User.findById(channelId).select(
    "-password -refreshToken"
  );
  console.log("Channel: " + channel);

  if (!channel) {
    return res.status(404).json(new ApiResponse(404, [], "Channel not found"));
  }

  // Get total videos count for the channel
  const totalVideos = await Video.countDocuments({ owner: channelId });

  // Get total views across all videos of the channel
  const totalViews = await Video.aggregate([
    { $match: { owner: channelId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  // Get total likes across all videos of the channel
  const totalLikes = await Video.aggregate([
    { $match: { owner: channelId } },
    { $unwind: "$likes" },
    { $group: { _id: null, totalLikes: { $sum: 1 } } },
  ]);

  // Get total subscribers for the channel
  const totalSubscribers = await User.countDocuments({
    subscriptions: { $in: [channelId] },
  });

  // Prepare the stats data
  const stats = {
    totalVideos,
    totalViews: totalViews[0]?.totalViews || 0,
    totalLikes: totalLikes[0]?.totalLikes || 0,
    totalSubscribers,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats retrieved successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  // Fetch videos uploaded by the channel
  const videos = await Video.find({ owner: channelId })
    .populate("owner", "fullname username avatar") // Populate channel (user) details
    .sort({ createdAt: -1 }) // Sort by latest uploaded video
    .select("title description videoFile thumbnail createdAt"); // Include video and thumbnail fields

  if (!videos || videos.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No videos found for this channel"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});
export { getChannelStats, getChannelVideos };
