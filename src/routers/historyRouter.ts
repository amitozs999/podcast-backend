import { mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";

import { Router } from "express";

import { updateHistory } from "#/controllers/historyController";
import { UpdateHistorySchema } from "#/utils/validationSchema";
import { getHistories } from "#/controllers/historyController";
import { getRecentlyPlayed } from "#/controllers/historyController";
import { removeHistory } from "#/controllers/historyController";

const router = Router();

router.post(
  "/updatehistory",
  mustAuth,
  validate(UpdateHistorySchema),
  updateHistory
);
router.get("/", mustAuth, getHistories);
router.get("/recently-played", mustAuth, getRecentlyPlayed);
router.delete("/remove", mustAuth, removeHistory);

export default router;
