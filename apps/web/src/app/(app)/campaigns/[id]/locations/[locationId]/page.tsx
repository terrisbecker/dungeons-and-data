import { notFound, redirect } from "next/navigation";
import type {
  BuildingInventoryItem,
  LocationDetail,
  LocationItemTypeEconomy,
  LocationRow,
} from "@dnd/shared";
import {
  ApiRequestError,
  getLocation,
  getLocationBuildingInventory,
  getLocationItemTypeEconomies,
} from "@/lib/api";
import { isBuildingType } from "@/lib/location-labels";
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

  let buildingInventory: BuildingInventoryItem[] | undefined;
  if (isBuildingType(current.type)) {
    buildingInventory = await getLocationBuildingInventory(current.id);
  }

  let itemTypeEconomies: LocationItemTypeEconomy[] | undefined;
  if (current.useItemTypeEconomy) {
    itemTypeEconomies = await getLocationItemTypeEconomies(current.id);
  }

  return (
    <LocationsBrowser
      campaignId={id}
      all={all}
      current={current}
      canManage={canManage}
      buildingInventory={buildingInventory}
      itemTypeEconomies={itemTypeEconomies}
    />
  );
}
