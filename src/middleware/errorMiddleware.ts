import { Request, Response, NextFunction } from "express";
import { AppError } from "#/utils/errors";

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === "ValidationError") {
    res.status(400).json({ message: err.message });
  } else if (err.name === "CastError") {
    res.status(400).json({ message: err.message });
  } else {
    res.status(400).json({ message: "unknown error" });
  }
};
