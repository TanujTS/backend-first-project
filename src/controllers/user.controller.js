import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser}