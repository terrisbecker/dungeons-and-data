import { notFound, redirect } from "next/navigation";
import type { Campaign, MeResponse } from "@dnd/shared";
import { ApiRequestError, getCampaign } from "@/lib/api";

// Writing anything campaign-scoped (locations, creatures, …) is
// Admin-or-that-campaign's-DM — see assertCanWriteCampaignScoped in the API.
// Mirrored here only to decide what to render; the API guards still enforce it
// on every mutation.
export function canManageCampaign(me: MeResponse, campaignId: string): boolean {
  return (
    me.systemRole === "ADMIN" ||
    me.memberships.some(
      (m) => m.campaign.id === campaignId && m.role === "DUNGEON_MASTER",
    )
  );
}

// Writing a SHARED-catalog row (a creature with no campaign) is open to an
// Admin or a DM of any campaign — assertCanWriteCatalog's isDmOfAny rule.
export function canManageSharedCatalog(me: MeResponse): boolean {
  return (
    me.systemRole === "ADMIN" ||
    me.memberships.some((m) => m.role === "DUNGEON_MASTER")
  );
}

// Shared loader for the campaign layout and every page nested under it.
// getCampaign is cache()d, so the repeat calls collapse into one request.
export async function loadCampaign(id: string): Promise<Campaign> {
  try {
    return await getCampaign(id);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // Token missing/expired at the API — clear it and bounce to login (a plain
      // redirect would loop against the proxy, which still sees the cookie).
      if (error.status === 401) redirect("/api/auth/logout");
      if (error.status === 404) notFound();
    }
    throw error;
  }
}
