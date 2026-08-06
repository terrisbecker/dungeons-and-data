"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BuildingInventoryItem, ItemCatalog } from "@dnd/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, EnumSelect } from "@/components/form-fields";
import {
  EditableInventoryRow,
  ReadOnlyInventoryRow,
} from "@/components/inventory-rows";
import {
  CatalogHint,
  EmptyState,
  FormButtons,
  SectionCard,
} from "@/components/section-card";
import { useLazyList } from "@/hooks/use-lazy-list";
import {
  deleteLocationChild,
  patchLocationChild,
  postLocationChild,
} from "./location-mutations";

const patchInventory = (id: string, body: unknown) =>
  patchLocationChild("inventory-items", id, body);

// A building location's stock — add/remove/edit-quantity, plus the
// economy-modified buy/sell price on every row (the one place a computed
// price is ever shown; see docs/economy-layer.md). Structurally the same
// managed-list pattern as LocationCreatures / the creature stat block's
// InventorySection, just with a locationId owner and no equipped/attuned.
export function LocationBuildingInventory({
  locationId,
  inventory,
  canManage,
}: {
  locationId: string;
  inventory: BuildingInventoryItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyList<ItemCatalog>(
    "/api/catalog/items",
    "Could not load catalog",
  );

  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const selectedItem = itemId || rows?.[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selectedItem) {
      toast.error("Pick an item.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("Quantity must be ≥ 1.");
      return;
    }
    setSubmitting(true);
    const ok = await postLocationChild("inventory-items", {
      locationId,
      itemId: selectedItem,
      quantity: qty,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Item added");
      setOpen(false);
      setQuantity("1");
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteLocationChild("inventory-items", id);
    if (ok) {
      toast.success("Item removed");
      router.refresh();
    }
  }

  const items: Record<string, string> = rows
    ? Object.fromEntries(rows.map((i) => [i.id, i.name]))
    : {};

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Building inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <EmptyState text="No stock yet." />
          ) : (
            <ul className="flex flex-col gap-1">
              {inventory.map((row) => (
                <ReadOnlyInventoryRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Building inventory"
      description="Stock this building carries. Buy/sell prices reflect the local economy."
      addLabel="Add item"
      formTitle="Add item"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CatalogHint
            loading={loading && !rows}
            empty={!!rows && rows.length === 0}
            noun="items"
          />
          {rows && rows.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="building-inv-item" label="Item">
                <EnumSelect
                  id="building-inv-item"
                  value={selectedItem}
                  onValueChange={setItemId}
                  items={items}
                />
              </Field>
              <Field id="building-inv-qty" label="Quantity">
                <Input
                  id="building-inv-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
            </div>
          )}
          <FormButtons
            submitting={submitting}
            onCancel={() => setOpen(false)}
          />
        </form>
      }
    >
      {inventory.length === 0 ? (
        <EmptyState text="No stock yet." />
      ) : (
        <ul className="flex flex-col gap-1">
          {inventory.map((row) => (
            <EditableInventoryRow
              key={row.id}
              row={row}
              patch={patchInventory}
              onRemove={onRemove}
              showWornState={false}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
