import { Router } from "express";

const router = Router();

import fileParser from "#/middleware/fileParser";
import { mustAuth } from "#/middleware/auth";
import { createAudio } from "#/controllers/audioController";
import { isVerified } from "#/middleware/auth";
import { AudioValidationSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { updateAudio } from "#/controllers/audioController";
import { getLatestTenAudios } from "#/controllers/audioController";

router.post(
  "/create",
  mustAuth,
  isVerified,
  fileParser,
  validate(AudioValidationSchema),
  createAudio
);

router.patch(
  "/UpdateAudio/:audioId",
  mustAuth,
  isVerified,
  fileParser,
  validate(AudioValidationSchema),
  updateAudio
);

router.get("/latestTenAudios", getLatestTenAudios);

export default router;
