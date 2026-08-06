import { notFound } from "next/navigation";
import {
  CATALOG_TYPES,
  CatalogPageContent,
  type CatalogType,
} from "../catalog-page-content";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!CATALOG_TYPES.includes(type as CatalogType)) notFound();

  return <CatalogPageContent type={type as CatalogType} />;
}
