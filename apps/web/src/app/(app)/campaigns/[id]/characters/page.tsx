import { ComingSoon } from "../coming-soon";

// A campaign-wide roster is not buildable yet: GET /characters filters only by
// playerId, not campaignId. Players reach their own characters from the
// dashboard in the meantime.
export default function CampaignCharactersPage() {
  return (
    <ComingSoon
      title="Characters"
      description="A roster of every character in this campaign is not wired up yet. For now, open your characters from the dashboard."
    />
  );
}
