---
sidebar_position: 4
---

# Zustand

## What it is

Zustand handles **client/UI state only** — state that never touches the server and doesn't
belong in TanStack Query's cache. Today that's exactly one store: whether the item create/edit
dialog is open, and which item (if any) is being edited.

## Why Zustand over the alternatives

React Context + `useReducer` works but means writing a provider, wiring it into the tree, and a
`useContext` hook by hand for every new piece of shared UI state. Redux Toolkit is more
machinery than a template needs for "is this dialog open." Zustand's whole API is `create(...)`
returning a hook — no provider to mount, no boilerplate — which matters for a *reusable starter*:
the pattern needs to be trivial to copy for the next piece of view-local state a new project
needs to share across components without a common ancestor.

## The store

```ts title="frontend/src/stores/item-dialog-store.ts"
/**
 * UI-only state (is the create/edit dialog open, and which item - if any -
 * is being edited) has no business living in TanStack Query's server-state
 * cache or in prop drilling through Dashboard.tsx. Zustand establishes the
 * pattern for that category of state in this template; reach for it again
 * for things like sidebar collapse, active tab, or other view-local flags
 * that multiple components need to read/write without a shared ancestor.
 */
interface ItemDialogState {
  isOpen: boolean
  editingItemId: string | null
  openCreateDialog: () => void
  openEditDialog: (itemId: string) => void
  closeDialog: () => void
}

export const useItemDialogStore = create<ItemDialogState>((set) => ({
  isOpen: false,
  editingItemId: null,
  openCreateDialog: () => set({ isOpen: true, editingItemId: null }),
  openEditDialog: (itemId) => set({ isOpen: true, editingItemId: itemId }),
  closeDialog: () => set({ isOpen: false, editingItemId: null }),
}))
```

Any component calls `useItemDialogStore()` (or a selector like
`useItemDialogStore((s) => s.isOpen)`) directly — no `<ItemDialogProvider>` wraps anything in
`App.tsx`. That's the main practical difference from Context: the store just exists at import
time, and any component tree can read or write it.

## Where the line is drawn (see also TanStack Query)

If a piece of state came from — or needs to be persisted to — the backend, it belongs in
[TanStack Query](/frontend/tanstack-query)'s cache, not a Zustand store. Zustand is exclusively
for state that's local to the browser session and doesn't survive (or need to survive) a page
reload: dialog open/closed, active tab, sidebar collapsed, and similar.

## Adding a new store

Copy `item-dialog-store.ts`'s shape: a small interface for the state + actions, `create<T>((set) =>
({...}))`, one file per logical piece of UI state rather than one giant app-wide store. Keep
server data out of it.
