"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CampaignRole } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import { RemoveButton } from "@/components/section-card";
import { send } from "@/lib/mutate";

const ROLE_LABEL: Record<CampaignRole, string> = {
  DUNGEON_MASTER: "Dungeon Master",
  PLAYER: "Player",
};

// One roster row. A DM/Admin gets a role toggle and a confirm-gated remove;
// everyone else sees the same row as plain text (mirrors the read-only
// fallback the locations/creatures pages already use).
export function RosterRow({
  membershipId,
  displayName,
  role,
  canManage,
}: {
  membershipId: string;
  displayName: string;
  role: CampaignRole;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleRole() {
    if (busy) return;
    setBusy(true);
    const next: CampaignRole =
      role === "DUNGEON_MASTER" ? "PLAYER" : "DUNGEON_MASTER";
    const ok = await send(
      `/api/campaign-memberships/${encodeURIComponent(membershipId)}`,
      "PATCH",
      { role: next },
      "Could not change role",
    );
    setBusy(false);
    if (ok) {
      toast.success(`${displayName} is now ${ROLE_LABEL[next]}`);
      router.refresh();
    }
  }

  async function onRemove() {
    const ok = await send(
      `/api/campaign-memberships/${encodeURIComponent(membershipId)}`,
      "DELETE",
      undefined,
      "Could not remove player",
    );
    if (ok) {
      toast.success(`${displayName} removed from the campaign`);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
      <span className="font-medium">{displayName}</span>
      <span className="flex items-center gap-2">
        {canManage ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={toggleRole}
          >
            {ROLE_LABEL[role]}
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm">
            {ROLE_LABEL[role]}
          </span>
        )}
        {canManage && (
          <RemoveButton
            onRemove={onRemove}
            confirm={`Remove ${displayName} from this campaign's roster? Any characters they own here are untouched.`}
          />
        )}
      </span>
    </div>
  );
}
