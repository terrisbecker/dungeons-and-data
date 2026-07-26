import type { Ability, Skill, SkillProficiency } from "@dnd/shared";

// The 18 5e skills with their governing ability, and the proficiency tiers.
// Shared by the character sheet and the creature stat block — both list every
// skill with its computed modifier and add/remove proficiencies the same way.

export const SKILLS: { key: Skill; label: string; ability: Ability }[] = [
  { key: "ACROBATICS", label: "Acrobatics", ability: "DEX" },
  { key: "ANIMAL_HANDLING", label: "Animal Handling", ability: "WIS" },
  { key: "ARCANA", label: "Arcana", ability: "INT" },
  { key: "ATHLETICS", label: "Athletics", ability: "STR" },
  { key: "DECEPTION", label: "Deception", ability: "CHA" },
  { key: "HISTORY", label: "History", ability: "INT" },
  { key: "INSIGHT", label: "Insight", ability: "WIS" },
  { key: "INTIMIDATION", label: "Intimidation", ability: "CHA" },
  { key: "INVESTIGATION", label: "Investigation", ability: "INT" },
  { key: "MEDICINE", label: "Medicine", ability: "WIS" },
  { key: "NATURE", label: "Nature", ability: "INT" },
  { key: "PERCEPTION", label: "Perception", ability: "WIS" },
  { key: "PERFORMANCE", label: "Performance", ability: "CHA" },
  { key: "PERSUASION", label: "Persuasion", ability: "CHA" },
  { key: "RELIGION", label: "Religion", ability: "INT" },
  { key: "SLEIGHT_OF_HAND", label: "Sleight of Hand", ability: "DEX" },
  { key: "STEALTH", label: "Stealth", ability: "DEX" },
  { key: "SURVIVAL", label: "Survival", ability: "WIS" },
];

export const PROFICIENCY_ITEMS: Record<SkillProficiency, string> = {
  PROFICIENT: "Proficient",
  EXPERTISE: "Expertise",
  HALF: "Half",
};
