import { mustAuth } from "#/middleware/auth";
import { Router } from "express";
import { updateFollower } from "#/controllers/profileController";
import { getPublicProfile } from "#/controllers/profileController";
import { getPublicPlaylist } from "#/controllers/profileController";
import { getAllUploadedAudio } from "#/controllers/profileController";
import { getAllploadedAudiofPassedUser } from "#/controllers/profileController";
import { getIsFollowing } from "#/controllers/profileController";
import { getRecommendByProfile } from "#/controllers/profileController";
import { getMyFollowers } from "#/controllers/profileController";
import { getMyFollowings } from "#/controllers/profileController";
import { getFollowersofPassedUser } from "#/controllers/profileController";
import { getFollowingsofPassedUser } from "#/controllers/profileController";

import { isAuth } from "#/middleware/auth";

const router = Router();

router.post("/update-follower/:profileIdtoFollow", mustAuth, updateFollower);
router.get("/info/:profileId", getPublicProfile);

router.get("/playlist/:profileId", getPublicPlaylist);

//of corrent user
router.get("/uploads", mustAuth, getAllUploadedAudio);

// of this passed user
router.get("/uploads/:profileId", getAllploadedAudiofPassedUser);
//

//check if cuser folloeing this profileid user
router.get("/is-following/:profileId", mustAuth, getIsFollowing);

router.get("/recommended", isAuth, getRecommendByProfile);

router.get("/myfollowers", mustAuth, getMyFollowers);
router.get("/myfollowings", mustAuth, getMyFollowings);

router.get("/followers/:profileId", mustAuth, getFollowersofPassedUser);
router.get("/followings/:profileId", mustAuth, getFollowingsofPassedUser);

export default router;
