import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    getAllVideos, 
    publishAVideo,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT)

router.route("/publish-video").post(
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
router.route("/search").get(getAllVideos)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router