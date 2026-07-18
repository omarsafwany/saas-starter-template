import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Invalid request body",
        fieldErrors: err.flatten().fieldErrors,
      },
    });
    return;
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : "Internal server error";

  if (!isAppError || !err.isOperational) {
    logger.error({ err }, "Unhandled error");
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
