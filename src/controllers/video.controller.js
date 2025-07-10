import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

(async function() {
    try {
        const checkSearchIndex = await Video.listSearchIndexes();
        if (checkSearchIndex.length > 0 && checkSearchIndex[0].name === 'mediax-default') {return}
        await Video.createSearchIndex({
        name: "mediax-default",
        definition: {
            "mappings": {
                "dynamic": true
            }
        }
    })
    } catch (error) {
        throw new ApiError(500, "Could not generate search index.")
    }
})();



const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    // const { page = 1, limit=10, query, sortBy, sortType } = req.body
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    

    const pipeline = [
        {
            $search: {
                index: "mediax-default",
                text: {
                    query: query,
                    path: ["title", "description"],
                }
            }
        },
        {
            $sort: {
                [sortBy]: Number(sortType) //sortBy should be either duration/views/createdAt and sortType = 1, -1
            }
        },
        "__PREPAGINATE__"
    ]

    const options = {
        page, limit
    }

    const videos = await Video.aggregatePaginate(pipeline, options)


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, videos.docs, "Videos fetched unnsuccessfully!"
        )
    )

})


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

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
})

export {
    publishAVideo,
    getAllVideos
}