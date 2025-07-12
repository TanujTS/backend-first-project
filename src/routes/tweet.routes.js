import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, editTweet, getUserTweets } from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT)
router.route("/create-tweet").post(createTweet)
router.route("/:username").get(getUserTweets)
router.route("/edit/:tweetId").patch(editTweet)
router.route("/delete").delete(deleteTweet)

export default router