import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : "Internal server error";

  if (!isAppError || !err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(env.NODE_ENV !== "production" && !isAppError && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  });
}
