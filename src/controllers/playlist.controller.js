import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body
    if (!name) {
        throw new ApiError(400, "A playlist name is required.")
    }
    const playlist = await Playlist.create({
        name, description, videos: [], owner: req.user._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, playlist, "Playlist created successfully!"
        )
    )
})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const playlists = await Playlist.find({owner: new mongoose.Types.ObjectId(req.user.id)})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, playlists, "Fetched user's playlists successfully!"
        )
    )
})

const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "The playlist does not exist!")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Fetched playlist successfully!")
    )
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params;
    const playlist = await Playlist.findById(playlistId);
    const pushedVid = await playlist.videos.push(new mongoose.Types.ObjectId(videoId));
    if (Playlist.find({
        videos: {
            $elemMatch: {id: videoId}
        }
    })) { throw new ApiError(400, "Video already exists in the playlist.")}
    playlist.save({validateBeforeSave: true})
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Pushed video to the playlist successfully!")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    await Playlist.updateOne(
        {_id: new mongoose.Types.ObjectId(playlistId)},
        { $pull: {videos: new mongoose.Types.ObjectId(videoId)} }
    )
    const playlist = await Playlist.findById(playlistId);
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully!")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    await Playlist.findByIdAndDelete(playlistId);
    return res
    .status(200)
    .json(
        new ApiResponse(200, "Deleted video successfully!")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const playlist = await Playlist.findByIdAndUpdate(
        {
            name, description
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist updated successfully!")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}