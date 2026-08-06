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
  // Present only for a building's stock (owner = a location) — the one place
  // a computed price is ever shown. null means the item is priceless.
  pricing?: { buyValueCp: number; sellValueCp: number } | null;
}

function formatCp(cp: number): string {
  const gp = cp / 100;
  return `${Number.isInteger(gp) ? gp : gp.toFixed(2)} gp`;
}

function PricingSpans({
  pricing,
}: {
  pricing: { buyValueCp: number; sellValueCp: number } | null;
}) {
  if (!pricing) {
    return <span className="text-muted-foreground text-xs">Priceless</span>;
  }
  return (
    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
      Buy {formatCp(pricing.buyValueCp)} · Sell {formatCp(pricing.sellValueCp)}
    </span>
  );
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
  // Building stock has no "worn" state — equipped/attuned only apply to a
  // character/creature owner.
  showWornState = true,
}: {
  row: InventoryRowData;
  patch: (id: string, body: unknown) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
  showWornState?: boolean;
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
        {row.pricing !== undefined && <PricingSpans pricing={row.pricing} />}
        <EditableNumber
          label="Quantity"
          value={quantity.value}
          onCommit={(next) => quantity.set(next ?? 1)}
          pending={quantity.pending}
          min={1}
          render={(value) => `×${value ?? 1}`}
        />
        {showWornState && (
          <>
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
          </>
        )}
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
      <span className="flex shrink-0 items-center gap-3">
        {row.pricing !== undefined && <PricingSpans pricing={row.pricing} />}
        <span className="text-muted-foreground text-xs tabular-nums">
          ×{row.quantity}
        </span>
      </span>
    </li>
  );
}
