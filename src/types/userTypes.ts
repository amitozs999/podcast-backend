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

//TypeScript does not recognize the user property on the Request object by default.

//To resolve this, you need to extend the Request interface from the express module
//to include your custom user property.

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        avatar?: {
          url: string;
          publicId: string;
        }; // Update avatar to match jsonb structure
        followers: number;
        followings: number;
      };
    }
  }
}
