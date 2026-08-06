import { redirect } from "next/navigation";
import type {
  FeatCatalog,
  FeatureCatalog,
  ItemCatalog,
  MeResponse,
  SpellCatalog,
} from "@dnd/shared";
import {
  ApiRequestError,
  getMe,
  listFeats,
  listFeatures,
  listItems,
  listSpells,
} from "@/lib/api";
import { ItemCatalogManager } from "./item-catalog";
import { SpellCatalogManager } from "./spell-catalog";
import { FeatCatalogManager } from "./feat-catalog";
import { FeatureCatalogManager } from "./feature-catalog";

export const CATALOG_TYPES = ["items", "spells", "feats", "features"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

type CatalogRows =
  ItemCatalog[] | SpellCatalog[] | FeatCatalog[] | FeatureCatalog[];

function loadRows(type: CatalogType): Promise<CatalogRows> {
  switch (type) {
    case "items":
      return listItems();
    case "spells":
      return listSpells();
    case "feats":
      return listFeats();
    case "features":
      return listFeatures();
  }
}

// Shared by both the standalone /catalog/[type] route and the campaign-nested
// /campaigns/[id]/catalog/[type] route, so the same manager renders whether
// reached from the dashboard or from inside a campaign's sidebar.
export async function CatalogPageContent({
  type,
  backHref,
}: {
  type: CatalogType;
  // Nested under a campaign, the sidebar already has its own "Back to
  // dashboard" link, so pass null there to skip the in-page one.
  backHref?: string | null;
}) {
  // Load /auth/me (for the gate) and the catalog list in parallel rather than
  // gating first and then fetching — the common caller is an authorized DM, so
  // the one wasted list fetch for a bounced non-manager is a fair trade for
  // saving a round-trip on every real visit.
  let me: MeResponse;
  let rows: CatalogRows;
  try {
    [me, rows] = await Promise.all([getMe(), loadRows(type)]);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  // Only Admins and DMs may author catalogs — the API enforces this too, but we
  // bounce non-privileged users before they see the form.
  const canManage =
    me.systemRole === "ADMIN" ||
    me.memberships.some((m) => m.role === "DUNGEON_MASTER");
  if (!canManage) redirect("/dashboard");

  switch (type) {
    case "items":
      return (
        <ItemCatalogManager rows={rows as ItemCatalog[]} backHref={backHref} />
      );
    case "spells":
      return (
        <SpellCatalogManager
          rows={rows as SpellCatalog[]}
          backHref={backHref}
        />
      );
    case "feats":
      return (
        <FeatCatalogManager rows={rows as FeatCatalog[]} backHref={backHref} />
      );
    case "features":
      return (
        <FeatureCatalogManager
          rows={rows as FeatureCatalog[]}
          backHref={backHref}
        />
      );
  }
}
