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
import { SignInValidationSchema } from "#/utils/validationSchema";
import { signIn } from "../controllers/userController";
import { mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";
import { updateProfile } from "../controllers/userController";
import { logOut } from "../controllers/userController";

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

router.post("/sign-in", validate(SignInValidationSchema), signIn);

router.get("/is-auth", mustAuth, (req, res) => {
  res.json({
    profile: req.user,
  });
});

router.post("/update-profile", mustAuth, fileParser, updateProfile);

router.post("/log-out", mustAuth, logOut);

export default router;
