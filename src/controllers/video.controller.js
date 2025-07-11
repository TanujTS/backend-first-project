import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
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
            200, videos.docs, "Videos fetched successfully!"
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
    const video = await Video.findById(videoId);
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, video, "Video fetched successfully!"
        )
    )
})

const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const deletedVid = Video.findByIdAndDelete(videoId);
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {}, "Video deleted successfully!" 
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    const video = await Video.findById(videoId);
    console.log(`${video.owner._id} and ${req.user._id}`)
    if (video.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "user not authorized")
    }

    const thumbnail = req.file.path;
    const newThumbnail = await uploadOnCloudinary(thumbnail)

    await deleteFromCloudinary(video.thumbnail);

    await Video.updateOne(
        {_id: videoId},
        {
            $set: {
                title,
                description,
                thumbnail: newThumbnail.url
            }
        }
    )
    const updatedVid = await Video.findById(videoId) 
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, updatedVid, "Video details updated successfully!"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);
    if (video.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "User is not authorized to perform this action.")
    }

    const toggledVid = await Video.findByIdAndUpdate(videoId,
        {
        $set: {
            isPublished: !isPublished
        }
    },
        {new: true}
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, toggledVid, "Publish status toggled successfully!"
        )
    )
})

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublishStatus
}