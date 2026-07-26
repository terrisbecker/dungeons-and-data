import { redirect } from "next/navigation";
import type { MeResponse } from "@dnd/shared";
import { ApiRequestError, getMe } from "@/lib/api";
import {
  canManageCampaign,
  canManageSharedCatalog,
  loadCampaign,
} from "../../campaign-data";
import { CreatureWizard } from "./creature-wizard";

export default async function NewCreaturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let me: MeResponse;
  try {
    me = await getMe();
  } catch (error) {
    // Token missing/expired at the API — clear it and bounce to login (a plain
    // redirect would loop against the proxy, which still sees the cookie).
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  const canManage = canManageCampaign(me, id);
  const canManageShared = canManageSharedCatalog(me);
  // A plain player can read the bestiary but not add to it; send them back
  // rather than rendering a form every submit would 403.
  if (!canManage && !canManageShared) {
    redirect(`/campaigns/${id}/creatures`);
  }

  const campaign = await loadCampaign(id);

  return (
    <CreatureWizard
      campaignId={id}
      campaignName={campaign.name}
      canManageCampaign={canManage}
      canManageShared={canManageShared}
    />
  );
}
