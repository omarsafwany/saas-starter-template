import { useState, type FormEvent } from "react"
import { useAuth } from "@/hooks/useAuth"
import {
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
} from "@/hooks/useItems"
import { useItemDialogStore } from "@/stores/item-dialog-store"
import { ApiError } from "@/lib/api"
import type { Item } from "@/lib/items"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Dashboard() {
  const { user } = useAuth()
  const itemsQuery = useItemsQuery()
  const createMutation = useCreateItemMutation()
  const updateMutation = useUpdateItemMutation()
  const deleteMutation = useDeleteItemMutation()

  const { isOpen, editingItemId, openCreateDialog, openEditDialog, closeDialog } =
    useItemDialogStore()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)

  const items = itemsQuery.data?.items ?? []
  const editingItem = editingItemId
    ? items.find((item) => item.id === editingItemId)
    : undefined
  const isEditing = Boolean(editingItem)

  function handleOpenCreate() {
    setTitle("")
    setBody("")
    setFormError(null)
    openCreateDialog()
  }

  function handleOpenEdit(item: Item) {
    setTitle(item.title)
    setBody(item.body ?? "")
    setFormError(null)
    openEditDialog(item.id)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const input = { title: title.trim(), body: body.trim() || undefined }

    try {
      if (editingItemId) {
        await updateMutation.mutateAsync({ id: editingItemId, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      closeDialog()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      )
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    // Errors surface via deleteMutation.error below rather than a thrown
    // exception here - there is no follow-up action to take per-row.
    await deleteMutation.mutateAsync(deleteTarget.id).catch(() => undefined)
    setDeleteTarget(null)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-1 flex-col gap-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
        </div>
        <Button onClick={handleOpenCreate}>New item</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Reference CRUD UI backed by the items module - list, create, edit, and
            delete all hit the real backend through TanStack Query.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {itemsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading items…</p>
          )}
          {itemsQuery.isError && (
            <p className="text-sm text-destructive">
              Couldn&apos;t load items. Please refresh the page.
            </p>
          )}
          {itemsQuery.isSuccess && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No items yet. Create your first one to get started.
            </p>
          )}
          {deleteMutation.isError && (
            <p className="mb-3 text-sm text-destructive">
              Couldn&apos;t delete that item. Please try again.
            </p>
          )}
          {items.length > 0 && (
            <ul className="flex flex-col divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.title}</span>
                    {item.body && (
                      <span className="text-sm text-muted-foreground">{item.body}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit item" : "New item"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the title or body, then save."
                : "Give it a title - the body is optional."}
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-body">Body</Label>
              <textarea
                id="item-body"
                rows={4}
                maxLength={5000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>Delete &quot;{deleteTarget.title}&quot;? This can&apos;t be undone.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
