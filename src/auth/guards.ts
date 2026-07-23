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

export const guardCreatureByParamId = guard((auth, req) =>
  assertCanWriteCreature(auth, requireUuid(req.params.id)),
);

export const guardCreatureByBody = guard((auth, req) =>
  assertCanWriteCreature(
    auth,
    requireUuidField(asRecord(req.body), "creatureId"),
  ),
);

export const guardCreatureByParamCreatureId = guard((auth, req) =>
  assertCanWriteCreature(auth, requireUuid(req.params.creatureId)),
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

// --- Locations -------------------------------------------------------------

export const guardLocationCreate = guard((auth, req) =>
  assertCanWriteCampaignScopedCreate(
    auth,
    optionalUuidField(asRecord(req.body), "campaignId") ?? null,
  ),
);

export const guardLocationByParamId = guard((auth, req) =>
  assertCanWriteLocation(auth, requireUuid(req.params.id)),
);

// --- Inventory items (polymorphic owner) -----------------------------------

export const guardInventoryCreate = guard(async (auth, req) => {
  const body = asRecord(req.body);
  const characterId = optionalUuidField(body, "characterId");
  const creatureId = optionalUuidField(body, "creatureId");
  // Exactly one owner — mirrors the service/DB XOR so a bad body 400s here.
  if ((characterId === undefined) === (creatureId === undefined)) {
    throw badRequest();
  }
  if (characterId !== undefined) {
    await assertCanWriteCharacter(auth, characterId);
  } else {
    await assertCanWriteCreature(auth, creatureId as string);
  }
});

export const guardInventoryByParamId = guard(async (auth, req) => {
  const owner = await getInventoryItemOwner(requireUuid(req.params.id));
  if (!owner) throw notFound();
  if (owner.characterId) {
    await assertCanWriteCharacter(auth, owner.characterId);
  } else if (owner.creatureId) {
    await assertCanWriteCreature(auth, owner.creatureId);
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
