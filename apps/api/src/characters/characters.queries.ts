import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

// Explicit column selection so responses never leak columns we didn't intend.
// The full set of stored PlayerCharacter scalars, reused across reads.
const characterScalarSelect = {
  id: true,
  characterName: true,
  race: true,
  subrace: true,
  alignment: true,
  size: true,
  experiencePoints: true,
  inspiration: true,
  strength: true,
  dexterity: true,
  constitution: true,
  intelligence: true,
  wisdom: true,
  charisma: true,
  strengthSaveProf: true,
  dexteritySaveProf: true,
  constitutionSaveProf: true,
  intelligenceSaveProf: true,
  wisdomSaveProf: true,
  charismaSaveProf: true,
  maxHitPoints: true,
  currentHitPoints: true,
  temporaryHitPoints: true,
  hitPointMaxModifier: true,
  armorClass: true,
  deathSaveSuccesses: true,
  deathSaveFailures: true,
  speed: true,
  flySpeed: true,
  swimSpeed: true,
  climbSpeed: true,
  darkvision: true,
  concentratingOnSpellId: true,
  copper: true,
  silver: true,
  electrum: true,
  gold: true,
  platinum: true,
  description: true,
  background: true,
  traits: true,
  ideals: true,
  bonds: true,
  flaws: true,
  playerId: true,
  campaignId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerCharacterSelect;

// Lighter projection for list responses.
const characterListSelect = {
  id: true,
  characterName: true,
  race: true,
  subrace: true,
  alignment: true,
  size: true,
  maxHitPoints: true,
  currentHitPoints: true,
  armorClass: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerCharacterSelect;

// Core detail: scalars plus the two relations the derived-stats math needs.
// This is what GET /characters/:id returns — cheap and common.
const characterCoreSelect = {
  ...characterScalarSelect,
  classes: {
    select: {
      id: true,
      className: true,
      subclass: true,
      level: true,
      hitDieSize: true,
      hitDiceUsed: true,
      spellcastingAbility: true,
    },
  },
  skills: {
    select: { id: true, skill: true, proficiency: true },
  },
} satisfies Prisma.PlayerCharacterSelect;

// Full "virtual character sheet": core plus every other owned/related table.
// Explicitly opted into via GET /characters/:id/sheet so the common read above
// stays lean.
const characterSheetSelect = {
  ...characterCoreSelect,
  spellSlots: {
    orderBy: [{ isPact: "asc" }, { level: "asc" }],
    select: { id: true, level: true, max: true, used: true, isPact: true },
  },
  resources: {
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      current: true,
      max: true,
      rechargeOn: true,
    },
  },
  proficiencies: {
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, type: true, name: true },
  },
  conditions: {
    orderBy: { name: "asc" },
    select: { id: true, name: true, level: true, notes: true },
  },
  spells: {
    select: {
      known: true,
      prepared: true,
      alwaysPrepared: true,
      sourceClass: true,
      spell: {
        select: { id: true, name: true, level: true, school: true },
      },
    },
  },
  feats: {
    select: {
      feat: { select: { id: true, name: true, description: true } },
    },
  },
  features: {
    select: {
      notes: true,
      feature: { select: { id: true, name: true, source: true } },
    },
  },
  inventory: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      equipped: true,
      attuned: true,
      item: {
        select: {
          id: true,
          name: true,
          type: true,
          rarity: true,
          requiresAttunement: true,
        },
      },
    },
  },
} satisfies Prisma.PlayerCharacterSelect;

export function createCharacter(
  data: Prisma.PlayerCharacterUncheckedCreateInput,
) {
  return prisma.playerCharacter.create({
    data,
    select: characterScalarSelect,
  });
}

export function findCharacters(playerId?: string) {
  return prisma.playerCharacter.findMany({
    where: { deletedAt: null, ...(playerId ? { playerId } : {}) },
    orderBy: { createdAt: "desc" },
    select: characterListSelect,
  });
}

export function findCharacterCore(id: string) {
  return prisma.playerCharacter.findFirst({
    where: { id, deletedAt: null },
    select: characterCoreSelect,
  });
}

export function findCharacterSheet(id: string) {
  return prisma.playerCharacter.findFirst({
    where: { id, deletedAt: null },
    select: characterSheetSelect,
  });
}

export function updateCharacter(
  id: string,
  data: Prisma.PlayerCharacterUncheckedUpdateInput,
) {
  // Scope the write to non-deleted rows; updateMany returns a count so a missing
  // (or soft-deleted) id yields count 0 for the service to turn into a 404.
  return prisma.playerCharacter.updateMany({
    where: { id, deletedAt: null },
    data,
  });
}

export function softDeleteCharacter(id: string) {
  return prisma.playerCharacter.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export { characterScalarSelect };
