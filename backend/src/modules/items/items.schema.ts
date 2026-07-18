import { z } from "zod";

/**
 * Zod schemas for the items module. Kept colocated with the module
 * (not in a shared "schemas" folder) so a new module can be built by
 * copying this whole directory.
 */
export const createItemSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  body: z.string().trim().max(5000).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
