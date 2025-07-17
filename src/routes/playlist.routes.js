import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylists, removeVideoFromPlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT)

router.route("/create").post(createPlaylist)
router.route("/").get(getUserPlaylists)
router.route("/:playlistId/:videoId").get(addVideoToPlaylist)
router.route("/:playlistId/:videoId").delete(removeVideoFromPlaylist)
router.route("/:playlistId").delete(deletePlaylist)

export default router