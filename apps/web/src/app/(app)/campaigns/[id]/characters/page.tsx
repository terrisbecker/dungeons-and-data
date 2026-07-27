import { loadCampaignRoster } from "./characters-data";
import { CharactersRoster } from "./characters-roster";

export default async function CampaignCharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { campaign, characters } = await loadCampaignRoster(id);
  return <CharactersRoster campaign={campaign} characters={characters} />;
}
