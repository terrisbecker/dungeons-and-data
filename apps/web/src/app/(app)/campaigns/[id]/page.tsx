import { notFound, redirect } from "next/navigation";
import type { Campaign } from "@dnd/shared";
import { ApiRequestError, getCampaign } from "@/lib/api";
import { CampaignWorkspace } from "./campaign-workspace";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let campaign: Campaign;
  try {
    campaign = await getCampaign(id);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // Token missing/expired at the API — clear it and bounce to login (a plain
      // redirect would loop against the proxy, which still sees the cookie).
      if (error.status === 401) redirect("/api/auth/logout");
      if (error.status === 404) notFound();
    }
    throw error;
  }

  return <CampaignWorkspace campaign={campaign} />;
}
