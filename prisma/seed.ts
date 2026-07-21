import "dotenv/config";
import {
  ArmorCategory,
  DamageType,
  FeatureSource,
  ItemType,
  SpellSchool,
  WeaponCategory,
  WeaponProperty,
} from "@prisma/client";
import { prisma } from "../src/db.js";

// Seeds five fully-featured test characters (plus the catalog rows they
// reference) so GET /characters/:id returns a populated "character sheet".
// Re-runnable: existing characters with these names are deleted first, which
// cascades to all their owned rows.

const CHARACTER_NAMES = [
  "Aria Nightbreeze",
  "Thorin Ironfist",
  "Luna Silverleaf",
  "Grommash Skullcrusher",
  "Pip Thistledown",
];

async function seedCatalog() {
  const spellDefs = [
    { name: "Fireball", level: 3, school: SpellSchool.EVOCATION },
    { name: "Magic Missile", level: 1, school: SpellSchool.EVOCATION },
    { name: "Mage Armor", level: 1, school: SpellSchool.ABJURATION },
    { name: "Shield", level: 1, school: SpellSchool.ABJURATION },
    { name: "Cure Wounds", level: 1, school: SpellSchool.EVOCATION },
    { name: "Bless", level: 1, school: SpellSchool.ENCHANTMENT },
  ];
  const spells: Record<string, string> = {};
  for (const s of spellDefs) {
    const row = await prisma.spell.upsert({
      where: { name: s.name },
      update: { level: s.level, school: s.school },
      create: s,
    });
    spells[s.name] = row.id;
  }

  const featDefs = [
    { name: "Great Weapon Master", description: "Bonus attack on crit/kill." },
    { name: "War Caster", description: "Advantage on concentration saves." },
    { name: "Alert", description: "+5 initiative; can't be surprised." },
    { name: "Lucky", description: "Three luck points to reroll." },
  ];
  const feats: Record<string, string> = {};
  for (const f of featDefs) {
    const row = await prisma.feat.upsert({
      where: { name: f.name },
      update: { description: f.description },
      create: f,
    });
    feats[f.name] = row.id;
  }

  const featureDefs = [
    { name: "Darkvision", source: FeatureSource.RACE },
    { name: "Arcane Tradition", source: FeatureSource.CLASS },
    { name: "Fighting Style: Defense", source: FeatureSource.CLASS },
    { name: "Second Wind", source: FeatureSource.CLASS },
    { name: "Channel Divinity", source: FeatureSource.CLASS },
    { name: "Disciple of Life", source: FeatureSource.SUBCLASS },
    { name: "Rage", source: FeatureSource.CLASS },
    { name: "Reckless Attack", source: FeatureSource.CLASS },
    { name: "Sneak Attack", source: FeatureSource.CLASS },
    { name: "Cunning Action", source: FeatureSource.CLASS },
  ];
  const features: Record<string, string> = {};
  for (const f of featureDefs) {
    const row = await prisma.feature.upsert({
      where: { name_source: { name: f.name, source: f.source } },
      update: {},
      create: f,
    });
    features[`${f.name}`] = row.id;
  }

  // Items have no unique constraint, so clear our named set before recreating.
  const itemDefs = [
    {
      name: "Dagger",
      type: ItemType.WEAPON,
      weaponCategory: WeaponCategory.SIMPLE,
      damageDice: "1d4",
      damageType: DamageType.PIERCING,
      weaponProperties: [
        WeaponProperty.FINESSE,
        WeaponProperty.LIGHT,
        WeaponProperty.THROWN,
      ],
      baseValueCp: 200,
    },
    {
      name: "Greataxe",
      type: ItemType.WEAPON,
      weaponCategory: WeaponCategory.MARTIAL,
      damageDice: "1d12",
      damageType: DamageType.SLASHING,
      weaponProperties: [WeaponProperty.HEAVY, WeaponProperty.TWO_HANDED],
      baseValueCp: 3000,
    },
    {
      name: "Mace",
      type: ItemType.WEAPON,
      weaponCategory: WeaponCategory.SIMPLE,
      damageDice: "1d6",
      damageType: DamageType.BLUDGEONING,
      baseValueCp: 500,
    },
    {
      name: "Shortbow",
      type: ItemType.WEAPON,
      weaponCategory: WeaponCategory.SIMPLE,
      damageDice: "1d6",
      damageType: DamageType.PIERCING,
      weaponProperties: [
        WeaponProperty.AMMUNITION,
        WeaponProperty.TWO_HANDED,
        WeaponProperty.RANGE,
      ],
      rangeNormal: 80,
      rangeLong: 320,
      baseValueCp: 2500,
    },
    {
      name: "Leather Armor",
      type: ItemType.ARMOR,
      armorCategory: ArmorCategory.LIGHT,
      baseArmorClass: 11,
      addDexToArmorClass: true,
      baseValueCp: 1000,
    },
    {
      name: "Chain Mail",
      type: ItemType.ARMOR,
      armorCategory: ArmorCategory.HEAVY,
      baseArmorClass: 16,
      strengthRequirement: 13,
      stealthDisadvantage: true,
      baseValueCp: 7500,
    },
    {
      name: "Shield",
      type: ItemType.ARMOR,
      armorCategory: ArmorCategory.SHIELD,
      baseArmorClass: 2,
      baseValueCp: 1000,
    },
    {
      name: "Potion of Healing",
      type: ItemType.POTION,
      consumable: true,
      stackable: true,
      baseValueCp: 5000,
    },
    {
      name: "Wand of Magic Missiles",
      type: ItemType.WAND,
      isMagic: true,
      requiresAttunement: false,
      baseValueCp: null,
    },
    { name: "Spellbook", type: ItemType.ADVENTURING_GEAR, baseValueCp: 5000 },
  ];
  await prisma.item.deleteMany({
    where: { name: { in: itemDefs.map((i) => i.name) } },
  });
  const items: Record<string, string> = {};
  for (const i of itemDefs) {
    const row = await prisma.item.create({ data: i });
    items[i.name] = row.id;
  }

  return { spells, feats, features, items };
}

type Catalog = Awaited<ReturnType<typeof seedCatalog>>;

async function seedCharacters(cat: Catalog) {
  // 1) Aria — High Elf Wizard 5 (INT caster)
  await prisma.playerCharacter.create({
    data: {
      characterName: "Aria Nightbreeze",
      race: "Elf",
      subrace: "High Elf",
      alignment: "CG",
      strength: 8,
      dexterity: 16,
      constitution: 14,
      intelligence: 18,
      wisdom: 12,
      charisma: 10,
      intelligenceSaveProf: true,
      wisdomSaveProf: true,
      maxHitPoints: 32,
      currentHitPoints: 32,
      armorClass: 12,
      darkvision: 60,
      gold: 120,
      silver: 30,
      classes: {
        create: [
          {
            className: "Wizard",
            subclass: "Evocation",
            level: 5,
            hitDieSize: 6,
            spellcastingAbility: "INT",
          },
        ],
      },
      skills: {
        create: [
          { skill: "ARCANA", proficiency: "EXPERTISE" },
          { skill: "INVESTIGATION", proficiency: "PROFICIENT" },
          { skill: "HISTORY", proficiency: "PROFICIENT" },
          { skill: "PERCEPTION", proficiency: "PROFICIENT" },
        ],
      },
      spellSlots: {
        create: [
          { level: 1, max: 4, used: 1 },
          { level: 2, max: 3, used: 0 },
          { level: 3, max: 2, used: 0 },
        ],
      },
      resources: {
        create: [
          { name: "Arcane Recovery", current: 1, max: 1, rechargeOn: "LONG" },
        ],
      },
      proficiencies: {
        create: [
          { type: "weapon", name: "Dagger" },
          { type: "tool", name: "Alchemist's Supplies" },
          { type: "language", name: "Elvish" },
        ],
      },
      spells: {
        create: [
          {
            spell: { connect: { id: cat.spells["Fireball"] } },
            prepared: true,
            sourceClass: "Wizard",
          },
          {
            spell: { connect: { id: cat.spells["Magic Missile"] } },
            prepared: true,
            sourceClass: "Wizard",
          },
          {
            spell: { connect: { id: cat.spells["Mage Armor"] } },
            prepared: true,
            sourceClass: "Wizard",
          },
          {
            spell: { connect: { id: cat.spells["Shield"] } },
            known: true,
            prepared: false,
            sourceClass: "Wizard",
          },
        ],
      },
      feats: {
        create: [{ feat: { connect: { id: cat.feats["War Caster"] } } }],
      },
      features: {
        create: [
          { feature: { connect: { id: cat.features["Darkvision"] } } },
          {
            feature: { connect: { id: cat.features["Arcane Tradition"] } },
            notes: "School of Evocation",
          },
        ],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Dagger"] } }, equipped: true },
          { item: { connect: { id: cat.items["Wand of Magic Missiles"] } } },
          {
            item: { connect: { id: cat.items["Potion of Healing"] } },
            quantity: 2,
          },
          { item: { connect: { id: cat.items["Spellbook"] } } },
        ],
      },
    },
  });

  // 2) Thorin — Mountain Dwarf Fighter 4 (Champion)
  await prisma.playerCharacter.create({
    data: {
      characterName: "Thorin Ironfist",
      race: "Dwarf",
      subrace: "Mountain Dwarf",
      alignment: "LG",
      strength: 16,
      dexterity: 12,
      constitution: 16,
      intelligence: 10,
      wisdom: 13,
      charisma: 8,
      strengthSaveProf: true,
      constitutionSaveProf: true,
      maxHitPoints: 44,
      currentHitPoints: 44,
      armorClass: 18,
      darkvision: 60,
      gold: 60,
      classes: {
        create: [
          {
            className: "Fighter",
            subclass: "Champion",
            level: 4,
            hitDieSize: 10,
          },
        ],
      },
      skills: {
        create: [
          { skill: "ATHLETICS", proficiency: "PROFICIENT" },
          { skill: "INTIMIDATION", proficiency: "PROFICIENT" },
          { skill: "PERCEPTION", proficiency: "PROFICIENT" },
        ],
      },
      resources: {
        create: [
          { name: "Second Wind", current: 1, max: 1, rechargeOn: "SHORT" },
          { name: "Action Surge", current: 1, max: 1, rechargeOn: "SHORT" },
        ],
      },
      proficiencies: {
        create: [
          { type: "armor", name: "Heavy Armor" },
          { type: "weapon", name: "Martial Weapons" },
          { type: "tool", name: "Smith's Tools" },
        ],
      },
      feats: {
        create: [
          { feat: { connect: { id: cat.feats["Great Weapon Master"] } } },
        ],
      },
      features: {
        create: [
          { feature: { connect: { id: cat.features["Darkvision"] } } },
          {
            feature: {
              connect: { id: cat.features["Fighting Style: Defense"] },
            },
          },
          { feature: { connect: { id: cat.features["Second Wind"] } } },
        ],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Greataxe"] } }, equipped: true },
          {
            item: { connect: { id: cat.items["Chain Mail"] } },
            equipped: true,
          },
          { item: { connect: { id: cat.items["Shield"] } }, equipped: true },
          { item: { connect: { id: cat.items["Potion of Healing"] } } },
        ],
      },
    },
  });

  // 3) Luna — Half-Elf Cleric 3 (Life Domain, WIS caster)
  await prisma.playerCharacter.create({
    data: {
      characterName: "Luna Silverleaf",
      race: "Half-Elf",
      alignment: "NG",
      strength: 12,
      dexterity: 10,
      constitution: 14,
      intelligence: 11,
      wisdom: 17,
      charisma: 13,
      wisdomSaveProf: true,
      charismaSaveProf: true,
      maxHitPoints: 24,
      currentHitPoints: 18,
      armorClass: 18,
      darkvision: 60,
      gold: 45,
      silver: 80,
      classes: {
        create: [
          {
            className: "Cleric",
            subclass: "Life Domain",
            level: 3,
            hitDieSize: 8,
            spellcastingAbility: "WIS",
          },
        ],
      },
      skills: {
        create: [
          { skill: "MEDICINE", proficiency: "PROFICIENT" },
          { skill: "INSIGHT", proficiency: "PROFICIENT" },
          { skill: "RELIGION", proficiency: "PROFICIENT" },
          { skill: "PERSUASION", proficiency: "PROFICIENT" },
        ],
      },
      spellSlots: {
        create: [
          { level: 1, max: 4, used: 1 },
          { level: 2, max: 2, used: 0 },
        ],
      },
      resources: {
        create: [
          { name: "Channel Divinity", current: 1, max: 1, rechargeOn: "SHORT" },
        ],
      },
      proficiencies: {
        create: [
          { type: "armor", name: "Heavy Armor" },
          { type: "language", name: "Celestial" },
        ],
      },
      spells: {
        create: [
          {
            spell: { connect: { id: cat.spells["Cure Wounds"] } },
            prepared: true,
            sourceClass: "Cleric",
          },
          {
            spell: { connect: { id: cat.spells["Bless"] } },
            prepared: true,
            sourceClass: "Cleric",
          },
        ],
      },
      features: {
        create: [
          { feature: { connect: { id: cat.features["Darkvision"] } } },
          { feature: { connect: { id: cat.features["Disciple of Life"] } } },
          { feature: { connect: { id: cat.features["Channel Divinity"] } } },
        ],
      },
      conditions: {
        create: [{ name: "blessed", notes: "+1d4 to attacks and saves" }],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Mace"] } }, equipped: true },
          {
            item: { connect: { id: cat.items["Chain Mail"] } },
            equipped: true,
          },
          { item: { connect: { id: cat.items["Shield"] } }, equipped: true },
          {
            item: { connect: { id: cat.items["Potion of Healing"] } },
            quantity: 3,
          },
        ],
      },
    },
  });

  // 4) Grommash — Half-Orc Barbarian 6 (Berserker)
  await prisma.playerCharacter.create({
    data: {
      characterName: "Grommash Skullcrusher",
      race: "Half-Orc",
      alignment: "CN",
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 8,
      wisdom: 10,
      charisma: 9,
      strengthSaveProf: true,
      constitutionSaveProf: true,
      maxHitPoints: 68,
      currentHitPoints: 55,
      temporaryHitPoints: 6,
      armorClass: 15,
      speed: 40,
      darkvision: 60,
      gold: 25,
      classes: {
        create: [
          {
            className: "Barbarian",
            subclass: "Berserker",
            level: 6,
            hitDieSize: 12,
          },
        ],
      },
      skills: {
        create: [
          { skill: "ATHLETICS", proficiency: "PROFICIENT" },
          { skill: "INTIMIDATION", proficiency: "PROFICIENT" },
          { skill: "SURVIVAL", proficiency: "PROFICIENT" },
          { skill: "PERCEPTION", proficiency: "PROFICIENT" },
        ],
      },
      resources: {
        create: [{ name: "Rage", current: 3, max: 4, rechargeOn: "LONG" }],
      },
      proficiencies: {
        create: [
          { type: "weapon", name: "Martial Weapons" },
          { type: "armor", name: "Shields" },
        ],
      },
      feats: {
        create: [
          { feat: { connect: { id: cat.feats["Great Weapon Master"] } } },
        ],
      },
      features: {
        create: [
          { feature: { connect: { id: cat.features["Darkvision"] } } },
          { feature: { connect: { id: cat.features["Rage"] } } },
          { feature: { connect: { id: cat.features["Reckless Attack"] } } },
        ],
      },
      conditions: {
        create: [
          {
            name: "raging",
            notes: "Resistance to bludgeoning/piercing/slashing",
          },
          { name: "exhaustion", level: 1 },
        ],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Greataxe"] } }, equipped: true },
          { item: { connect: { id: cat.items["Dagger"] } }, quantity: 2 },
          { item: { connect: { id: cat.items["Potion of Healing"] } } },
        ],
      },
    },
  });

  // 5) Pip — Lightfoot Halfling Rogue 4 (Thief)
  await prisma.playerCharacter.create({
    data: {
      characterName: "Pip Thistledown",
      race: "Halfling",
      subrace: "Lightfoot",
      alignment: "CG",
      strength: 8,
      dexterity: 18,
      constitution: 12,
      intelligence: 13,
      wisdom: 12,
      charisma: 14,
      dexteritySaveProf: true,
      intelligenceSaveProf: true,
      maxHitPoints: 27,
      currentHitPoints: 27,
      armorClass: 14,
      inspiration: true,
      gold: 200,
      electrum: 5,
      classes: {
        create: [
          { className: "Rogue", subclass: "Thief", level: 4, hitDieSize: 8 },
        ],
      },
      skills: {
        create: [
          { skill: "STEALTH", proficiency: "EXPERTISE" },
          { skill: "SLEIGHT_OF_HAND", proficiency: "EXPERTISE" },
          { skill: "ACROBATICS", proficiency: "PROFICIENT" },
          { skill: "PERCEPTION", proficiency: "PROFICIENT" },
          { skill: "INVESTIGATION", proficiency: "PROFICIENT" },
          { skill: "DECEPTION", proficiency: "PROFICIENT" },
        ],
      },
      proficiencies: {
        create: [
          { type: "tool", name: "Thieves' Tools" },
          { type: "weapon", name: "Shortsword" },
        ],
      },
      feats: {
        create: [
          { feat: { connect: { id: cat.feats["Alert"] } } },
          { feat: { connect: { id: cat.feats["Lucky"] } } },
        ],
      },
      features: {
        create: [
          {
            feature: { connect: { id: cat.features["Sneak Attack"] } },
            notes: "2d6",
          },
          { feature: { connect: { id: cat.features["Cunning Action"] } } },
        ],
      },
      inventory: {
        create: [
          {
            item: { connect: { id: cat.items["Dagger"] } },
            quantity: 2,
            equipped: true,
          },
          { item: { connect: { id: cat.items["Shortbow"] } } },
          {
            item: { connect: { id: cat.items["Leather Armor"] } },
            equipped: true,
          },
          { item: { connect: { id: cat.items["Potion of Healing"] } } },
        ],
      },
    },
  });
}

async function main() {
  await prisma.playerCharacter.deleteMany({
    where: { characterName: { in: CHARACTER_NAMES } },
  });
  const catalog = await seedCatalog();
  await seedCharacters(catalog);

  const created = await prisma.playerCharacter.findMany({
    where: { characterName: { in: CHARACTER_NAMES } },
    select: { id: true, characterName: true },
    orderBy: { characterName: "asc" },
  });
  console.log("Seeded characters:");
  for (const c of created) {
    console.log(`  ${c.id}  ${c.characterName}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
