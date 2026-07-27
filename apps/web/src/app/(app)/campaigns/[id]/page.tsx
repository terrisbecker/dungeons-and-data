import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadCampaign } from "./campaign-data";
import { InviteCard } from "./invite-card";

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await loadCampaign(id);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <InviteCard campaignId={campaign.id} />

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>
            {campaign.memberships.length} member(s) in this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {campaign.memberships.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className="font-medium">
                {m.player.displayName ?? m.player.username}
              </span>
              <span className="text-muted-foreground text-sm">
                {m.role === "DUNGEON_MASTER" ? "Dungeon Master" : "Player"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
