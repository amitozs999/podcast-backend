import express, { Request, Response } from "express";
import { CreateUserRequest } from "#/types/userTypes";
import { createUser } from "../controllers/userController";
const router = express.Router();
import { validate } from "#/middleware/validator";
import { verifyEmail } from "../controllers/userController";
import { CreateUserSchema } from "#/utils/validationSchema";
import { EmailVerificationBodySchema } from "#/utils/validationSchema";
import { sendReVerificationToken } from "../controllers/userController";

router.post("/create", validate(CreateUserSchema), createUser);
router.post(
  "/verify-email",
  validate(EmailVerificationBodySchema),
  verifyEmail
);
router.post("/re-verify-email", sendReVerificationToken);

export default router;
