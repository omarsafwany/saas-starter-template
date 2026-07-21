---
sidebar_position: 3
---

# TanStack Query

## What it is

All server data (the Items list, and every create/update/delete mutation) flows through
TanStack Query — no hand-rolled `useEffect` + `useState` fetching, no separate global store for
server data.

## Why TanStack Query over the alternatives

Plain `useEffect`/`fetch` gets unwieldy fast once you need loading/error states, caching, and
refetch-after-mutation — all of which TanStack Query gives you for free. It's also a clean
separation of concerns from [Zustand](/frontend/zustand): TanStack Query owns *server* state
(anything that lives in the database and can go stale), Zustand owns *client/UI* state (is a
dialog open). Reaching for one Zustand store to hold both would blur that line and reinvent
caching TanStack Query already solves.

## The pattern: invalidate, don't hand-roll optimistic updates

```ts title="frontend/src/hooks/useItems.ts"
const itemsQueryKey = ["items"] as const

export function useItemsQuery() {
  return useQuery({
    queryKey: itemsQueryKey,
    queryFn: listItems,
  })
}

/**
 * Every mutation below invalidates the list query on success rather than
 * hand-rolling an optimistic cache update - a CRUD action isn't "done"
 * until it round-trips through the backend and the invalidated refetch
 * confirms it stuck.
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

export function useUpdateItemMutation() { /* same shape */ }
export function useDeleteItemMutation() { /* same shape */ }
```

This is a deliberate simplicity choice: `invalidateQueries` triggers a real refetch instead of
the UI trusting its own guess at what the server will return. For a template meant to be copied
into new projects, "correct and simple" beats "instant-feeling but more code to get right" —
optimistic updates are a reasonable thing to add later for a specific mutation that needs to
feel snappier, using this same file as the starting point.

## Where the actual fetch calls live

`useItems.ts`'s `queryFn`/`mutationFn` call plain async functions from `frontend/src/lib/items.ts`
(`listItems`, `createItem`, `updateItem`, `deleteItem`) — TanStack Query hooks never call `fetch`
directly. That split means the raw API client functions are independently testable/reusable
outside of a React component if needed.

## Adding a new query or mutation

Mirror `useItems.ts`: a plain async fetch function in `lib/`, a `useQuery`/`useMutation` hook
wrapping it in `hooks/`, and — for mutations — `invalidateQueries` on the relevant query key in
`onSuccess`, matching the pattern above rather than reaching for manual cache writes.
