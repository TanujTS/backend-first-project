import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async(req, res) => {
    const { channel } = req.params;
    if (channel.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself.")
    }
    const isSubscribed = await Subscription.findOne({
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
        channel: new mongoose.Types.ObjectId(channel),
    })
    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed._id);
        return res
        .status(200)
        .json(
            new ApiResponse(400, {}, "Unsubscribed successfully!")
        )
    }
    const subscription = await Subscription.create({
        subscriber: req.user?._id, channel
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscription, "Subscribed successfully!")
    )
})

const getUserChannelSubscribers = asyncHandler(async(req, res) => {
    const {channelId} = req.params;
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        // {
        //     $count: "totalCount"
        // }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully.")
    )
})

const getSubscribedChannels = asyncHandler(async(req, res) => {
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $count: "totalCount"
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, subscriptions, "Fetched subscribed channels successfully!"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}