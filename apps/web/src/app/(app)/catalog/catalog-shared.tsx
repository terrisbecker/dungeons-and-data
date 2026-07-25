"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Fetch helpers ---------------------------------------------------------

export async function postCatalog(
  topic: string,
  body: unknown,
): Promise<boolean> {
  return send(`/api/catalog/${topic}`, "POST", body);
}

export async function patchCatalog(
  topic: string,
  id: string,
  body: unknown,
): Promise<boolean> {
  return send(`/api/catalog/${topic}/${id}`, "PATCH", body);
}

export async function deleteCatalog(
  topic: string,
  id: string,
): Promise<boolean> {
  return send(`/api/catalog/${topic}/${id}`, "DELETE");
}

async function send(
  url: string,
  method: string,
  body?: unknown,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      toast.error(parsed?.error ?? "Something went wrong");
      return false;
    }
    return true;
  } catch {
    toast.error("Could not reach the server");
    return false;
  }
}

// The detail-popover building blocks and the four per-catalog detail bodies now
// live in @/components/catalog-detail, shared with the character sheet.

// --- Form action buttons ---------------------------------------------------

export function FormActions({
  submitting,
  editing,
  onCancel,
}: {
  submitting: boolean;
  editing: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : editing ? "Save" : "Add"}
      </Button>
    </div>
  );
}

// --- Generic list + inline add/edit scaffold -------------------------------

// Renders the page shell (back link + heading) and a card with an inline
// add/edit form and a list of rows, each with Edit / Delete. The per-type
// managers supply `renderForm` (the fields) and `renderRow` (the display).
export function CatalogManager<TRow extends { id: string }>({
  topic,
  title,
  singular,
  rows,
  emptyText,
  renderRow,
  renderForm,
  renderDetail,
}: {
  topic: string;
  title: string;
  singular: string;
  rows: TRow[];
  emptyText: string;
  renderRow: (row: TRow) => React.ReactNode;
  renderForm: (args: {
    editing: TRow | null;
    close: () => void;
  }) => React.ReactNode;
  renderDetail?: (row: TRow) => React.ReactNode;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Two-step delete: first click arms the row (Confirm/Cancel), second confirms.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const editing = rows.find((r) => r.id === editingId) ?? null;
  const formOpen = adding || editing !== null;

  function close() {
    setAdding(false);
    setEditingId(null);
  }

  function openForm(next: () => void) {
    setConfirmingId(null);
    next();
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    const ok = await deleteCatalog(topic, id);
    setDeletingId(null);
    setConfirmingId(null);
    if (ok) {
      toast.success(`${singular} deleted`);
      router.refresh();
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>{title}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openForm(() => {
                  setEditingId(null);
                  setAdding((a) => !a);
                })
              }
            >
              <PlusIcon />
              Add {singular}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {formOpen && (
            <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-4">
              <p className="text-sm font-medium">
                {editing ? `Edit ${singular}` : `Add ${singular}`}
              </p>
              {renderForm({ editing, close })}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{emptyText}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    {renderDetail ? (
                      <Popover>
                        <PopoverTrigger className="hover:bg-muted/50 -mx-1 block w-full min-w-0 cursor-pointer rounded px-1 text-left">
                          {renderRow(row)}
                        </PopoverTrigger>
                        <PopoverContent>{renderDetail(row)}</PopoverContent>
                      </Popover>
                    ) : (
                      renderRow(row)
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {confirmingId === row.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === row.id}
                          onClick={() => onDelete(row.id)}
                        >
                          {deletingId === row.id ? "Deleting…" : "Confirm"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === row.id}
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openForm(() => {
                              setAdding(false);
                              setEditingId(row.id);
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmingId(row.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
