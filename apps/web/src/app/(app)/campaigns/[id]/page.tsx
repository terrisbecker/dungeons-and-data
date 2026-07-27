import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMe } from "@/lib/api";
import { canManageCampaign, loadCampaign } from "./campaign-data";
import { InviteCard } from "./invite-card";
import { RosterRow } from "./roster-row";
import { LeaveCampaignDialog } from "./leave-campaign-dialog";

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign, me] = await Promise.all([loadCampaign(id), getMe()]);
  const canManage = canManageCampaign(me, campaign.id);
  const ownMembership = campaign.memberships.find((m) => m.player.id === me.id);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <InviteCard campaignId={campaign.id} />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                {campaign.memberships.length} member(s) in this campaign.
              </CardDescription>
            </div>
            {ownMembership && (
              <LeaveCampaignDialog
                campaignId={campaign.id}
                campaignName={campaign.name}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {campaign.memberships.map((m) => (
            <RosterRow
              key={m.id}
              membershipId={m.id}
              displayName={m.player.displayName ?? m.player.username}
              role={m.role}
              canManage={canManage}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
