import type { Ability, ArmorCategory, Skill } from "@prisma/client";

// Pure derived-value computation for a character. Nothing here is stored in the
// DB — per CLAUDE.md these are functions of other columns and are computed on
// read to avoid drift. No Prisma access lives in this module.

// The six ability scores, keyed the way the PlayerCharacter columns are named.
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// The saving-throw proficiency flags carried on PlayerCharacter.
export interface SaveProficiencies {
  strengthSaveProf: boolean;
  dexteritySaveProf: boolean;
  constitutionSaveProf: boolean;
  intelligenceSaveProf: boolean;
  wisdomSaveProf: boolean;
  charismaSaveProf: boolean;
}

// One equipped armor/shield item's satellite stats — the fields computeArmorClass
// needs, whichever query shape (lean core/list join, or the full sheet join) it
// was pulled from.
export interface EquippedArmorPiece {
  armorCategory: ArmorCategory;
  baseArmorClass: number;
  addDexToArmorClass: boolean;
  maxDexBonus: number | null;
}

export interface DerivedInput extends AbilityScores, SaveProficiencies {
  classes: {
    className: string;
    level: number;
    spellcastingAbility: Ability | null;
  }[];
  skills: { skill: Skill; proficiency: "PROFICIENT" | "EXPERTISE" | "HALF" }[];
  // null = no manual override; falls back to 10 + Dex modifier when unarmored.
  baseArmorClass: number | null;
  equippedArmor: EquippedArmorPiece[];
}

export interface DerivedStats {
  totalLevel: number;
  proficiencyBonus: number;
  initiative: number;
  abilityModifiers: Record<Ability, number>;
  savingThrows: Record<Ability, number>;
  skills: Record<Skill, number>;
  armorClass: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  spellcasting: {
    className: string;
    ability: Ability;
    saveDc: number;
    attackBonus: number;
  }[];
}

// Which ability governs each skill (5e).
const SKILL_ABILITY: Record<Skill, Ability> = {
  ACROBATICS: "DEX",
  ANIMAL_HANDLING: "WIS",
  ARCANA: "INT",
  ATHLETICS: "STR",
  DECEPTION: "CHA",
  HISTORY: "INT",
  INSIGHT: "WIS",
  INTIMIDATION: "CHA",
  INVESTIGATION: "INT",
  MEDICINE: "WIS",
  NATURE: "INT",
  PERCEPTION: "WIS",
  PERFORMANCE: "CHA",
  PERSUASION: "CHA",
  RELIGION: "INT",
  SLEIGHT_OF_HAND: "DEX",
  STEALTH: "DEX",
  SURVIVAL: "WIS",
};

const ALL_SKILLS = Object.keys(SKILL_ABILITY) as Skill[];

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function totalLevel(classes: { level: number }[]): number {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

// 5e armor class: the best equipped body armor (light/medium/heavy, Dex
// applied per its own cap) or the unarmored baseline (a manual
// baseArmorClass override, e.g. natural armor, or 10 + Dex), whichever is
// higher — then every equipped shield's bonus stacked on top. A creature/
// character normally has at most one of each equipped; this doesn't special-
// case more than that (just takes the best body piece and sums shields), so
// it degrades gracefully instead of crashing on invalid data.
export function computeArmorClass(
  dexMod: number,
  baseArmorClass: number | null,
  equippedArmor: EquippedArmorPiece[],
): number {
  const unarmored = baseArmorClass ?? 10 + dexMod;

  const bestBodyArmor = equippedArmor
    .filter((piece) => piece.armorCategory !== "SHIELD")
    .reduce((best, piece) => {
      const dexBonus = piece.addDexToArmorClass
        ? piece.maxDexBonus === null
          ? dexMod
          : Math.min(dexMod, piece.maxDexBonus)
        : 0;
      return Math.max(best, piece.baseArmorClass + dexBonus);
    }, -Infinity);

  const shieldBonus = equippedArmor
    .filter((piece) => piece.armorCategory === "SHIELD")
    .reduce((sum, piece) => sum + piece.baseArmorClass, 0);

  return Math.max(unarmored, bestBodyArmor) + shieldBonus;
}

// 5e proficiency bonus by character level. A level-0 (classless) character is
// treated as level 1 for this purpose.
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

export function computeDerived(input: DerivedInput): DerivedStats {
  const level = totalLevel(input.classes);
  const profBonus = proficiencyBonus(level);

  const abilityModifiers: Record<Ability, number> = {
    STR: abilityModifier(input.strength),
    DEX: abilityModifier(input.dexterity),
    CON: abilityModifier(input.constitution),
    INT: abilityModifier(input.intelligence),
    WIS: abilityModifier(input.wisdom),
    CHA: abilityModifier(input.charisma),
  };

  const savingThrows: Record<Ability, number> = {
    STR: abilityModifiers.STR + (input.strengthSaveProf ? profBonus : 0),
    DEX: abilityModifiers.DEX + (input.dexteritySaveProf ? profBonus : 0),
    CON: abilityModifiers.CON + (input.constitutionSaveProf ? profBonus : 0),
    INT: abilityModifiers.INT + (input.intelligenceSaveProf ? profBonus : 0),
    WIS: abilityModifiers.WIS + (input.wisdomSaveProf ? profBonus : 0),
    CHA: abilityModifiers.CHA + (input.charismaSaveProf ? profBonus : 0),
  };

  const skillProfByName = new Map(
    input.skills.map((s) => [s.skill, s.proficiency]),
  );

  const skills = {} as Record<Skill, number>;
  for (const skill of ALL_SKILLS) {
    const base = abilityModifiers[SKILL_ABILITY[skill]];
    const prof = skillProfByName.get(skill);
    let bonus = 0;
    if (prof === "PROFICIENT") {
      bonus = profBonus;
    } else if (prof === "EXPERTISE") {
      bonus = profBonus * 2;
    } else if (prof === "HALF") {
      bonus = Math.floor(profBonus / 2);
    }
    skills[skill] = base + bonus;
  }

  const spellcasting = input.classes
    .filter((c) => c.spellcastingAbility !== null)
    .map((c) => {
      const ability = c.spellcastingAbility as Ability;
      const mod = abilityModifiers[ability];
      return {
        className: c.className,
        ability,
        saveDc: 8 + profBonus + mod,
        attackBonus: profBonus + mod,
      };
    });

  return {
    totalLevel: level,
    proficiencyBonus: profBonus,
    initiative: abilityModifiers.DEX,
    abilityModifiers,
    savingThrows,
    skills,
    armorClass: computeArmorClass(
      abilityModifiers.DEX,
      input.baseArmorClass,
      input.equippedArmor,
    ),
    passivePerception: 10 + skills.PERCEPTION,
    passiveInvestigation: 10 + skills.INVESTIGATION,
    passiveInsight: 10 + skills.INSIGHT,
    spellcasting,
  };
}
