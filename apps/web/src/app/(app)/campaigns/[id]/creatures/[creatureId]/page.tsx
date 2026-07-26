import { notFound, redirect } from "next/navigation";
import type { CreatureStatBlock, MeResponse } from "@dnd/shared";
import { ApiRequestError, getCreatureStatBlock, getMe } from "@/lib/api";
import { canManageCampaign, canManageSharedCatalog } from "../../campaign-data";
import { CreatureStatBlockView } from "./creature-stat-block";

export default async function CreaturePage({
  params,
}: {
  params: Promise<{ id: string; creatureId: string }>;
}) {
  const { id, creatureId } = await params;

  let creature: CreatureStatBlock;
  let me: MeResponse;
  try {
    [creature, me] = await Promise.all([
      getCreatureStatBlock(creatureId),
      getMe(),
    ]);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // Token missing/expired at the API — clear it and bounce to login (a plain
      // redirect would loop against the proxy, which still sees the cookie).
      if (error.status === 401) redirect("/api/auth/logout");
      // 400 covers a malformed uuid in the URL, which the API rejects outright.
      if (error.status === 404 || error.status === 400) notFound();
    }
    throw error;
  }

  // Reads are open to any authed user, so another campaign's creature would
  // otherwise render inside this campaign's shell. Shared-bestiary creatures
  // (no campaign) belong to every campaign, so they stay visible here.
  if (creature.campaignId !== null && creature.campaignId !== id) notFound();

  const canManage =
    creature.campaignId === null
      ? canManageSharedCatalog(me)
      : canManageCampaign(me, creature.campaignId);

  return (
    <CreatureStatBlockView
      campaignId={id}
      creature={creature}
      canManage={canManage}
    />
  );
}
