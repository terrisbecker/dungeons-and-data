import { notFound, redirect } from "next/navigation";
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
import { ItemCatalogManager } from "../item-catalog";
import { SpellCatalogManager } from "../spell-catalog";
import { FeatCatalogManager } from "../feat-catalog";
import { FeatureCatalogManager } from "../feature-catalog";

const TYPES = ["items", "spells", "feats", "features"] as const;
type CatalogType = (typeof TYPES)[number];

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

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!TYPES.includes(type as CatalogType)) notFound();
  const catalogType = type as CatalogType;

  // Load /auth/me (for the gate) and the catalog list in parallel rather than
  // gating first and then fetching — the common caller is an authorized DM, so
  // the one wasted list fetch for a bounced non-manager is a fair trade for
  // saving a round-trip on every real visit.
  let me: MeResponse;
  let rows: CatalogRows;
  try {
    [me, rows] = await Promise.all([getMe(), loadRows(catalogType)]);
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

  switch (catalogType) {
    case "items":
      return <ItemCatalogManager rows={rows as ItemCatalog[]} />;
    case "spells":
      return <SpellCatalogManager rows={rows as SpellCatalog[]} />;
    case "feats":
      return <FeatCatalogManager rows={rows as FeatCatalog[]} />;
    case "features":
      return <FeatureCatalogManager rows={rows as FeatureCatalog[]} />;
  }
}
