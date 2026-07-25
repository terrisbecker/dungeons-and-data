"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogInIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function JoinCampaignDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = campaignId.trim();
  const looksValid = UUID_RE.test(trimmed);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!looksValid) {
      toast.error("That doesn't look like a valid campaign id.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/campaigns/${encodeURIComponent(trimmed)}/join`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(
          body?.error ??
            (res.status === 404
              ? "No campaign found with that id."
              : "Could not join campaign"),
        );
        return;
      }
      toast.success("Joined campaign");
      setOpen(false);
      setCampaignId("");
      // Re-render the server component so /auth/me is re-fetched with the new
      // membership.
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
        <LogInIcon />
        Join campaign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a campaign</DialogTitle>
          <DialogDescription>
            Paste the campaign id your Dungeon Master shared with you.
            You&apos;ll join as a Player.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="join-campaign-id">Campaign id</Label>
            <Input
              id="join-campaign-id"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting || !looksValid}>
              {submitting ? "Joining…" : "Join"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
