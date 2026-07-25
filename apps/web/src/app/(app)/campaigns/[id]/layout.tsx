import type { ReactNode } from "react";
import { loadCampaign } from "./campaign-data";
import { CampaignWorkspace } from "./campaign-workspace";

// The sidebar shell wraps every campaign route, so the nav stays put while the
// Overview / Locations / … pages swap in as children.
export default async function CampaignLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const campaign = await loadCampaign(id);

  return <CampaignWorkspace campaign={campaign}>{children}</CampaignWorkspace>;
}
