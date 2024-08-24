import express, { Request, Response } from "express";
import { CreateUserRequest } from "#/types/userTypes";
import { createUser } from "../controllers/userController";
const router = express.Router();
import { validate } from "#/middleware/validator";

import { CreateUserSchema } from "#/utils/validationSchema";

router.post("/create", validate(CreateUserSchema), createUser);
export default router;
