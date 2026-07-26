import { redirect } from "next/navigation";
import type { LocationRow } from "@dnd/shared";
import { ApiRequestError, getMe, listLocations } from "@/lib/api";
import { canManageCampaign } from "../campaign-data";

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
