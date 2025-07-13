import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const getVideoComments = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId) ,
            },
        },
         {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        "__PREPAGINATE__"
    ]
    const options = {page, limit}
    const comments = await Comment.aggregatePaginate(pipeline, options);
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, comments, "Comments fetched successfully!"
        )
    )

})

const addComment = asyncHandler(async(req, res) => {
    const { content, videoId } = req.body;
    if (!content || !videoId) { throw new ApiError(400, "Content or VideoID not provided.")}
    const comment = await Comment.create({
        content, video: videoId, owner: req.user?._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, comment , "Comment added succesfully!"
        )
    )
})


const updateComment = asyncHandler(async (req, res) => {
    const { commentId, content} = req.body;
    if (!commentId || !content) { throw new ApiError(400, "Information not provided.")}
    const comment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, comment, "Updated comment successfully!"
        )
    )
})

const deleteComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params;
    await Comment.findByIdAndUpdate(commentId);
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {}, "Comment deleted successfully!"
        )
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}