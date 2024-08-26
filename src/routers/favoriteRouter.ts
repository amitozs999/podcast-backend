import { getFavorites } from "#/controllers/favoriteController";
import { checkIsFavorite } from "#/controllers/favoriteController";
import { toggleFavorite } from "#/controllers/favoriteController";

import { isVerified, mustAuth } from "#/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/toggleFavorite", mustAuth, isVerified, toggleFavorite);
router.get("/getallFav", mustAuth, getFavorites);
router.get("/is-fav", mustAuth, checkIsFavorite);

export default router;
