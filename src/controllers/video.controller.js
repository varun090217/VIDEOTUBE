import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removeFromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // Parse page and limit to integers
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Build the filter object
  const filter = {};

  if (query) {
    filter.title = { $regex: query, $options: "i" }; // Case-insensitive partial match on title
  }

  if (userId) {
    filter.owner = userId; // Filter by userId if provided
  }

  // Set up sorting options
  const sortOptions = {};
  sortOptions[sortBy] = sortType === "desc" ? -1 : 1;

  // Fetch videos
  const videos = await Video.find(filter)
    .populate({
      path: "owner",
      select: "username fullname avatar", // Include necessary fields from the owner
    })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort(sortOptions);

  // Count total videos for pagination
  const totalVideos = await Video.countDocuments(filter);

  // Build the response
  const response = {
    currentPage: pageNum,
    totalPages: Math.ceil(totalVideos / limitNum),
    totalVideos,
    videos,
  };

  // Send the response
  res
    .status(200)
    .json(new ApiResponse(200, response, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, views, duration, isPublished } = req.body;

  // TODO: get video, upload to cloudinary, create video

  const videoFile = req.files["videoFile"]?.[0].path;
  const thumbnailFile = req.files["thumbnail"]?.[0].path;

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailFile) {
    throw new ApiError(400, "Thumbnail is required");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  let videoUploadResponse = "";
  let thumbnailUploadResponse = "";
  try {
    videoUploadResponse = await uploadOnCloudinary(videoFile);
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Failed to upload video to Cloudinary"
    );
  }

  try {
    thumbnailUploadResponse = await uploadOnCloudinary(thumbnailFile);
  } catch (error) {
    throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
  }

  if (!videoUploadResponse?.url || !thumbnailUploadResponse?.url) {
    throw new ApiError(
      500,
      "Failed to upload video or thumbnail to Cloudinary"
    );
  }

  // Create a new video document
  const video = new Video({
    videoFile: videoUploadResponse.url,
    thumbnail: thumbnailUploadResponse.url,
    title,
    description,
    views,
    duration,
    isPublished,
    owner: req.user._id, // Assuming `req.user` is populated by auth
    publicId: videoUploadResponse.public_id, // Store the Cloudinary public ID for future deletions if needed
  });

  await video.save();

  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Fetch the video from the database
  const video = await Video.findById(videoId)
    .populate({
      path: "owner",
      select: "fullname username avatar", // Fetch relevant fields of the owner
    })
    .exec();

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description, views, duration, isPublished } = req.body;
  const thumbnailLocalPath = req.files["thumbnail"]?.[0].path;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const updateData = {};

  // If a new title is provided, add it to the update data
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (title) updateData.title = title;
  if (views) updateData.views = views;
  if (duration) updateData.duration = duration;
  if (isPublished) updateData.isPublished = isPublished;

  // If a thumbnail is uploaded, upload it to Cloudinary
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(500, "Error while uploading thumbnail to Cloudinary");
    }

    updateData.thumbnail = thumbnail.url;
  }

  // Update the video in the database
  const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
    new: true, // Return the updated video
  });

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Find the video to delete
  const video = await Video.findById(videoId);

  console.log("Video: " + video);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the logged-in user is the owner of the video
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  // Remove video from Cloudinary
  const deletionResult = await removeFromCloudinary(video.publicId);

  if (!deletionResult.result === "ok") {
    throw new ApiError(500, "Failed to delete the video from Cloudinary");
  }

  // Delete video from the database
  await Video.findByIdAndDelete(videoId);

  res
    .status(200)
    .json(new ApiResponse(204, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Find the video by ID
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the logged-in user is the owner of the video
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  // Toggle the published status
  video.isPublished = !video.isPublished;

  // Save the updated video
  await video.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videoId: video._id,
        isPublished: video.isPublished,
      },
      `Video publish status updated to ${video.isPublished ? "published" : "unpublished"}`
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
