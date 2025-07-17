import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
import { addVideoToPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
const router = Router()

router.use(verifyJWT);
router.route("/:channel").post(toggleSubscription)
router.route("/:channelId").get(getUserChannelSubscribers)
router.route("/")
    .get(getSubscribedChannels)
    .patch(updatePlaylist)


export default router