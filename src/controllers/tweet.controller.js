import {Tweet} from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(404, "User not authorized")
    }
    const tweet = await Tweet.create(
        {
            owner: userId,
            content
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, tweet , "Tweet posted successfully!"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userTweets = await User.aggregate([
        {
            $match: {
                username
            }
        },
        {
            $project: {
                username: 1,
                avatar: 1,
                coverImage: 1,
                fullName: 1
            }
        },
        {
            $lookup: {
                from: "tweets",
                foreignField: "owner",
                localField: "_id",
                as: "tweets"
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "User's tweets fetched successfully!")
    )
})

const editTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;
    const { updatedContent } = req.body;
    const tweet = await Tweet.findById(tweetId)
    if (toString(tweet.owner) != toString(req.user._id)) {
        throw new ApiError(400, "User not authorized to perform this action!")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content: updatedContent
            }
        },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet edit successfully!")
    )
})

const deleteTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.body
    await Tweet.findByIdAndDelete(tweetId);
    return res
    .status(200)
    .json(
        new ApiResponse(
        200, {}, "tweet deleted successfully!"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    editTweet,
    deleteTweet
}
