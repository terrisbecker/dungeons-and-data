import type {
  Alignment,
  CreatureKind,
  CreatureSize,
  CreatureType,
  DamageModifierKind,
  StatBlockEntryCategory,
} from "@dnd/shared";

// Display labels for the creature enums. Plain data (no "use client") so the
// server-rendered stat block and the client forms can share one source — the
// Record<value, label> shape drops straight into <EnumSelect items={…}>.

export const CREATURE_KINDS: Record<CreatureKind, string> = {
  NPC: "NPC",
  MONSTER: "Monster",
};

export const CREATURE_SIZES: Record<CreatureSize, string> = {
  TINY: "Tiny",
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
  HUGE: "Huge",
  GARGANTUAN: "Gargantuan",
};

export const CREATURE_TYPES: Record<CreatureType, string> = {
  ABERRATION: "Aberration",
  BEAST: "Beast",
  CELESTIAL: "Celestial",
  CONSTRUCT: "Construct",
  DRAGON: "Dragon",
  ELEMENTAL: "Elemental",
  FEY: "Fey",
  FIEND: "Fiend",
  GIANT: "Giant",
  HUMANOID: "Humanoid",
  MONSTROSITY: "Monstrosity",
  OOZE: "Ooze",
  PLANT: "Plant",
  UNDEAD: "Undead",
};

export const ALIGNMENTS: Record<Alignment, string> = {
  LG: "Lawful Good",
  NG: "Neutral Good",
  CG: "Chaotic Good",
  LN: "Lawful Neutral",
  TN: "True Neutral",
  CN: "Chaotic Neutral",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CE: "Chaotic Evil",
};

export const DAMAGE_MODIFIER_KINDS: Record<DamageModifierKind, string> = {
  VULNERABILITY: "Vulnerability",
  RESISTANCE: "Resistance",
  IMMUNITY: "Immunity",
};

// Ordered as a Monster Manual stat block reads, top to bottom. The API already
// sorts entries by category, but that is enum order — this is the display order
// the stat block groups by.
export const STAT_BLOCK_CATEGORIES: Record<StatBlockEntryCategory, string> = {
  TRAIT: "Traits",
  ACTION: "Actions",
  BONUS_ACTION: "Bonus Actions",
  REACTION: "Reactions",
  LEGENDARY_ACTION: "Legendary Actions",
  MYTHIC_ACTION: "Mythic Actions",
  LAIR_ACTION: "Lair Actions",
  REGIONAL_EFFECT: "Regional Effects",
};

export const STAT_BLOCK_CATEGORY_ORDER = Object.keys(
  STAT_BLOCK_CATEGORIES,
) as StatBlockEntryCategory[];

// "1/4" reads better than "0.25" on a stat block, and both forms are accepted
// back — CR is the one number in the app that is written as a fraction.
export function formatChallengeRating(cr: number | null): string {
  if (cr === null) return "—";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

// Returns undefined when the text isn't a usable CR, so callers can report it.
export function parseChallengeRating(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? undefined : Number(fraction[1]) / denominator;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// The header line under a creature's name: "Large dragon (fire), chaotic evil".
export function creatureSubtitle(creature: {
  size: CreatureSize;
  creatureType: CreatureType | null;
  typeTags?: string[];
  alignment: Alignment | null;
  alignmentNote?: string | null;
}): string {
  const tags = creature.typeTags?.length
    ? ` (${creature.typeTags.join(", ")})`
    : "";
  const type = creature.creatureType
    ? CREATURE_TYPES[creature.creatureType].toLowerCase()
    : "creature";
  const alignment =
    creature.alignmentNote ??
    (creature.alignment ? ALIGNMENTS[creature.alignment].toLowerCase() : null);
  return [
    `${CREATURE_SIZES[creature.size]} ${type}${tags}`,
    ...(alignment ? [alignment] : []),
  ].join(", ");
}
