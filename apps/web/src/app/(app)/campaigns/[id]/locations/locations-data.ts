import { redirect } from "next/navigation";
import type { LocationRow, MeResponse } from "@dnd/shared";
import { ApiRequestError, getMe, listLocations } from "@/lib/api";

// Writing a campaign-scoped location is Admin-or-that-campaign's-DM (see
// assertCanWriteCampaignScoped in the API). Mirrored here only to decide what
// to render — the API guards still enforce it on every mutation.
export function canManageCampaign(me: MeResponse, campaignId: string): boolean {
  return (
    me.systemRole === "ADMIN" ||
    me.memberships.some(
      (m) => m.campaign.id === campaignId && m.role === "DUNGEON_MASTER",
    )
  );
}

// The whole campaign's location list plus the viewer's write permission. Both
// location pages need exactly this pair.
export async function loadLocationContext(campaignId: string): Promise<{
  all: LocationRow[];
  canManage: boolean;
}> {
  try {
    const [me, all] = await Promise.all([getMe(), listLocations(campaignId)]);
    return { all, canManage: canManageCampaign(me, campaignId) };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }
}
