"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { CreatureStatBlock } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteCreature } from "./creature-mutations";

// Deleting a creature is a clean cascade — every child row goes with it — so
// the confirm just counts what will disappear.
export function DeleteCreatureDialog({
  campaignId,
  creature,
}: {
  campaignId: string;
  creature: CreatureStatBlock;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const counts: string[] = [];
  if (creature.entries.length) {
    counts.push(
      `${creature.entries.length} stat block ${creature.entries.length === 1 ? "entry" : "entries"}`,
    );
  }
  if (creature.skills.length) {
    counts.push(`${creature.skills.length} skill proficiencies`);
  }
  if (creature.damageModifiers.length) {
    counts.push(`${creature.damageModifiers.length} damage modifiers`);
  }
  if (creature.inventory.length) {
    counts.push(`${creature.inventory.length} inventory rows`);
  }

  async function onDelete() {
    if (submitting) return;
    setSubmitting(true);
    const ok = await deleteCreature(creature.id);
    setSubmitting(false);
    if (ok) {
      toast.success("Creature removed");
      setOpen(false);
      router.push(`/campaigns/${campaignId}/creatures`);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Trash2Icon />
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {creature.name}?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-4 text-xs/relaxed">
          {counts.length > 0 && (
            <li>{counts.join(", ")} are deleted with it.</li>
          )}
          {creature.placements.length > 0 && (
            <li>
              It is removed from {creature.placements.length} location
              {creature.placements.length === 1 ? "" : "s"}. The locations
              themselves are kept.
            </li>
          )}
          {counts.length === 0 && creature.placements.length === 0 && (
            <li>Nothing else references this creature.</li>
          )}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={onDelete} disabled={submitting}>
            {submitting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
