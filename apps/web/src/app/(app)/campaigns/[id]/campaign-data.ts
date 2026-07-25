import { notFound, redirect } from "next/navigation";
import type { Campaign } from "@dnd/shared";
import { ApiRequestError, getCampaign } from "@/lib/api";

// Shared loader for the campaign layout and every page nested under it.
// getCampaign is cache()d, so the repeat calls collapse into one request.
export async function loadCampaign(id: string): Promise<Campaign> {
  try {
    return await getCampaign(id);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // Token missing/expired at the API — clear it and bounce to login (a plain
      // redirect would loop against the proxy, which still sees the cookie).
      if (error.status === 401) redirect("/api/auth/logout");
      if (error.status === 404) notFound();
    }
    throw error;
  }
}
