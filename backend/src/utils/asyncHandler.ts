import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

type AsyncRouteHandler<P = ParamsDictionary, ResBody = unknown, ReqBody = unknown, ReqQuery = ParsedQs> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * the error-handling middleware instead of becoming unhandled rejections.
 *
 * Generic over route params/body/query so handlers can opt into precise
 * typing (e.g. `asyncHandler<{ id: string }>(...)`) while still defaulting
 * to plain Express types when a handler doesn't need that.
 */
export function asyncHandler<P = ParamsDictionary, ResBody = unknown, ReqBody = unknown, ReqQuery = ParsedQs>(
  handler: AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery>,
) {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
