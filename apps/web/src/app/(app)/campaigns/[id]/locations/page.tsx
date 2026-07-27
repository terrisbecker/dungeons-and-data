import { LocationsBrowser } from "./locations-browser";
import { loadLocationContext } from "./locations-data";

// The top of the hierarchy: the campaign's locations with no parent.
export default async function CampaignLocationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { all, canManage } = await loadLocationContext(id);

  return (
    <LocationsBrowser
      campaignId={id}
      all={all}
      current={null}
      canManage={canManage}
    />
  );
}
