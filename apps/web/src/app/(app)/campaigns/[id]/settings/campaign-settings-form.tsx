"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Campaign, CampaignStatus } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, EnumSelect } from "@/components/form-fields";
import { send } from "@/lib/mutate";

const STATUSES: Record<CampaignStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HIATUS: "On hiatus",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function CampaignSettingsForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a campaign name.");
      return;
    }
    setSubmitting(true);
    const ok = await send(
      `/api/campaigns/${encodeURIComponent(campaign.id)}`,
      "PATCH",
      { name: name.trim(), description: description.trim(), status },
      "Could not update campaign",
    );
    setSubmitting(false);
    if (ok) {
      toast.success("Campaign updated");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="campaign-name" label="Name">
        <Input
          id="campaign-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field id="campaign-description" label="Description">
        <Textarea
          id="campaign-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field id="campaign-status" label="Status">
        <EnumSelect
          id="campaign-status"
          value={status}
          onValueChange={(v) => setStatus(v as CampaignStatus)}
          items={STATUSES}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
