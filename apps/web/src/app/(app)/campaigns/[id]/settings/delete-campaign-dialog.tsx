"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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

// Deleting a campaign is not a clean cascade: its Locations and Creatures
// cascade-delete (Campaign.campaignId onDelete: Cascade on both), but its
// PlayerCharacters are only unassigned (onDelete: SetNull) — the confirm
// spells out that asymmetry.
export function DeleteCampaignDialog({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onDelete() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/campaigns/${encodeURIComponent(campaignId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        toast.error(failure?.error ?? "Could not delete campaign");
        return;
      }
      toast.success("Campaign deleted");
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Delete campaign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {campaignName}?</DialogTitle>
          <DialogDescription>
            This cannot be undone. Its locations and creatures will be
            permanently deleted; its characters are kept, just unassigned from
            the campaign.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
