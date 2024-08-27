import { mustAuth } from "#/middleware/auth";
import { Router } from "express";
import { updateFollower } from "#/controllers/profileController";
import { getPublicProfile } from "#/controllers/profileController";
import { getPublicPlaylist } from "#/controllers/profileController";
import { getAllUploadedAudio } from "#/controllers/profileController";
import { getAllploadedAudiofPassedUser } from "#/controllers/profileController";

const router = Router();

router.post("/update-follower/:profileIdtoFollow", mustAuth, updateFollower);
router.get("/info/:profileId", getPublicProfile);

router.get("/playlist/:profileId", getPublicPlaylist);

//of corrent user
router.get("/uploads", mustAuth, getAllUploadedAudio);

// of this passed user
router.get("/uploads/:profileId", getAllploadedAudiofPassedUser);
//

export default router;
