import { randomUUID } from "node:crypto";
import type { Item } from "../../generated/prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import * as storage from "../../services/storage.js";
import { itemsRepository } from "./items.repository.js";
import type { CreateItemInput, UpdateItemInput } from "./items.schema.js";

/**
 * Ownership enforcement lives here (authZ-at-the-data-layer), not just at
 * the route/middleware layer: every read/mutation re-fetches the item and
 * checks `userId` before touching it, so this still holds even if a route
 * guard is ever misconfigured. Throws 404 (not 403) for someone else's
 * item, so a user can't tell the difference between "doesn't exist" and
 * "exists but isn't yours" — see the ticket's acceptance criteria.
 */
async function getOwnedOrThrow(userId: string, itemId: string) {
  const item = await itemsRepository.findById(itemId);
  if (!item || item.userId !== userId) {
    throw new AppError("Item not found", 404);
  }
  return item;
}

export function listItems(userId: string) {
  return itemsRepository.findManyByUser(userId);
}

export function getItem(userId: string, itemId: string) {
  return getOwnedOrThrow(userId, itemId);
}

export function createItem(userId: string, data: CreateItemInput) {
  return itemsRepository.create(userId, data);
}

export async function updateItem(userId: string, itemId: string, data: UpdateItemInput) {
  await getOwnedOrThrow(userId, itemId);
  return itemsRepository.update(itemId, data);
}

export async function deleteItem(userId: string, itemId: string): Promise<void> {
  await getOwnedOrThrow(userId, itemId);
  await itemsRepository.delete(itemId);
}

/**
 * Step 1 of the file attachment flow: confirm the caller owns this item,
 * mint a fresh R2 object key scoped to it, and hand back a presigned PUT
 * URL. The frontend uploads bytes straight to that URL - none of this
 * ever touches Express's request body.
 */
export async function requestItemUploadUrl(
  userId: string,
  itemId: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  await getOwnedOrThrow(userId, itemId);
  const key = `items/${itemId}/${randomUUID()}`;
  const uploadUrl = await storage.getUploadUrl(key, contentType);
  return { uploadUrl, key };
}

/**
 * Step 2: once the client's PUT to R2 succeeds, it calls back here so we
 * persist the key. We deliberately don't verify the object actually
 * exists in R2 before saving - that would mean the backend calling R2
 * synchronously on every confirmation, trading a cheap DB write for an
 * extra network round-trip for no real safety gain in this reference flow.
 */
export async function attachItemFile(
  userId: string,
  itemId: string,
  key: string,
): Promise<Item> {
  await getOwnedOrThrow(userId, itemId);
  return itemsRepository.attachFile(itemId, key);
}

/** Presigned GET URL for an item's attached file, if it has one. */
export async function getItemFileUrl(userId: string, itemId: string): Promise<string> {
  const item = await getOwnedOrThrow(userId, itemId);
  if (!item.fileKey) {
    throw new AppError("This item has no attached file", 404);
  }
  return storage.getDownloadUrl(item.fileKey);
}
