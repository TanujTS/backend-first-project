import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Like } from "../models/like.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const likeExists = await Like.findOne({video: new mongoose.Types.ObjectId(videoId)})
    if (likeExists) {
        const rmlike = await Like.findByIdAndDelete(likeExists._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, rmlike, "Removed like from video successfully!"
                )
            )
    }
    const like = await Like.create({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, like, "Liked video successfully!"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const likeExists = await Like.findOne({comment: new mongoose.Types.ObjectId(commentId)})
    if (likeExists) {
        const rmlike = await Like.findByIdAndDelete(likeExists._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, rmlike, "Removed like from comment successfully!"
                )
            )
    }
    const like = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, like, "Liked comment successfully!"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const likeExists = await Like.findOne({tweet: new mongoose.Types.ObjectId(tweetId)})
    if (likeExists) {
        const rmlike = await Like.findByIdAndDelete(likeExists._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, rmlike, "Removed like from tweet successfully!"
                )
            )
    }
    const like = await Like.create({
        video: new mongoose.Types.ObjectId(tweetId),
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, like, "Liked tweet successfully!"
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id
            }
        },
        {
            $lookup: {
                 from: "videos",
                 localField: "video",
                 foreignField: "_id",
                 as: "video"
            }
        },
        {
            $unwind: "$video"
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, videos, "Liked videos fetched."
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}