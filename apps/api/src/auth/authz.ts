import { SystemRole } from "@prisma/client";
import { forbidden, notFound } from "../http/http-error.js";
import type { AuthContext } from "./auth.types.js";
import {
  getCharacterOwner,
  getCreatureCampaign,
  getLocationCampaign,
  isDmOf,
  isDmOfAny,
} from "./authz.queries.js";

// Authorization rules. Admin bypasses everything; otherwise authority comes
// from campaign DM-membership and/or character ownership. Every helper throws
// forbidden() (or notFound() when the target row is missing) so guards can just
// await them.

export function isAdmin(auth: AuthContext): boolean {
  return auth.systemRole === SystemRole.ADMIN;
}

export function assertAdmin(auth: AuthContext): void {
  if (!isAdmin(auth)) throw forbidden();
}

// Shared catalogs (Item/Spell/Feat/Feature and null-campaign Creatures/
// Locations): Admin or any DM. (Locked product decision.)
export async function assertCanWriteCatalog(auth: AuthContext): Promise<void> {
  if (isAdmin(auth)) return;
  if (await isDmOfAny(auth.playerId)) return;
  throw forbidden();
}

// A specific, existing campaign: Admin or a DM of THAT campaign.
export async function assertCanWriteCampaign(
  auth: AuthContext,
  campaignId: string,
): Promise<void> {
  if (isAdmin(auth)) return;
  if (await isDmOf(auth.playerId, campaignId)) return;
  throw forbidden();
}

// A campaign-scoped resource whose campaignId may be null (Creature/Location).
// null => shared catalog rule; non-null => that campaign's DM rule.
async function assertCanWriteCampaignScoped(
  auth: AuthContext,
  campaignId: string | null,
): Promise<void> {
  if (campaignId === null) {
    await assertCanWriteCatalog(auth);
    return;
  }
  await assertCanWriteCampaign(auth, campaignId);
}

// Creating a character: Admin, a DM of the target campaign, or a player drafting
// a character for THEMSELVES (playerId === self). An unassigned draft (no player
// and no campaign) is Admin-only.
export async function assertCanCreateCharacter(
  auth: AuthContext,
  target: { playerId: string | null; campaignId: string | null },
): Promise<void> {
  if (isAdmin(auth)) return;
  if (target.playerId !== null && target.playerId === auth.playerId) return;
  if (
    target.campaignId !== null &&
    (await isDmOf(auth.playerId, target.campaignId))
  ) {
    return;
  }
  throw forbidden();
}

// Mutating an existing character (or any of its owned children): Admin, the DM
// of the character's campaign, or the player who owns it.
export async function assertCanWriteCharacter(
  auth: AuthContext,
  characterId: string,
): Promise<void> {
  const owner = await getCharacterOwner(characterId);
  if (!owner) throw notFound();
  if (isAdmin(auth)) return;
  if (owner.playerId !== null && owner.playerId === auth.playerId) return;
  if (
    owner.campaignId !== null &&
    (await isDmOf(auth.playerId, owner.campaignId))
  ) {
    return;
  }
  throw forbidden();
}

// Mutating an existing creature (or its children): resolved via the creature's
// campaign (null => shared catalog rule).
export async function assertCanWriteCreature(
  auth: AuthContext,
  creatureId: string,
): Promise<void> {
  const creature = await getCreatureCampaign(creatureId);
  if (!creature) throw notFound();
  await assertCanWriteCampaignScoped(auth, creature.campaignId);
}

// Mutating an existing location: resolved via its campaign (null => catalog).
export async function assertCanWriteLocation(
  auth: AuthContext,
  locationId: string,
): Promise<void> {
  const location = await getLocationCampaign(locationId);
  if (!location) throw notFound();
  await assertCanWriteCampaignScoped(auth, location.campaignId);
}

// Creating a creature/location with a body-supplied campaignId (may be null).
export async function assertCanWriteCampaignScopedCreate(
  auth: AuthContext,
  campaignId: string | null,
): Promise<void> {
  await assertCanWriteCampaignScoped(auth, campaignId);
}
