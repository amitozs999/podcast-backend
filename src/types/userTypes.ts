import { Request } from "express";

export interface UserInputData {
  name: string;
  email: string;
  password: string;
}

export interface VerifyEmailInputData {
  userId: number;
  token: string;
}
export interface CreateUserRequest extends Request {
  body: UserInputData;
}

export interface VerifyEmailRequest extends Request {
  body: VerifyEmailInputData;
}

// src/types/userTypes.ts

//input type recieve
export interface CreateEmailVerificationTokenInput {
  owner: number;
  token: string;
}

//return type
export interface EmailVerificationToken {
  id: number;
  owner: number;
  token: string;
  created_at: Date;
  expiry: Date;
}
