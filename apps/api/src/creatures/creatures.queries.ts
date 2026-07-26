import { type CreatureKind, Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { itemCatalogSelect } from "../items/items.queries.js";

// Explicit column selection so responses never leak columns we didn't intend.
// The full set of stored Creature scalars, reused across reads.
const creatureScalarSelect = {
  id: true,
  kind: true,
  name: true,
  description: true,
  size: true,
  creatureType: true,
  typeTags: true,
  alignment: true,
  alignmentNote: true,
  armorClass: true,
  armorClassNote: true,
  hitPoints: true,
  hitDice: true,
  speed: true,
  flySpeed: true,
  swimSpeed: true,
  climbSpeed: true,
  burrowSpeed: true,
  hover: true,
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
  darkvision: true,
  blindsight: true,
  blindBeyond: true,
  tremorsense: true,
  truesight: true,
  languages: true,
  conditionImmunities: true,
  challengeRating: true,
  experiencePoints: true,
  legendaryActionsPerRound: true,
  hasLair: true,
  environment: true,
  source: true,
  occupation: true,
  faction: true,
  race: true,
  campaignId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CreatureSelect;

// Lighter projection for list responses. campaignId is included so callers can
// tell a campaign-owned creature from a shared-catalog one without a second read.
const creatureListSelect = {
  id: true,
  kind: true,
  name: true,
  size: true,
  creatureType: true,
  alignment: true,
  armorClass: true,
  hitPoints: true,
  challengeRating: true,
  campaignId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CreatureSelect;

// Core detail: scalars plus the skills relation the derived-stats math needs.
// This is what GET /creatures/:id returns — cheap and common.
const creatureCoreSelect = {
  ...creatureScalarSelect,
  skills: {
    select: { id: true, skill: true, proficiency: true },
  },
} satisfies Prisma.CreatureSelect;

// Full stat block: core plus every other owned/related table. Explicitly opted
// into via GET /creatures/:id/sheet so the common read above stays lean.
const creatureSheetSelect = {
  ...creatureCoreSelect,
  entries: {
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      category: true,
      name: true,
      description: true,
      sortOrder: true,
      legendaryCost: true,
    },
  },
  damageModifiers: {
    select: { id: true, kind: true, damageType: true, note: true },
  },
  inventory: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      equipped: true,
      attuned: true,
      item: { select: itemCatalogSelect },
    },
  },
  placements: {
    select: {
      quantity: true,
      notes: true,
      location: { select: { id: true, locationName: true, type: true } },
    },
  },
} satisfies Prisma.CreatureSelect;

export function createCreature(data: Prisma.CreatureUncheckedCreateInput) {
  return prisma.creature.create({ data, select: creatureScalarSelect });
}

// Scoping a list read: a campaign's own creatures, the shared-catalog ones
// (campaignId null), or — the common case for a DM browsing a campaign — both.
// Passing no filter still returns every creature.
export interface CreatureListFilter {
  campaignId?: string;
  includeShared?: boolean;
  kind?: CreatureKind;
}

function creatureListWhere({
  campaignId,
  includeShared,
}: CreatureListFilter): Prisma.CreatureWhereInput | undefined {
  if (campaignId === undefined) {
    return includeShared ? { campaignId: null } : undefined;
  }
  return includeShared
    ? { OR: [{ campaignId }, { campaignId: null }] }
    : { campaignId };
}

export function findCreatures(filter: CreatureListFilter = {}) {
  const scope = creatureListWhere(filter);
  const kind = filter.kind === undefined ? undefined : { kind: filter.kind };
  return prisma.creature.findMany({
    where: scope && kind ? { AND: [scope, kind] } : (scope ?? kind),
    orderBy: { name: "asc" },
    select: creatureListSelect,
  });
}

export function findCreatureCore(id: string) {
  return prisma.creature.findUnique({
    where: { id },
    select: creatureCoreSelect,
  });
}

export function findCreatureSheet(id: string) {
  return prisma.creature.findUnique({
    where: { id },
    select: creatureSheetSelect,
  });
}

export function updateCreature(
  id: string,
  data: Prisma.CreatureUncheckedUpdateInput,
) {
  return prisma.creature.update({
    where: { id },
    data,
    select: creatureScalarSelect,
  });
}

export function deleteCreature(id: string) {
  return prisma.creature.delete({ where: { id } });
}
