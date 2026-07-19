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

// PERPRO-9: file attachment flow. requestUploadSchema is the body for
// "give me a presigned PUT URL"; attachFileSchema is the body for "I
// finished the PUT, save this key on the item" once the client's upload
// to R2 succeeds.
export const requestUploadSchema = z.object({
  contentType: z.string().trim().min(1, "contentType is required"),
});

export const attachFileSchema = z.object({
  key: z.string().trim().min(1, "key is required"),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type AttachFileInput = z.infer<typeof attachFileSchema>;
