import type { Ability, Skill } from "@prisma/client";

// Pure derived-value computation for a creature. Nothing here is stored in the
// DB — per CLAUDE.md these are functions of other columns and are computed on
// read to avoid drift. No Prisma access lives in this module. Mirrors
// characters.derived.ts, but a creature's proficiency bonus comes from its
// challenge rating (not class levels) and there is no spellcasting block.

// The six ability scores, keyed the way the Creature columns are named.
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// The saving-throw proficiency flags carried on Creature.
export interface SaveProficiencies {
  strengthSaveProf: boolean;
  dexteritySaveProf: boolean;
  constitutionSaveProf: boolean;
  intelligenceSaveProf: boolean;
  wisdomSaveProf: boolean;
  charismaSaveProf: boolean;
}

export interface DerivedInput extends AbilityScores, SaveProficiencies {
  // Normalized to a JS number by the service (the column is a Prisma Decimal);
  // null = unrated, treated as CR 0.
  challengeRating: number | null;
  skills: { skill: Skill; proficiency: "PROFICIENT" | "EXPERTISE" | "HALF" }[];
}

export interface DerivedStats {
  proficiencyBonus: number;
  initiative: number;
  abilityModifiers: Record<Ability, number>;
  savingThrows: Record<Ability, number>;
  skills: Record<Skill, number>;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
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

// 5e proficiency bonus by challenge rating: +2 up to CR 4, then +1 per 4 CR
// (CR 5–8 → +3, 9–12 → +4, ... 29–30 → +9). Fractional CRs (1/8, 1/4, 1/2) and
// an unrated creature (null → 0) all fall in the +2 band.
export function proficiencyBonusFromCR(cr: number): number {
  return cr < 5 ? 2 : Math.floor((cr - 1) / 4) + 2;
}

export function computeDerived(input: DerivedInput): DerivedStats {
  const profBonus = proficiencyBonusFromCR(input.challengeRating ?? 0);

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

  return {
    proficiencyBonus: profBonus,
    initiative: abilityModifiers.DEX,
    abilityModifiers,
    savingThrows,
    skills,
    passivePerception: 10 + skills.PERCEPTION,
    passiveInvestigation: 10 + skills.INVESTIGATION,
    passiveInsight: 10 + skills.INSIGHT,
  };
}
