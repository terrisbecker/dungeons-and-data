"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { CreatureStatBlock, LocationRow } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnumSelect } from "@/components/form-fields";
import {
  EmptyState,
  FormButtons,
  RemoveButton,
  SectionCard,
} from "@/components/section-card";
import { useLazyList } from "@/hooks/use-lazy-list";
import { indexLocations, pathLabel } from "../../locations/location-tree";
import { deletePlacement, postPlacement } from "./creature-mutations";

// Where this creature appears. The other half of the same join lives on the
// location page (location-creatures.tsx) — placing from either side writes the
// same CreaturePlacement row.
export function PlacementsSection({
  campaignId,
  creature,
  canManage,
}: {
  campaignId: string;
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  // Only fetched when the add form first opens — a stat block read shouldn't
  // drag the whole campaign's location list along.
  const { rows, loading, load } = useLazyList<LocationRow>(
    `/api/locations?campaignId=${encodeURIComponent(campaignId)}`,
    "Could not load locations",
  );

  const placed = new Set(creature.placements.map((p) => p.location.id));
  const available = (rows ?? []).filter((row) => !placed.has(row.id));
  const selected = locationId || available[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selected) {
      toast.error("Select a location.");
      return;
    }
    const count = Number(quantity.trim() === "" ? 1 : quantity);
    if (!Number.isInteger(count) || count < 1) {
      toast.error("Quantity must be a whole number, 1 or more.");
      return;
    }
    setSubmitting(true);
    const ok = await postPlacement({
      creatureId: creature.id,
      locationId: selected,
      quantity: count,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Creature placed");
      setLocationId("");
      setQuantity("1");
      setNotes("");
      setOpen(false);
      router.refresh();
    }
  }

  async function onRemove(placementLocationId: string) {
    const ok = await deletePlacement(creature.id, placementLocationId);
    if (ok) {
      toast.success("Placement removed");
      router.refresh();
    }
  }

  const index = indexLocations(rows ?? []);
  const locationItems: Record<string, string> = Object.fromEntries(
    available
      .map((row) => [row.id, pathLabel(row, index)] as const)
      .sort((a, b) => a[1].localeCompare(b[1])),
  );

  const body =
    creature.placements.length === 0 ? (
      <EmptyState text="Not placed anywhere yet." />
    ) : (
      <ul className="flex flex-col gap-1">
        {creature.placements.map((placement) => (
          <li
            key={placement.location.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Link
                href={`/campaigns/${campaignId}/locations/${placement.location.id}`}
                className="truncate font-medium hover:underline"
              >
                {placement.location.locationName}
              </Link>
              <Badge variant="outline">{placement.location.type}</Badge>
              {placement.notes && (
                <span className="text-muted-foreground truncate text-xs">
                  {placement.notes}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="text-muted-foreground text-xs tabular-nums">
                ×{placement.quantity}
              </span>
              {canManage && (
                <RemoveButton
                  onRemove={() => onRemove(placement.location.id)}
                  confirm={`Remove this placement at ${placement.location.locationName}?`}
                />
              )}
            </span>
          </li>
        ))}
      </ul>
    );

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Where it appears</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Where it appears"
      description="Place this creature at a location in the campaign. Quantity and notes are per location."
      addLabel="Place at location"
      formTitle="Place at location"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading locations…</p>
          ) : available.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {rows?.length
                ? "Already placed at every location in this campaign."
                : "This campaign has no locations yet."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="placement-location">Location</Label>
                <EnumSelect
                  id="placement-location"
                  value={selected}
                  onValueChange={setLocationId}
                  items={locationItems}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="placement-quantity">Quantity</Label>
                <Input
                  id="placement-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-3">
                <Label htmlFor="placement-notes">Notes</Label>
                <Input
                  id="placement-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="runs the north-gate armory"
                />
              </div>
            </div>
          )}
          <FormButtons
            submitting={submitting}
            onCancel={() => onToggle(false)}
          />
        </form>
      }
    >
      {body}
    </SectionCard>
  );
}
