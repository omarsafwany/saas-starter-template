import { apiFetch } from "./api"

/**
 * Mirrors backend/src/modules/items/items.schema.ts and the Item model in
 * prisma/schema.prisma. Kept colocated with the fetch functions rather than
 * shared across the repo boundary - see the items backend module's own
 * comment for why this template doesn't share types across frontend/backend.
 */
export interface Item {
  id: string
  title: string
  body: string | null
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateItemInput {
  title: string
  body?: string
}

export type UpdateItemInput = Partial<CreateItemInput>

export function listItems() {
  return apiFetch<{ items: Item[] }>("/items")
}

export function getItem(id: string) {
  return apiFetch<{ item: Item }>(`/items/${id}`)
}

export function createItem(input: CreateItemInput) {
  return apiFetch<{ item: Item }>("/items", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateItem(id: string, input: UpdateItemInput) {
  return apiFetch<{ item: Item }>(`/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteItem(id: string) {
  return apiFetch<null>(`/items/${id}`, { method: "DELETE" })
}
