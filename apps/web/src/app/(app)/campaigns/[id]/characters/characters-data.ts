import { redirect } from "next/navigation";
import type { Campaign, CharacterSummary } from "@dnd/shared";
import { ApiRequestError, listCampaignCharacters } from "@/lib/api";
import { loadCampaign } from "../campaign-data";

// The campaign plus every character in it. Read-only page — no canManage
// needed, since the only action here is linking into a character sheet.
export async function loadCampaignRoster(campaignId: string): Promise<{
  campaign: Campaign;
  characters: CharacterSummary[];
}> {
  try {
    const [campaign, characters] = await Promise.all([
      loadCampaign(campaignId),
      listCampaignCharacters(campaignId),
    ]);
    return { campaign, characters };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }
}
