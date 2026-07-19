import { create } from "zustand"

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
