import { notFound, redirect } from "next/navigation";
import type { LocationDetail, LocationRow } from "@dnd/shared";
import { ApiRequestError, getLocation } from "@/lib/api";
import { LocationsBrowser } from "../locations-browser";
import { loadLocationContext } from "../locations-data";

// One level of the hierarchy. The detail read is what carries the creatures
// placed here; the flat campaign list supplies the breadcrumb and the children.
export default async function CampaignLocationPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>;
}) {
  const { id, locationId } = await params;

  let current: LocationDetail;
  let context: { all: LocationRow[]; canManage: boolean };
  try {
    [current, context] = await Promise.all([
      getLocation(locationId),
      loadLocationContext(id),
    ]);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.status === 401) redirect("/api/auth/logout");
      // 400 covers a malformed uuid in the URL, which the API rejects outright.
      if (error.status === 404 || error.status === 400) notFound();
    }
    throw error;
  }

  // Reads are open to any authed user API-side, so a location id from another
  // campaign would otherwise render inside this campaign's shell.
  if (current.campaignId !== id) notFound();

  const { all, canManage } = context;

  return (
    <LocationsBrowser
      campaignId={id}
      all={all}
      current={current}
      canManage={canManage}
    />
  );
}
