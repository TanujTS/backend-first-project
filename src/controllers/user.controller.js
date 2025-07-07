import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        // console.log(`Access Token: ${accessToken}\nRefresh Token: ${refreshToken}`) works right here, refresh token is valid
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Access and refresh tokens could not be generated.")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    //take inputs -> emailid, username, fullname, (basically almost all of user model)
    //check with db if email exists, put validations
    //check for images, avatar -> send to cloudinary
    //send the data to db as per the user model (create user object)
    //remove password & refresh token field from response
    //check for user creation
    //return response

    const {username, email, fullName, password} = req.body;
    if (
        [fullName, email, username, password].some((field) => 
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required.")
    }
    const userExists = await User.findOne({
        $or: [{email}, {username}]
    })
    if (userExists) { throw new ApiError(409, "User already exists.")}

    const localAvatar = req.files?.avatar[0]?.path
    // const localCoverImg = req.files?.coverImage[0]?.path
    let localCoverImg
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        localCoverImg = req.files.coverImage[0].path
    }

    if (!localAvatar) {throw new ApiError(400, "Avatar is required!")}
    const avatar = await uploadOnCloudinary(localAvatar)
    const coverImg = await uploadOnCloudinary(localCoverImg)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required!");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImg?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id)?.select(
        "-password -refreshToken"
    )
    if (!createdUser) {throw new ApiError(500, "Something went wrong while registering the user.")}

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //check if already loggedin using access token, if not
    //get username or email (find user) and password
    // validate it through mongodb
    //if correct, login, if not give 400 error sereis for not authenticated
    // once logged in give refresh and access token
    //send secure cookies and response 
    const {username, email, password} = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required!")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {throw new ApiError(404, "User does not exist!")}
    
    const validatePassword = await user.isPasswordCorrect(password)
    if (!validatePassword) {throw new ApiError(401, "Invalid user credentials.!")}

    const {accessToken, refreshToken} = await generateAccessRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken, refreshToken
            },
            "User logged in successfully."
        )
    )
    
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, //this removes the field from the document
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

const refreshAccessToken = asyncHandler(async(req, res) => {
   const incomingRefreshRequest = req.cookies.refreshToken || req.body.refreshToken;

   if (!incomingRefreshRequest) {throw new ApiError(401, "Unauthorized Request")}

   try {
    const decodedToken = await jwt.verify(incomingRefreshRequest, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id);
    if (!user) {throw new ApiError(401, "Invalid refresh token!")}
 
    if (incomingRefreshRequest !== user?.refreshToken) {
     throw new ApiError(401, "Refresh token is expired or used!")
    }
    const options = {
     httpOnly: true,
     secure: true
    }
    const {accessToken, refreshToken: newRefreshToken} = await generateAccessRefreshTokens(user._id)
    console.log(`Refresh Tokens => \nOld: ${incomingRefreshRequest}\nNew: ${newRefreshToken}`)
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
     new ApiResponse(
         200,
         {accessToken, refreshToken: newRefreshToken},
         "Access token refreshed successfully!"
     )
    )
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token!")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {throw new ApiError(400, "Invalid password")}
    user.password = newPassword;
    await user.save({validateBeforeSave: false})
    
    return res
    .status(200)
    .json(
        (new ApiResponse(200, {}, "Password changed successfully!"))
    )
    // could generate new refresh and access tokens here to revoke access if logged in previously
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, req.user, "Fetched user"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required!")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, email
            }
        },
        {new: true}
     ).select("-password")
     return res
     .status(200)
     .json(new ApiResponse(
        200, user, "Account details updated successfully!"
     ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar not found")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {throw new ApiError(400, "Avatar could not be uploaded.")}
    // const user = User.findById(req.user?._id);
    // user.avatar = avatar.url;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {avatar: avatar.url}
        },
        {new: true},
    ).select("-password")
    user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Avatar updated successfully!"
        )
    )
}) 

const updateUserCover = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Cover not found")
    }
    const cover = await uploadOnCloudinary(coverLocalPath)
    if (!cover) {throw new ApiError(400, "Cover image could not be uploaded.")}

    //TODO: delete old img 
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {coverImg: cover.url}
        },
        {new: true},
    ).select("-password")
    user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Cover image updated successfully!"
        )
    )
}) 

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing.")
    }

    // User.find({username})
    // aggregation pipeline to find the subsceribers of the user
    //TODO: study aggregration pipelines and operators
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, 
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscriptions"
                },
                isSubscribed: {
                    $con :{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                isSubscribed: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])
    console.log(channel)
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel fetched successfully!")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $lookup: {
                                        $project: {
                                            username: 1,
                                            fullName: 1,
                                            avatar: 1
                                        }
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        }, 
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCover,
    getUserChannelProfile,
    getWatchHistory
}