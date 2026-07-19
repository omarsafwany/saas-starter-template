import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
  type CreateItemInput,
  type UpdateItemInput,
} from "@/lib/items"

const itemsQueryKey = ["items"] as const

export function useItemsQuery() {
  return useQuery({
    queryKey: itemsQueryKey,
    queryFn: listItems,
  })
}

/**
 * Every mutation below invalidates the list query on success rather than
 * hand-rolling an optimistic cache update - this is the ticket's acceptance
 * criteria in code form: a CRUD action isn't "done" until it round-trips
 * through the backend and the invalidated refetch confirms it stuck.
 */
export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemsQueryKey })
    },
  })
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) =>
      updateItem(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemsQueryKey })
    },
  })
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemsQueryKey })
    },
  })
}
