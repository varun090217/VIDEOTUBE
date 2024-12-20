import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id; // Assuming the user is authenticated and their ID is available in req.user

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  // Create a new playlist
  const newPlaylist = new Playlist({
    name,
    description,
    owner: userId, // Setting the owner of the playlist to the currently authenticated user
    videos: [], // Initialize with an empty list of videos
  });

  // Save the playlist to the database
  const savedPlaylist = await newPlaylist.save();

  return res
    .status(201)
    .json(new ApiResponse(201, savedPlaylist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Find playlists that belong to the user
  const playlists = await Playlist.find({ owner: userId }).select("-videos"); // Optionally, you can exclude the videos if not needed

  if (!playlists || playlists.length === 0) {
    return res.status(404).json(new ApiResponse(404, [], "No playlists found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User's playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // Find the playlist by ID
  const playlist = await Playlist.findById(playlistId).populate("videos"); // You can modify the populate logic if needed

  if (!playlist) {
    return res.status(404).json(new ApiResponse(404, [], "Playlist not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {videoId, playlistId } = req.params;

  // Check if the playlist exists
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    return res.status(404).json(new ApiResponse(404, [], "Playlist not found"));
  }

  // Check if the video exists
  const video = await Video.findById(videoId);
  if (!video) {
    return res.status(404).json(new ApiResponse(404, [], "Video not found"));
  }

  // Check if the video is already in the playlist
  if (playlist.videos.includes(videoId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], "Video already in the playlist"));
  }

  // Add the video to the playlist
  playlist.videos.push(videoId);

  // Save the playlist with the new video
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Find the playlist by ID
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    return res.status(404).json(new ApiResponse(404, [], "Playlist not found"));
  }

  // Check if the video exists in the playlist
  if (!playlist.videos.includes(videoId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], "Video not found in the playlist"));
  }

  // Remove the video from the playlist
  playlist.videos.pull(videoId);

  // Save the updated playlist
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // Find the playlist by ID and remove it
  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    return res.status(404).json(new ApiResponse(404, [], "Playlist not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, [], "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  // Find the playlist by ID
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res.status(404).json(new ApiResponse(404, [], "Playlist not found"));
  }

  // Update playlist details
  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;

  // Save the updated playlist
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
