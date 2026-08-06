import { notFound } from "next/navigation";
import {
  CATALOG_TYPES,
  CatalogPageContent,
  type CatalogType,
} from "../../../../catalog/catalog-page-content";

// Nested under the campaign layout so the sidebar/shell stays put — the
// content is identical to the standalone /catalog/[type] route, just
// rendered into the campaign workspace's main area instead of leaving it.
export default async function CampaignCatalogPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { type } = await params;
  if (!CATALOG_TYPES.includes(type as CatalogType)) notFound();

  return <CatalogPageContent type={type as CatalogType} backHref={null} />;
}
