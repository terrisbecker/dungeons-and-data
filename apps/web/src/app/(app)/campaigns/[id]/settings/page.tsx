import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMe } from "@/lib/api";
import { canManageCampaign, loadCampaign } from "../campaign-data";
import { ComingSoon } from "../coming-soon";
import { CampaignSettingsForm } from "./campaign-settings-form";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";

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
