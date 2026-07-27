"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { CreatureSummary, LocationDetail } from "@dnd/shared";
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
import { CREATURE_KINDS } from "@/lib/creature-labels";
import { send } from "@/lib/mutate";

// The creatures placed at this location. The other half of the same join lives
// on the creature's stat block — placing from either side writes the same
// CreaturePlacement row, keyed on (creatureId, locationId).
export function LocationCreatures({
  campaignId,
  location,
  canManage,
}: {
  campaignId: string;
  location: LocationDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatureId, setCreatureId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  // The campaign's own creatures plus the shared bestiary, fetched only when
  // the add form first opens.
  const { rows, loading, load } = useLazyList<CreatureSummary>(
    `/api/creatures?campaignId=${encodeURIComponent(campaignId)}&includeShared=true`,
    "Could not load creatures",
  );

  const placed = new Set(location.creaturePlacements.map((p) => p.creature.id));
  const available = (rows ?? []).filter((row) => !placed.has(row.id));
  const selected = creatureId || available[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selected) {
      toast.error("Select a creature.");
      return;
    }
    const count = Number(quantity.trim() === "" ? 1 : quantity);
    if (!Number.isInteger(count) || count < 1) {
      toast.error("Quantity must be a whole number, 1 or more.");
      return;
    }
    setSubmitting(true);
    const ok = await send(
      "/api/creature-placements",
      "POST",
      {
        creatureId: selected,
        locationId: location.id,
        quantity: count,
        notes: notes.trim() || null,
      },
      "Could not place creature",
    );
    setSubmitting(false);
    if (ok) {
      toast.success("Creature placed");
      setCreatureId("");
      setQuantity("1");
      setNotes("");
      setOpen(false);
      router.refresh();
    }
  }

  async function onRemove(placedCreatureId: string) {
    const ok = await send(
      `/api/creature-placements/${placedCreatureId}/${location.id}`,
      "DELETE",
      undefined,
      "Could not remove placement",
    );
    if (ok) {
      toast.success("Placement removed");
      router.refresh();
    }
  }

  const creatureItems: Record<string, string> = Object.fromEntries(
    available.map((row) => [
      row.id,
      `${row.name} (${CREATURE_KINDS[row.kind]}${row.campaignId === null ? ", shared" : ""})`,
    ]),
  );

  const body =
    location.creaturePlacements.length === 0 ? (
      <EmptyState text="No creatures here yet." />
    ) : (
      <ul className="flex flex-col gap-1">
        {location.creaturePlacements.map((placement) => (
          <li
            key={placement.creature.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Link
                href={`/campaigns/${campaignId}/creatures/${placement.creature.id}`}
                className="truncate font-medium hover:underline"
              >
                {placement.creature.name}
              </Link>
              <Badge variant="outline">
                {CREATURE_KINDS[placement.creature.kind]}
              </Badge>
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
                  onRemove={() => onRemove(placement.creature.id)}
                  confirm={`Remove ${placement.creature.name} from this location?`}
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
          <CardTitle>Creatures here</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Creatures here"
      description="Place an NPC or monster at this location. Quantity and notes are per location."
      addLabel="Place creature"
      formTitle="Place creature here"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading creatures…</p>
          ) : available.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {rows?.length
                ? "Every available creature is already placed here."
                : "This campaign has no creatures yet."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="place-creature">Creature</Label>
                <EnumSelect
                  id="place-creature"
                  value={selected}
                  onValueChange={setCreatureId}
                  items={creatureItems}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="place-quantity">Quantity</Label>
                <Input
                  id="place-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-3">
                <Label htmlFor="place-notes">Notes</Label>
                <Input
                  id="place-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="patrols the east wall at night"
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
