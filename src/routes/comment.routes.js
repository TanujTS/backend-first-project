import { Router } from "express";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT)

router.route("/:videoId")
    .get(getVideoComments)
    .delete(deleteComment)
router.route("/add").post(addComment)
router.route("/update").patch(updateComment)

export default router