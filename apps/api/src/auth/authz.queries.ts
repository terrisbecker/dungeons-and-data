import { CampaignRole } from "@prisma/client";
import { prisma } from "../db.js";

// Query layer for authorization. These resolve a resource up to the campaign /
// player that owns it, and answer DM-membership questions. Prisma lives here
// (never in the guards/service), matching the project's layer boundaries.

// --- Membership checks -----------------------------------------------------

export async function isDmOf(
  playerId: string,
  campaignId: string,
): Promise<boolean> {
  const membership = await prisma.campaignMembership.findUnique({
    where: { campaignId_playerId: { campaignId, playerId } },
    select: { role: true },
  });
  return membership?.role === CampaignRole.DUNGEON_MASTER;
}

// Is this player a DM of ANY campaign? Gates writes to the shared catalogs
// (Item/Spell/Feat/Feature and null-campaign Creatures/Locations).
export async function isDmOfAny(playerId: string): Promise<boolean> {
  const membership = await prisma.campaignMembership.findFirst({
    where: { playerId, role: CampaignRole.DUNGEON_MASTER },
    select: { id: true },
  });
  return membership !== null;
}

// --- Direct scope resolvers ------------------------------------------------

// Returns the owning { playerId, campaignId } of a character, or null if the
// character does not exist (soft-deleted characters are treated as absent).
export function getCharacterOwner(characterId: string) {
  return prisma.playerCharacter.findFirst({
    where: { id: characterId, deletedAt: null },
    select: { playerId: true, campaignId: true },
  });
}

export function getCreatureCampaign(creatureId: string) {
  return prisma.creature.findUnique({
    where: { id: creatureId },
    select: { campaignId: true },
  });
}

export function getLocationCampaign(locationId: string) {
  return prisma.location.findUnique({
    where: { id: locationId },
    select: { campaignId: true },
  });
}

// --- Child-row -> parent id resolvers --------------------------------------
// Each maps a child's own id up to the id of the character / creature that owns
// it, so a PATCH/DELETE by child id can be authorized.

async function characterIdOf(
  id: string,
  loader: (id: string) => Promise<{ characterId: string } | null>,
): Promise<string | null> {
  const row = await loader(id);
  return row?.characterId ?? null;
}

export function characterIdOfClass(id: string) {
  return characterIdOf(id, (id) =>
    prisma.characterClass.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

export function characterIdOfSpellSlot(id: string) {
  return characterIdOf(id, (id) =>
    prisma.spellSlot.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

export function characterIdOfResource(id: string) {
  return characterIdOf(id, (id) =>
    prisma.characterResource.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

export function characterIdOfSkill(id: string) {
  return characterIdOf(id, (id) =>
    prisma.characterSkill.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

export function characterIdOfProficiency(id: string) {
  return characterIdOf(id, (id) =>
    prisma.proficiency.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

export function characterIdOfCondition(id: string) {
  return characterIdOf(id, (id) =>
    prisma.characterCondition.findUnique({
      where: { id },
      select: { characterId: true },
    }),
  );
}

async function creatureIdOf(
  id: string,
  loader: (id: string) => Promise<{ creatureId: string } | null>,
): Promise<string | null> {
  const row = await loader(id);
  return row?.creatureId ?? null;
}

export function creatureIdOfStatBlockEntry(id: string) {
  return creatureIdOf(id, (id) =>
    prisma.statBlockEntry.findUnique({
      where: { id },
      select: { creatureId: true },
    }),
  );
}

export function creatureIdOfCreatureSkill(id: string) {
  return creatureIdOf(id, (id) =>
    prisma.creatureSkill.findUnique({
      where: { id },
      select: { creatureId: true },
    }),
  );
}

export function creatureIdOfDamageModifier(id: string) {
  return creatureIdOf(id, (id) =>
    prisma.creatureDamageModifier.findUnique({
      where: { id },
      select: { creatureId: true },
    }),
  );
}

// InventoryItem is polymorphic: exactly one of characterId / creatureId is set.
export function getInventoryItemOwner(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    select: { characterId: true, creatureId: true },
  });
}

// The campaign a membership belongs to, for authorizing role edits/removal.
export async function campaignIdOfMembership(
  id: string,
): Promise<string | null> {
  const row = await prisma.campaignMembership.findUnique({
    where: { id },
    select: { campaignId: true },
  });
  return row?.campaignId ?? null;
}
