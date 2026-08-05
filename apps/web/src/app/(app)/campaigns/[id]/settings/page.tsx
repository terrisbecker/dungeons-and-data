import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCampaignEconomySettings, getMe } from "@/lib/api";
import { canManageCampaign, loadCampaign } from "../campaign-data";
import { ComingSoon } from "../coming-soon";
import { CampaignSettingsForm } from "./campaign-settings-form";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";
import { EconomySettingsForm } from "./economy-settings-form";

export default async function CampaignSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign, me] = await Promise.all([loadCampaign(id), getMe()]);

  if (!canManageCampaign(me, campaign.id)) {
    return (
      <ComingSoon
        title="Settings"
        description="Only this campaign's Dungeon Master (or an Admin) can change its settings."
      />
    );
  }

  const economySettings = await getCampaignEconomySettings(campaign.id);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
          <CardDescription>
            Name, description, and status shown across the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignSettingsForm campaign={campaign} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Economy</CardTitle>
          <CardDescription>
            Supply/demand pricing for building inventories. Off by default —
            when on, every building&rsquo;s buy/sell prices react to its
            location&rsquo;s supply/demand sliders, clamped to the floor/ceiling
            below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EconomySettingsForm
            campaignId={campaign.id}
            settings={economySettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Deleting a campaign cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteCampaignDialog
            campaignId={campaign.id}
            campaignName={campaign.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
