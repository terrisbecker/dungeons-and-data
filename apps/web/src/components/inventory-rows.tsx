"use client";

import type { ItemCatalog } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { DetailBody, DetailRow, ItemDetail } from "@/components/catalog-detail";
import { EditableNumber, EditableToggle } from "@/components/editable-fields";
import { RemoveButton, RowDetail } from "@/components/section-card";
import { useOptimisticField } from "@/hooks/use-optimistic-field";

// An owned InventoryItem row, shared by the character sheet and the creature
// stat block. The two are structurally identical (the API's owner column is
// polymorphic and both reads join the full ItemCatalog), so the only thing that
// differs is which BFF topic route the writes go to — hence the `patch`/`remove`
// callbacks rather than a hardcoded URL.

export interface InventoryRowData {
  id: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
  item: ItemCatalog;
}

// Click-to-open detail for the item. Only the name is the trigger, so the row's
// controls don't end up nested inside a button.
export function InventoryItemLabel({ row }: { row: InventoryRowData }) {
  return (
    <RowDetail label={<span className="truncate">{row.item.name}</span>}>
      <ItemDetail item={row.item} />
      <DetailBody>
        <DetailRow label="Quantity" value={row.quantity} />
        <DetailRow label="Equipped" value={row.equipped ? "Yes" : null} />
        <DetailRow
          label="Attuned"
          value={
            row.attuned
              ? "Yes"
              : row.item.requiresAttunement
                ? "Not attuned"
                : null
          }
        />
      </DetailBody>
    </RowDetail>
  );
}

// One editable row. Each mutable column drives its own useOptimisticField, so a
// rapid toggle coalesces into one write and a rejected one (the attunement cap
// answers 409) reverts only that field.
export function EditableInventoryRow({
  row,
  patch,
  onRemove,
}: {
  row: InventoryRowData;
  patch: (id: string, body: unknown) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
}) {
  const quantity = useOptimisticField(row.quantity, (value) =>
    patch(row.id, { quantity: value }),
  );
  const equipped = useOptimisticField(row.equipped, (value) =>
    patch(row.id, { equipped: value }),
  );
  const attuned = useOptimisticField(row.attuned, (value) =>
    patch(row.id, { attuned: value }),
  );

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border px-3 py-2 text-sm">
      <InventoryItemLabel row={row} />
      <span className="flex shrink-0 items-center gap-4">
        <EditableNumber
          label="Quantity"
          value={quantity.value}
          onCommit={(next) => quantity.set(next ?? 1)}
          pending={quantity.pending}
          min={1}
          render={(value) => `×${value ?? 1}`}
        />
        <EditableToggle
          label="Equipped"
          value={equipped.value}
          onCommit={equipped.set}
          pending={equipped.pending}
        />
        <EditableToggle
          label="Attuned"
          value={attuned.value}
          onCommit={attuned.set}
          pending={attuned.pending}
        />
        <RemoveButton
          onRemove={() => onRemove(row.id)}
          confirm={`Remove ${row.item.name} from inventory?`}
        />
      </span>
    </li>
  );
}

// The same row for a viewer who can't write: the detail popover still opens,
// but the mutable columns render as plain text.
export function ReadOnlyInventoryRow({ row }: { row: InventoryRowData }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <InventoryItemLabel row={row} />
        {row.equipped && <Badge variant="secondary">Equipped</Badge>}
        {row.attuned && <Badge variant="secondary">Attuned</Badge>}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        ×{row.quantity}
      </span>
    </li>
  );
}
