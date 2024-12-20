import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id; // Get user ID from the authenticated user

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  if (!userId) {
    throw new ApiError(400, "User is not authenticated");
  }

  // Find the channel to check if it exists
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Toggle the subscription: If the user is already subscribed, unsubscribe, else subscribe
  let isSubscribed;

  try {
    // Check if the subscriberId exists in the subscriber list
    isSubscribed = channel?.subscribers.includes(userId);
  } catch (error) {
    console.error("Error checking subscription:", error);
    throw error;
  }

  console.log("isSubscribed: " + isSubscribed);
  if (isSubscribed) {
    // Unsubscribe the user
    await User.findByIdAndUpdate(
      channelId,
      { $pull: { subscribers: userId } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      userId,
      { $pull: { subscribed: channelId } },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  } else {
    // Subscribe the user
    await User.findByIdAndUpdate(
      channelId,
      { $push: { subscribers: userId } },
      { new: true }
    );

    await User.findByIdAndUpdate(
      userId,
      { $push: { subscribed: channelId } },
      { new: true }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Subscribed successfully"));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  // Find the channel by ID
  const channel = await User.findById(channelId).select("subscribers");

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Get the list of subscribers
  const subscribers = await User.find({
    _id: { $in: channel.subscribers },
  }).select("fullname username avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Subscriber ID is required");
  }

  // Find the user by subscriberId
  const user = await User.findById(channelId).select("subscribed");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get the list of channels the user is subscribed to
  const channels = await User.find({
    _id: { $in: user.subscribed },
  }).select("name description owner");

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
