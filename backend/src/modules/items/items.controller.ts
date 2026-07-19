import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import * as itemsService from "./items.service.js";
import {
  attachFileSchema,
  createItemSchema,
  requestUploadSchema,
  updateItemSchema,
} from "./items.schema.js";

/**
 * requireAuth (mounted on the router below) has already populated
 * req.user by the time any of these handlers run — this just narrows
 * the type, it is not a second authentication check.
 */
function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("Unauthorized", 401);
  return req.user.id;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const items = await itemsService.listItems(currentUserId(req));
  res.status(200).json({ items });
});

export const getOne = asyncHandler<{ id: string }>(async (req, res) => {
  const item = await itemsService.getItem(currentUserId(req), req.params.id);
  res.status(200).json({ item });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createItemSchema.parse(req.body);
  const item = await itemsService.createItem(currentUserId(req), data);
  res.status(201).json({ item });
});

export const update = asyncHandler<{ id: string }>(async (req, res) => {
  const data = updateItemSchema.parse(req.body);
  const item = await itemsService.updateItem(currentUserId(req), req.params.id, data);
  res.status(200).json({ item });
});

export const remove = asyncHandler<{ id: string }>(async (req, res) => {
  await itemsService.deleteItem(currentUserId(req), req.params.id);
  res.status(204).send();
});

export const requestUploadUrl = asyncHandler<{ id: string }>(async (req, res) => {
  const { contentType } = requestUploadSchema.parse(req.body);
  const result = await itemsService.requestItemUploadUrl(
    currentUserId(req),
    req.params.id,
    contentType,
  );
  res.status(200).json(result);
});

export const attachFile = asyncHandler<{ id: string }>(async (req, res) => {
  const { key } = attachFileSchema.parse(req.body);
  const item = await itemsService.attachItemFile(currentUserId(req), req.params.id, key);
  res.status(200).json({ item });
});

export const getFileUrl = asyncHandler<{ id: string }>(async (req, res) => {
  const url = await itemsService.getItemFileUrl(currentUserId(req), req.params.id);
  res.status(200).json({ url });
});
