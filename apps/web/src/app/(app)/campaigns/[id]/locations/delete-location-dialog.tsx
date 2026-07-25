"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { LocationDetail } from "@dnd/shared";
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

// Deleting a location is not a clean cascade, so the confirm spells out both
// halves: Location.parentId is SetNull (children survive, promoted to the top
// level) while CreaturePlacement cascades (those rows really are removed).
export function DeleteLocationDialog({
  campaignId,
  location,
  childCount,
}: {
  campaignId: string;
  location: LocationDetail;
  childCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const placementCount = location.creaturePlacements.length;

  async function onDelete() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/locations/${encodeURIComponent(location.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        toast.error(failure?.error ?? "Could not remove location");
        return;
      }
      toast.success("Location removed");
      setOpen(false);
      // Land on the level above; a deleted root falls back to the list.
      router.push(
        location.parentId
          ? `/campaigns/${campaignId}/locations/${location.parentId}`
          : `/campaigns/${campaignId}/locations`,
      );
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSubmitting(false);
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
          <DialogTitle>Delete {location.locationName}?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-4 text-xs/relaxed">
          {childCount > 0 && (
            <li>
              Its {childCount} sub-location{childCount === 1 ? "" : "s"} will
              <strong className="text-foreground"> not </strong>
              be deleted — they move to the top level of this campaign.
            </li>
          )}
          {placementCount > 0 && (
            <li>
              {placementCount} creature placement
              {placementCount === 1 ? "" : "s"} here will be removed. The
              creatures themselves are kept.
            </li>
          )}
          {childCount === 0 && placementCount === 0 && (
            <li>Nothing else references this location.</li>
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
