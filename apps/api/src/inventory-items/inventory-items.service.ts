import { ItemType, Prisma } from "@prisma/client";
import { badRequest, conflict, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalInt,
  optionalUuidField,
  requireUuidField,
} from "../http/validate.js";
import { findCampaignEconomySettings } from "../campaign-economy-settings/campaign-economy-settings.queries.js";
import { findItemEconomyConfig } from "../item-economy-configs/item-economy-configs.queries.js";
import { findLocationItemTypeEconomyForChain } from "../location-item-economy/location-item-economy.queries.js";
import { findLocationEconomyStep } from "../locations/locations.queries.js";
import { getLocationCampaign } from "../auth/authz.queries.js";
import {
  type EconomyChainStep,
  computeBuildingPricing,
} from "./inventory-items.derived.js";
import {
  countAttunedForCharacter,
  countAttunedForCreature,
  createInventoryItem,
  deleteInventoryItem,
  findInventoryItemById,
  findInventoryItems,
  updateInventoryItem,
} from "./inventory-items.queries.js";

const ATTUNEMENT_CAP = 3;

// The owner of an inventory item is polymorphic: exactly one of characterId /
// creatureId / locationId is set (the DB enforces this with a CHECK constraint).
type Owner =
  { characterId: string } | { creatureId: string } | { locationId: string };

type InventoryItemRow = NonNullable<
  Awaited<ReturnType<typeof findInventoryItemById>>
>;

interface LocationStep {
  id: string;
  supplyLevel: number;
  demandLevel: number;
  useItemTypeEconomy: boolean;
  parentId: string | null;
}

// Walk from a location up through its ancestors. Guards against a
// pre-existing cycle the same way locations.service.ts's assertNoParentCycle
// does.
async function walkLocationChain(locationId: string): Promise<LocationStep[]> {
  const chain: LocationStep[] = [];
  const visited = new Set<string>();
  let cursor: string | null = locationId;
  while (cursor !== null) {
    if (visited.has(cursor)) break;
    visited.add(cursor);
    const step = await findLocationEconomyStep(cursor);
    if (!step) break;
    chain.push({ id: cursor, ...step });
    cursor = step.parentId;
  }
  return chain;
}

// Resolve the ancestor chain's supply/demand deltas for one item type. Each
// location picks between its two modes independently: useItemTypeEconomy
// false uses that location's global sliders for every type; true looks up a
// LocationItemTypeEconomy row for this specific type, defaulting to neutral
// (0/0) when none exists — advanced mode never falls back to the global
// sliders. See inventory-items.derived.ts for how the resulting chain
// combines into a price modifier.
async function resolveEconomyChain(
  locationId: string,
  itemType: ItemType,
): Promise<EconomyChainStep[]> {
  const locationChain = await walkLocationChain(locationId);

  const advancedIds = locationChain
    .filter((step) => step.useItemTypeEconomy)
    .map((step) => step.id);
  const overrides = advancedIds.length
    ? await findLocationItemTypeEconomyForChain(advancedIds, itemType)
    : [];
  const overrideByLocationId = new Map(
    overrides.map((row) => [row.locationId, row]),
  );

  return locationChain.map((step) => {
    if (!step.useItemTypeEconomy) {
      return { supplyLevel: step.supplyLevel, demandLevel: step.demandLevel };
    }
    const override = overrideByLocationId.get(step.id);
    return {
      supplyLevel: override?.supplyLevel ?? 0,
      demandLevel: override?.demandLevel ?? 0,
    };
  });
}

// Building-inventory rows (owner = a location) get a computed buy/sell price;
// every other row is returned as-is — a computed price is never shown outside
// building inventory, per docs/economy-layer.md.
async function attachPricing(row: InventoryItemRow) {
  if (!row.locationId) return row;

  const [chain, locationCampaign, itemTypeConfig] = await Promise.all([
    resolveEconomyChain(row.locationId, row.item.type),
    getLocationCampaign(row.locationId),
    findItemEconomyConfig(row.item.type),
  ]);

  const campaignId = locationCampaign?.campaignId ?? null;
  const economySettings = campaignId
    ? await findCampaignEconomySettings(campaignId)
    : null;

  const pricing = computeBuildingPricing({
    baseValueCp: row.item.baseValueCp,
    chain,
    demandSlope: itemTypeConfig ? itemTypeConfig.demandSlope.toNumber() : 1,
    economySettings,
  });

  return { ...row, pricing };
}

// A location's stock isn't "worn" — the 5e attunement cap only applies to a
// character/creature owner.
type AttunableOwner = { characterId: string } | { creatureId: string };

async function assertAttunementCapacity(
  owner: AttunableOwner,
  excludeId?: string,
) {
  const attunedCount =
    "characterId" in owner
      ? await countAttunedForCharacter(owner.characterId, excludeId)
      : await countAttunedForCreature(owner.creatureId, excludeId);
  if (attunedCount >= ATTUNEMENT_CAP) {
    throw conflict(
      `Already attuned to ${ATTUNEMENT_CAP} items — unattune one first.`,
    );
  }
}

export async function createInventoryItemService(rawBody: unknown) {
  const body = asRecord(rawBody);

  // Exactly one owner must be provided — mirrors the DB's three-way XOR CHECK
  // so a bad request fails with a 400 rather than a 500.
  const characterId = optionalUuidField(body, "characterId");
  const creatureId = optionalUuidField(body, "creatureId");
  const locationId = optionalUuidField(body, "locationId");
  const ownerCount = [characterId, creatureId, locationId].filter(
    (v) => v !== undefined,
  ).length;
  if (ownerCount !== 1) {
    throw badRequest();
  }
  const owner: Owner =
    characterId !== undefined
      ? { characterId }
      : creatureId !== undefined
        ? { creatureId }
        : { locationId: locationId as string };

  const data: Prisma.InventoryItemUncheckedCreateInput = {
    itemId: requireUuidField(body, "itemId"),
    ...owner,
  };
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const equipped = optionalBoolean(body, "equipped");
  if (equipped !== undefined) data.equipped = equipped;
  const attuned = optionalBoolean(body, "attuned");
  if (attuned !== undefined) data.attuned = attuned;

  if (attuned === true && "locationId" in owner) {
    throw badRequest();
  }
  if (attuned === true && !("locationId" in owner)) {
    await assertAttunementCapacity(owner);
  }

  let row: InventoryItemRow;
  try {
    row = await createInventoryItem(data);
  } catch (error) {
    mapPrismaError(error);
  }
  return attachPricing(row);
}

export async function listInventoryItemsService(filter: {
  characterId?: string;
  creatureId?: string;
  locationId?: string;
}) {
  const where: Prisma.InventoryItemWhereInput = {};
  if (filter.characterId !== undefined) where.characterId = filter.characterId;
  if (filter.creatureId !== undefined) where.creatureId = filter.creatureId;
  if (filter.locationId !== undefined) where.locationId = filter.locationId;
  const rows = await findInventoryItems(where);
  return Promise.all(rows.map(attachPricing));
}

export async function getInventoryItemService(id: string) {
  const row = await findInventoryItemById(id);
  if (!row) throw notFound();
  return attachPricing(row);
}

export async function updateInventoryItemService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const existing = await findInventoryItemById(id);
  if (!existing) throw notFound();

  const data: Prisma.InventoryItemUncheckedUpdateInput = {};
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const equipped = optionalBoolean(body, "equipped");
  if (equipped !== undefined) data.equipped = equipped;
  const attuned = optionalBoolean(body, "attuned");
  if (attuned !== undefined) data.attuned = attuned;

  if (attuned === true && existing.locationId) {
    throw badRequest();
  }

  // Only newly attuning an item can breach the cap; check against its owner.
  if (attuned === true && !existing.attuned) {
    if (existing.characterId) {
      await assertAttunementCapacity({ characterId: existing.characterId }, id);
    } else if (existing.creatureId) {
      await assertAttunementCapacity({ creatureId: existing.creatureId }, id);
    }
  }

  let row: InventoryItemRow;
  try {
    row = await updateInventoryItem(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
  return attachPricing(row);
}

export async function deleteInventoryItemService(id: string): Promise<void> {
  try {
    await deleteInventoryItem(id);
  } catch (error) {
    mapPrismaError(error);
  }
}
