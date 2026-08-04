"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
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

// Self-service leave, gated behind a confirm dialog (a sole DM leaving is
// refused server-side — see leaveMembershipService's ≥1-DM invariant — and
// that 409 surfaces here as a plain error toast).
export function LeaveCampaignDialog({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onLeave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/campaigns/${encodeURIComponent(campaignId)}/leave`,
        { method: "POST" },
      );
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        toast.error(failure?.error ?? "Could not leave campaign");
        return;
      }
      toast.success(`Left ${campaignName}`);
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
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <LogOutIcon />
        Leave campaign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave {campaignName}?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose your seat in this campaign. Any characters you own
            here are untouched.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={onLeave} disabled={submitting}>
            {submitting ? "Leaving…" : "Leave campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
