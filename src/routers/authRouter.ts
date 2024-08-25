import express, { Request, Response } from "express";
import { CreateUserRequest } from "#/types/userTypes";
import { createUser } from "../controllers/userController";
const router = express.Router();
import { validate } from "#/middleware/validator";
import { verifyEmail } from "../controllers/userController";
import { CreateUserSchema } from "#/utils/validationSchema";
import { EmailVerificationBodySchema } from "#/utils/validationSchema";
import { sendReVerificationToken } from "../controllers/userController";
import { generateForgetPasswordLink } from "../controllers/userController";
import { updatePassword } from "../controllers/userController";
import { isValidPassResetToken } from "#/middleware/auth";
import { grantValid } from "../controllers/userController";
import { UpdatePasswordSchema } from "#/utils/validationSchema";
import { TokenAndIDValidation } from "#/utils/validationSchema";

router.post("/create", validate(CreateUserSchema), createUser);
router.post(
  "/verify-email",
  validate(EmailVerificationBodySchema),
  verifyEmail
);
router.post("/re-verify-email", sendReVerificationToken);

router.post("/forget-password", generateForgetPasswordLink);

router.post(
  "/verify-forg-pass-reset-token",
  validate(TokenAndIDValidation),
  isValidPassResetToken,
  grantValid
);

router.post(
  "/update-password",
  validate(UpdatePasswordSchema),
  isValidPassResetToken,
  updatePassword
);

export default router;
