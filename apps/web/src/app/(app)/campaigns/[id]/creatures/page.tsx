import { CreaturesBrowser } from "./creatures-browser";
import { loadCreatureContext, parseKind, parseScope } from "./creatures-data";

export default async function CampaignCreaturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string; scope?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const kind = parseKind(query.kind);
  const scope = parseScope(query.scope);

  const { creatures, canManage, canManageShared } = await loadCreatureContext(
    id,
    { kind, scope },
  );

  return (
    <CreaturesBrowser
      campaignId={id}
      creatures={creatures}
      kind={kind}
      scope={scope}
      canManage={canManage}
      canManageShared={canManageShared}
    />
  );
}
