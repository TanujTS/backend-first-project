import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/*
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit=10, query, sortBy, sortType, channel } = req.body
    //TODO: get all videos based on query, sort, pagination
    await Video.aggregate([
        {
            $match: {
                $text: {
                    $search: query,
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $match: {
                            username: channel,
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            coverImage: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])
})
*/

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    
    // const uploadedVideo = await uploadOnCloudinary(req.file?.path)
    // const video = Video.create(
    //     videoFile: uploadedVideo.url,
    //     thumbnail
    // )
    const localVideoPath = req.files?.video[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path
    const videoUploaded = await uploadOnCloudinary(localVideoPath)
    const thumbnailUploaded = await uploadOnCloudinary(thumbnailPath)
    console.log(videoUploaded)
    const video = await Video.create({
        videoFile: videoUploaded.url,
        thumbnail: thumbnailUploaded.url,
        title,
        description,
        duration: videoUploaded.duration,
        owner: req.user._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, video, "success"
        )
    )
})


export {
    publishAVideo
}