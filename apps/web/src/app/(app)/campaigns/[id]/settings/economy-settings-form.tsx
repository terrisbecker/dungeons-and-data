"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CampaignEconomySettings } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Field } from "@/components/form-fields";
import { send } from "@/lib/mutate";

export function EconomySettingsForm({
  campaignId,
  settings,
}: {
  campaignId: string;
  settings: CampaignEconomySettings;
}) {
  const router = useRouter();
  const [economyEnabled, setEconomyEnabled] = useState(settings.economyEnabled);
  const [floorPercent, setFloorPercent] = useState(
    String(settings.floorPercent),
  );
  const [ceilingPercent, setCeilingPercent] = useState(
    String(settings.ceilingPercent),
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const floor = Number(floorPercent);
    const ceiling = Number(ceilingPercent);
    if (
      !Number.isInteger(floor) ||
      floor < 0 ||
      floor > 100 ||
      !Number.isInteger(ceiling) ||
      ceiling < 0 ||
      ceiling > 100
    ) {
      toast.error("Floor and ceiling must be whole percentages, 0–100.");
      return;
    }
    setSubmitting(true);
    const ok = await send(
      `/api/campaign-economy-settings/${encodeURIComponent(campaignId)}`,
      "PATCH",
      { economyEnabled, floorPercent: floor, ceilingPercent: ceiling },
      "Could not update economy settings",
    );
    setSubmitting(false);
    if (ok) {
      toast.success("Economy settings updated");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Checkbox
        label="Economy engine enabled"
        checked={economyEnabled}
        onChange={setEconomyEnabled}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field id="economy-floor" label="Floor %">
          <Input
            id="economy-floor"
            type="number"
            min={0}
            max={100}
            value={floorPercent}
            onChange={(e) => setFloorPercent(e.target.value)}
          />
        </Field>
        <Field id="economy-ceiling" label="Ceiling %">
          <Input
            id="economy-ceiling"
            type="number"
            min={0}
            max={100}
            value={ceilingPercent}
            onChange={(e) => setCeilingPercent(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
