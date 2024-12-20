import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Tweet content is required");
  }

  if (content.length > 280) {
    throw new ApiError(400, "Tweet content cannot exceed 280 characters");
  }

  // Create a new tweet
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
    createdAt: new Date(),
  });

  res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate `userId`
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Pagination logic
  const skip = (page - 1) * limit;

  // Fetch tweets from the database
  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 }) // Sort by most recent tweets first
    .skip(skip)
    .limit(parseInt(limit))
    .populate("owner", "fullname username avatar") // Populate user details
    .lean(); // Convert to plain JavaScript objects for efficiency

  // Get total count of tweets for the user
  const totalTweets = await Tweet.countDocuments({ owner: userId });

  // Calculate total pages
  const totalPages = Math.ceil(totalTweets / limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
        totalTweets,
        totalPages,
        currentPage: parseInt(page),
      },
      "User tweets fetched successfully"
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  // Validate `tweetId` and `content`
  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  // Find and update the tweet
  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: req.user?._id }, // Ensure the user owns the tweet
    { $set: { content, updatedAt: new Date() } }, // Update content and timestamp
    { new: true } // Return the updated document
  ).populate("owner", "fullname username avatar"); // Populate owner details

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found or unauthorized to update");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // Validate `tweetId`
  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  // Find and delete the tweet
  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user?._id, // Ensure the user owns the tweet
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found or unauthorized to delete");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
