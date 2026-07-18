import { AppError } from "../../utils/AppError.js";
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
