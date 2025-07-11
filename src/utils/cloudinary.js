import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload on cloudinary
        const uploadResult = await cloudinary.uploader
        .upload(localFilePath, {
            resource_type: "auto"
        })
        //file uploaded successfully
        console.log("file is uploaded on cloudinary: ", uploadResult.url);
        fs.unlinkSync(localFilePath)
        return uploadResult
    } catch (error) {
        fs.unlinkSync(localFilePath) //removes locally saved temp files
        return null
    }
}

const deleteFromCloudinary = async (url) => {
    const filename = url.split('/').pop().split('.')[0]
    await cloudinary.uploader.destroy(filename);
    console.log("file deleted from cloudinary!")
}

export {uploadOnCloudinary, deleteFromCloudinary}