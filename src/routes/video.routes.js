import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/publish-video").post(verifyJWT,
     upload.fields([
        {
            name: "thumbnail",
            maxCount: 1
        },
        {
            name: "video",
            maxCount: 1
        }
     ]), 
     publishAVideo)
router.route("/search").post(verifyJWT, getAllVideos)

export default router