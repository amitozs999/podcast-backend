import { Request } from "express";

export interface UserData {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserRequest extends Request {
  body: UserData;
}
