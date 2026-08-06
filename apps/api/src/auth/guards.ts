import type { Request, RequestHandler } from "express";
import {
  badRequest,
  forbidden,
  notFound,
  unauthorized,
} from "../http/http-error.js";
import {
  asRecord,
  optionalUuidField,
  requireUuid,
  requireUuidField,
} from "../http/validate.js";
import type { AuthContext } from "./auth.types.js";
import {
  assertAdmin,
  assertCanCreateCharacter,
  assertCanWriteCampaign,
  assertCanWriteCampaignScopedCreate,
  assertCanWriteCatalog,
  assertCanWriteCharacter,
  assertCanWriteCreature,
  assertCanWriteLocation,
  isAdmin,
} from "./authz.js";
import {
  campaignIdOfMembership,
  characterIdOfClass,
  characterIdOfCondition,
  characterIdOfProficiency,
  characterIdOfResource,
  characterIdOfSkill,
  characterIdOfSpellSlot,
  creatureIdOfCreatureSkill,
  creatureIdOfDamageModifier,
  creatureIdOfStatBlockEntry,
  getInventoryItemOwner,
} from "./authz.queries.js";

// Authorization guards. Each is Express middleware that runs AFTER requireAuth,
// extracts the relevant id from the request (params/body), resolves the owning
// scope, and either calls next() or throws. Wiring one guard per mutating route
// keeps all auth logic here and leaves the existing business services unchanged.

type Enforce = (auth: AuthContext, req: Request) => Promise<void> | void;

function guard(enforce: Enforce): RequestHandler {
  return async (req, _res, next) => {
    const auth = req.auth;
    if (!auth) throw unauthorized();
    await enforce(auth, req);
    next();
  };
}

// --- Character hub ---------------------------------------------------------

export const guardCharacterCreate = guard(async (auth, req) => {
  const body = asRecord(req.body);
  const playerId = optionalUuidField(body, "playerId") ?? null;
  const campaignId = optionalUuidField(body, "campaignId") ?? null;
  await assertCanCreateCharacter(auth, { playerId, campaignId });
});

// PATCH/DELETE /:id where :id IS the characterId.
export const guardCharacterByParamId = guard((auth, req) =>
  assertCanWriteCharacter(auth, requireUuid(req.params.id)),
);

// POST body carrying characterId (owned children + composite joins).
export const guardCharacterByBody = guard((auth, req) =>
  assertCanWriteCharacter(
    auth,
    requireUuidField(asRecord(req.body), "characterId"),
  ),
);

// PATCH/DELETE /:characterId/:otherId composite-join routes.
export const guardCharacterByParamCharacterId = guard((auth, req) =>
  assertCanWriteCharacter(auth, requireUuid(req.params.characterId)),
);

// PATCH/DELETE /:id where :id is an owned child's OWN id (resolve up to owner).
function guardCharacterChild(
  loader: (id: string) => Promise<string | null>,
): RequestHandler {
  return guard(async (auth, req) => {
    const characterId = await loader(requireUuid(req.params.id));
    if (!characterId) throw notFound();
    await assertCanWriteCharacter(auth, characterId);
  });
}

export const guardCharacterClassByParam =
  guardCharacterChild(characterIdOfClass);
export const guardSpellSlotByParam = guardCharacterChild(
  characterIdOfSpellSlot,
);
export const guardCharacterResourceByParam = guardCharacterChild(
  characterIdOfResource,
);
export const guardCharacterSkillByParam =
  guardCharacterChild(characterIdOfSkill);
export const guardProficiencyByParam = guardCharacterChild(
  characterIdOfProficiency,
);
export const guardCharacterConditionByParam = guardCharacterChild(
  characterIdOfCondition,
);

// --- Creature hub ----------------------------------------------------------

// POST creatures: campaignId in body may be null (=> shared catalog rule).
export const guardCreatureCreate = guard((auth, req) =>
  assertCanWriteCampaignScopedCreate(
    auth,
    optionalUuidField(asRecord(req.body), "campaignId") ?? null,
  ),
);

export const guardCreatureByParamId = guard(async (auth, req) => {
  await assertCanWriteCreature(auth, requireUuid(req.params.id));
  // A PATCH may also *move* the creature to another campaign (or into the
  // shared catalog). Authorize the target scope too, exactly as the location
  // guard below does. DELETE shares this guard and carries no body.
  if (req.body === undefined || req.body === null) return;
  const target = optionalUuidField(asRecord(req.body), "campaignId");
  if (target !== undefined) {
    await assertCanWriteCampaignScopedCreate(auth, target);
  }
});

export const guardCreatureByBody = guard((auth, req) =>
  assertCanWriteCreature(
    auth,
    requireUuidField(asRecord(req.body), "creatureId"),
  ),
);

function guardCreatureChild(
  loader: (id: string) => Promise<string | null>,
): RequestHandler {
  return guard(async (auth, req) => {
    const creatureId = await loader(requireUuid(req.params.id));
    if (!creatureId) throw notFound();
    await assertCanWriteCreature(auth, creatureId);
  });
}

export const guardStatBlockEntryByParam = guardCreatureChild(
  creatureIdOfStatBlockEntry,
);
export const guardCreatureSkillByParam = guardCreatureChild(
  creatureIdOfCreatureSkill,
);
export const guardCreatureDamageModifierByParam = guardCreatureChild(
  creatureIdOfDamageModifier,
);

// --- Creature placements ---------------------------------------------------
// A placement straddles two scopes, so BOTH ends are authorized: the creature
// (which may be a shared-catalog row any DM can write) and the location it is
// dropped into. Checking only the creature would let a DM place a shared
// monster inside another campaign's world.

export const guardCreaturePlacementCreate = guard(async (auth, req) => {
  const body = asRecord(req.body);
  await assertCanWriteCreature(auth, requireUuidField(body, "creatureId"));
  await assertCanWriteLocation(auth, requireUuidField(body, "locationId"));
});

export const guardCreaturePlacementByParams = guard(async (auth, req) => {
  await assertCanWriteCreature(auth, requireUuid(req.params.creatureId));
  await assertCanWriteLocation(auth, requireUuid(req.params.locationId));
});

// --- Locations -------------------------------------------------------------

export const guardLocationCreate = guard((auth, req) =>
  assertCanWriteCampaignScopedCreate(
    auth,
    optionalUuidField(asRecord(req.body), "campaignId") ?? null,
  ),
);

export const guardLocationByParamId = guard(async (auth, req) => {
  await assertCanWriteLocation(auth, requireUuid(req.params.id));
  // A PATCH may also *move* the location to another campaign. The check above
  // only covers the campaign it currently belongs to, so authorize the target
  // scope too — otherwise a DM could push their location into someone else's
  // campaign. DELETE shares this guard and carries no body, hence the presence
  // check.
  if (req.body === undefined || req.body === null) return;
  const target = optionalUuidField(asRecord(req.body), "campaignId");
  if (target !== undefined) {
    await assertCanWriteCampaignScopedCreate(auth, target);
  }
});

// --- Location per-item-type economy overrides -------------------------------

// PATCH/DELETE /location-item-economy/:locationId/:itemType — same rule as
// the location's own global sliders.
export const guardLocationItemEconomyByParams = guard((auth, req) =>
  assertCanWriteLocation(auth, requireUuid(req.params.locationId)),
);

// --- Inventory items (polymorphic owner) -----------------------------------

export const guardInventoryCreate = guard(async (auth, req) => {
  const body = asRecord(req.body);
  const characterId = optionalUuidField(body, "characterId");
  const creatureId = optionalUuidField(body, "creatureId");
  const locationId = optionalUuidField(body, "locationId");
  // Exactly one owner — mirrors the service/DB three-way XOR so a bad body
  // 400s here.
  const ownerCount = [characterId, creatureId, locationId].filter(
    (v) => v !== undefined,
  ).length;
  if (ownerCount !== 1) {
    throw badRequest();
  }
  if (characterId !== undefined) {
    await assertCanWriteCharacter(auth, characterId);
  } else if (creatureId !== undefined) {
    await assertCanWriteCreature(auth, creatureId);
  } else {
    await assertCanWriteLocation(auth, locationId as string);
  }
});

export const guardInventoryByParamId = guard(async (auth, req) => {
  const owner = await getInventoryItemOwner(requireUuid(req.params.id));
  if (!owner) throw notFound();
  if (owner.characterId) {
    await assertCanWriteCharacter(auth, owner.characterId);
  } else if (owner.creatureId) {
    await assertCanWriteCreature(auth, owner.creatureId);
  } else if (owner.locationId) {
    await assertCanWriteLocation(auth, owner.locationId);
  } else {
    throw notFound();
  }
});

// --- Shared catalogs (Item/Spell/Feat/Feature) -----------------------------

export const guardCatalog = guard((auth) => assertCanWriteCatalog(auth));

// --- Global-admin-only ------------------------------------------------------

export const guardAdmin = guard((auth) => assertAdmin(auth));

// --- Players ----------------------------------------------------------------

// PATCH /players/:id — a player may edit their OWN row (displayName, password);
// only an Admin may edit anyone else or change a `systemRole`.
export const guardPlayerUpdate = guard((auth, req) => {
  if (isAdmin(auth)) return;
  const body = asRecord(req.body);
  if (body.systemRole !== undefined) throw forbidden();
  if (requireUuid(req.params.id) !== auth.playerId) throw forbidden();
});

// --- Campaigns --------------------------------------------------------------

// PATCH/DELETE /campaigns/:id — Admin or a DM of that campaign.
export const guardCampaignByParamId = guard((auth, req) =>
  assertCanWriteCampaign(auth, requireUuid(req.params.id)),
);

// --- Campaign economy settings ----------------------------------------------

// PATCH /campaign-economy-settings/:campaignId — Admin or a DM of that campaign.
export const guardCampaignEconomySettingsByParamId = guard((auth, req) =>
  assertCanWriteCampaign(auth, requireUuid(req.params.campaignId)),
);

// --- Campaign memberships ---------------------------------------------------

// POST — Admin or a DM of the target campaign (from the body).
export const guardMembershipCreate = guard((auth, req) =>
  assertCanWriteCampaign(
    auth,
    requireUuidField(asRecord(req.body), "campaignId"),
  ),
);

// PATCH/DELETE /:id — resolve the membership's campaign, then the same rule.
export const guardMembershipByParamId = guard(async (auth, req) => {
  const campaignId = await campaignIdOfMembership(requireUuid(req.params.id));
  if (!campaignId) throw notFound();
  await assertCanWriteCampaign(auth, campaignId);
});
