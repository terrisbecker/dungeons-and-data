"use client";

import { useState } from "react";
import type { LocationItemTypeEconomy, LocationRow } from "@dnd/shared";
import { ITEM_TYPES } from "@/components/catalog-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/form-fields";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import { isBuildingType } from "@/lib/location-labels";
import { send } from "@/lib/mutate";

const MIN = -10;
const MAX = 10;

function OneSlider({
  label,
  value,
  pending,
  onCommit,
}: {
  label: string;
  value: number;
  pending: boolean;
  onCommit: (next: number) => void;
}) {
  // Local drag position for instant visual feedback; the actual write only
  // fires on release (onValueCommitted), so dragging doesn't spam requests.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? value;

  return (
    <div className="flex flex-col gap-2" aria-busy={pending || undefined}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{shown > 0 ? `+${shown}` : shown}</span>
      </div>
      <Slider
        aria-label={label}
        min={MIN}
        max={MAX}
        step={1}
        value={shown}
        onValueChange={(next) => setDragValue(next as number)}
        onValueCommitted={(next) => {
          setDragValue(null);
          if (next !== value) onCommit(next as number);
        }}
      />
    </div>
  );
}

// One item type's supply/demand pair in "per item type" mode. A type with no
// saved row yet is neutral (0/0) — the first commit creates it via upsert.
function ItemTypeRow({
  locationId,
  itemType,
  entry,
}: {
  locationId: string;
  itemType: string;
  entry: LocationItemTypeEconomy | undefined;
}) {
  const supply = useOptimisticField(entry?.supplyLevel ?? 0, (next) =>
    send(
      `/api/location-item-economy/${locationId}/${itemType}`,
      "PATCH",
      { supplyLevel: next },
      "Could not update supply",
    ),
  );
  const demand = useOptimisticField(entry?.demandLevel ?? 0, (next) =>
    send(
      `/api/location-item-economy/${locationId}/${itemType}`,
      "PATCH",
      { demandLevel: next },
      "Could not update demand",
    ),
  );

  return (
    <div className="grid gap-3 border-t pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_1fr_1fr] sm:items-center">
      <span className="text-sm font-medium">
        {ITEM_TYPES[itemType] ?? itemType}
      </span>
      <OneSlider
        label={`${ITEM_TYPES[itemType] ?? itemType} supply`}
        value={supply.value}
        pending={supply.pending}
        onCommit={supply.set}
      />
      <OneSlider
        label={`${ITEM_TYPES[itemType] ?? itemType} demand`}
        value={demand.value}
        pending={demand.pending}
        onCommit={demand.set}
      />
    </div>
  );
}

// The economy engine's DM-set sliders for this location (see
// docs/economy-layer.md): supply and demand feed the per-item-type curve to
// produce a price modifier, stacking additively up the parent chain into
// every descendant building's inventory. Only a `type: "building"` location
// may switch to per-item-type sliders (enforced server-side too, in
// locations.service.ts) — every other location always uses one global
// supply/demand pair for every item type, with no mode toggle shown.
export function LocationEconomySliders({
  location,
  itemTypeEconomies,
  canManage,
}: {
  location: LocationRow;
  // Present only when location.useItemTypeEconomy is true.
  itemTypeEconomies?: LocationItemTypeEconomy[];
  canManage: boolean;
}) {
  const advanced = useOptimisticField(location.useItemTypeEconomy, (next) =>
    send(
      `/api/locations/${location.id}`,
      "PATCH",
      { useItemTypeEconomy: next },
      "Could not update economy mode",
    ),
  );
  const supply = useOptimisticField(location.supplyLevel, (next) =>
    send(
      `/api/locations/${location.id}`,
      "PATCH",
      { supplyLevel: next },
      "Could not update supply",
    ),
  );
  const demand = useOptimisticField(location.demandLevel, (next) =>
    send(
      `/api/locations/${location.id}`,
      "PATCH",
      { demandLevel: next },
      "Could not update demand",
    ),
  );

  const entryByType = new Map<string, LocationItemTypeEconomy>(
    (itemTypeEconomies ?? []).map((e) => [e.itemType, e]),
  );
  // Server-enforced invariant (locations.service.ts): useItemTypeEconomy can
  // only be true for a building. Gating on isBuildingType here too means the
  // toggle/per-type UI disappears immediately if a building gets renamed to
  // something else, without waiting on that enforcement.
  const isBuilding = isBuildingType(location.type);
  const showItemTypeMode = isBuilding && advanced.value;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Economy</CardTitle>
          {isBuilding && canManage && (
            <Checkbox
              label="Per item type"
              checked={advanced.value}
              onChange={advanced.set}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showItemTypeMode ? (
          canManage ? (
            <div className="flex flex-col gap-3">
              {Object.keys(ITEM_TYPES).map((itemType) => (
                <ItemTypeRow
                  key={itemType}
                  locationId={location.id}
                  itemType={itemType}
                  entry={entryByType.get(itemType)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {(itemTypeEconomies ?? []).length === 0 ? (
                <span className="text-muted-foreground">
                  No per-item-type overrides set.
                </span>
              ) : (
                (itemTypeEconomies ?? []).map((e) => (
                  <div
                    key={e.itemType}
                    className="flex items-center justify-between"
                  >
                    <span>{ITEM_TYPES[e.itemType] ?? e.itemType}</span>
                    <span className="text-muted-foreground tabular-nums">
                      Supply {e.supplyLevel} · Demand {e.demandLevel}
                    </span>
                  </div>
                ))
              )}
            </div>
          )
        ) : canManage ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <OneSlider
              label="Supply"
              value={supply.value}
              pending={supply.pending}
              onCommit={supply.set}
            />
            <OneSlider
              label="Demand"
              value={demand.value}
              pending={demand.pending}
              onCommit={demand.set}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Supply</span>{" "}
              <span className="tabular-nums">{location.supplyLevel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Demand</span>{" "}
              <span className="tabular-nums">{location.demandLevel}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
