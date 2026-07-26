import { redirect } from "next/navigation";
import type { CreatureKind, CreatureSummary } from "@dnd/shared";
import { ApiRequestError, getMe, listCreatures } from "@/lib/api";
import { canManageCampaign, canManageSharedCatalog } from "../campaign-data";

// The browser filters live in the URL (?kind=…&scope=…) so the whole page stays
// a server component — no client state, and a filtered view is linkable.
export type CreatureScope = "all" | "campaign" | "shared";

export function parseKind(raw: string | undefined): CreatureKind | undefined {
  return raw === "NPC" || raw === "MONSTER" ? raw : undefined;
}

export function parseScope(raw: string | undefined): CreatureScope {
  return raw === "campaign" || raw === "shared" ? raw : "all";
}

// A campaign's creatures plus (unless narrowed) the shared bestiary, and what
// the viewer may write. `canManage` covers this campaign's own rows;
// `canManageShared` covers the null-campaign catalog rows, which any DM may edit.
export async function loadCreatureContext(
  campaignId: string,
  { kind, scope }: { kind?: CreatureKind; scope?: CreatureScope } = {},
): Promise<{
  creatures: CreatureSummary[];
  canManage: boolean;
  canManageShared: boolean;
}> {
  try {
    const [me, creatures] = await Promise.all([
      getMe(),
      // "shared" asks for the null-campaign rows only, which the API expresses
      // as includeShared with no campaign scope — but the list helper always
      // sends a campaignId, so filter that one case down here instead.
      listCreatures(campaignId, {
        includeShared: scope !== "campaign",
        kind,
      }),
    ]);
    return {
      creatures:
        scope === "shared"
          ? creatures.filter((c) => c.campaignId === null)
          : creatures,
      canManage: canManageCampaign(me, campaignId),
      canManageShared: canManageSharedCatalog(me),
    };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }
}
