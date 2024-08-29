import { isVerified, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";

import { Router } from "express";
import { NewPlaylistValidationSchema } from "#/utils/validationSchema";
import { createPlaylist } from "#/controllers/playlistController";
import { updatePlaylist } from "#/controllers/playlistController";
import { OldPlaylistValidationSchema } from "#/utils/validationSchema";
import { removePlaylist } from "#/controllers/playlistController";
import { getPlaylistByProfile } from "#/controllers/playlistController";
import { getPlaylistAudios } from "#/controllers/playlistController";
import { getCurrentUserPlaylistAudios } from "#/controllers/playlistController";

const router = Router();

router.post(
  "/create",
  mustAuth,
  isVerified,
  validate(NewPlaylistValidationSchema),
  createPlaylist
);
router.patch(
  "/update",
  mustAuth,
  validate(OldPlaylistValidationSchema),
  updatePlaylist
);
router.delete("/remove", mustAuth, removePlaylist);

router.get("/playlist-by-profile", mustAuth, getPlaylistByProfile);
router.get("/getplaylistaudios/:playlistId", getPlaylistAudios); //of public playlists

router.get(
  "/getcurrentuserplaylistaudios/:playlistId",
  mustAuth,
  getCurrentUserPlaylistAudios
);
export default router;
