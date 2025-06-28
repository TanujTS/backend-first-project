import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { rsort } from "semver";

const generateAccessRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

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

    if (!username || !email) {
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
            $set: {
                refreshToken: undefined,
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
    .clearCookie("accessToken")
    .json(
        new ApiResponse(200, {}, "User logged out")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser
}