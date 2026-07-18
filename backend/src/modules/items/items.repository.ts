import type { Item } from "../../generated/prisma/client.js";
import { prisma } from "../../config/db.js";
import type { CreateItemInput, UpdateItemInput } from "./items.schema.js";

/**
 * Repository pattern (see project architecture rule 3): the service below
 * only ever talks to this interface, never to Prisma directly. Swapping
 * the datastore later means rewriting this one file, not the service,
 * controller, or routes.
 */
export interface ItemsRepository {
  findManyByUser(userId: string): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  create(userId: string, data: CreateItemInput): Promise<Item>;
  update(id: string, data: UpdateItemInput): Promise<Item>;
  delete(id: string): Promise<void>;
}

export const itemsRepository: ItemsRepository = {
  findManyByUser(userId) {
    return prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id) {
    return prisma.item.findUnique({ where: { id } });
  },

  create(userId, data) {
    return prisma.item.create({ data: { ...data, userId } });
  },

  update(id, data) {
    return prisma.item.update({ where: { id }, data });
  },

  async delete(id) {
    await prisma.item.delete({ where: { id } });
  },
};
