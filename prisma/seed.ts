import "dotenv/config";
import {
  Ability,
  ArmorCategory,
  CreatureKind,
  CreatureSize,
  CreatureType,
  DamageModifierKind,
  DamageType,
  FeatureSource,
  ItemType,
  Prisma,
  SpellSchool,
  StatBlockEntryCategory,
  WeaponCategory,
  WeaponProperty,
} from "@prisma/client";
import { prisma } from "../src/db.js";

// Seeds a fully-populated test dataset that touches EVERY table: five
// character sheets (+ the catalog rows they reference), a nested Location
// hierarchy, and a roster of NPCs/monsters (Creatures) with full stat blocks,
// skills, damage modifiers, owned loot, and location placements.
// Re-runnable: rows created here are deleted (by name) first, cascading to all
// their owned children, so `npx tsx prisma/seed.ts` can be run repeatedly.

const CHARACTER_NAMES = [
  "Aria Nightbreeze",
  "Thorin Ironfist",
  "Luna Silverleaf",
  "Grommash Skullcrusher",
  "Pip Thistledown",
];

// Every location name the seed creates. The Location self-relation uses
// onDelete: SetNull (not Cascade), so deleting only the root would orphan its
// descendants rather than remove them — delete the whole set by name instead.
const LOCATION_NAMES = [
  "The Kingdom of Aldermere",
  "Silverpine Forest",
  "Thornwick",
  "The Gilded Anvil",
  "Emberpeak Mountains",
  "Dragon's Maw Cavern",
];

const CREATURE_NAMES = [
  "Seraphina Dawnbringer",
  "Grumblin Cogwhistle",
  "Ancient Red Dragon",
  "Goblin Cutthroat",
  "Shambling Zombie",
];

async function seedCatalog() {
  const spellDefs: Prisma.SpellCreateInput[] = [
    {
      name: "Fireball",
      level: 3,
      school: SpellSchool.EVOCATION,
      castingTime: "1 action",
      range: "150 feet",
      duration: "Instantaneous",
      verbal: true,
      somatic: true,
      material: true,
      materialComponent: "a tiny ball of bat guano and sulfur",
      savingThrow: Ability.DEX,
      damageType: DamageType.FIRE,
      higherLevel: "The damage increases by 1d6 for each slot level above 3rd.",
    },
    {
      name: "Magic Missile",
      level: 1,
      school: SpellSchool.EVOCATION,
      castingTime: "1 action",
      range: "120 feet",
      duration: "Instantaneous",
      verbal: true,
      somatic: true,
      damageType: DamageType.FORCE,
      higherLevel: "Creates one more dart for each slot level above 1st.",
    },
    {
      name: "Mage Armor",
      level: 1,
      school: SpellSchool.ABJURATION,
      castingTime: "1 action",
      range: "Touch",
      duration: "8 hours",
      verbal: true,
      somatic: true,
      material: true,
      materialComponent: "a piece of cured leather",
    },
    {
      name: "Shield",
      level: 1,
      school: SpellSchool.ABJURATION,
      castingTime: "1 reaction",
      range: "Self",
      duration: "1 round",
      verbal: true,
      somatic: true,
    },
    {
      name: "Cure Wounds",
      level: 1,
      school: SpellSchool.EVOCATION,
      castingTime: "1 action",
      range: "Touch",
      duration: "Instantaneous",
      verbal: true,
      somatic: true,
      higherLevel:
        "The healing increases by 1d8 for each slot level above 1st.",
    },
    {
      name: "Bless",
      level: 1,
      school: SpellSchool.ENCHANTMENT,
      castingTime: "1 action",
      range: "30 feet",
      duration: "Concentration, up to 1 minute",
      concentration: true,
      verbal: true,
      somatic: true,
      material: true,
      materialComponent: "a sprinkling of holy water",
    },
  ];
  const spells: Record<string, string> = {};
  for (const s of spellDefs) {
    const row = await prisma.spell.upsert({
      where: { name: s.name },
      update: s,
      create: s,
    });
    spells[s.name] = row.id;
  }

  const featDefs: Prisma.FeatCreateInput[] = [
    {
      name: "Great Weapon Master",
      description: "Bonus attack on crit/kill.",
    },
    {
      name: "War Caster",
      description: "Advantage on concentration saves.",
      prerequisite: "The ability to cast at least one spell",
    },
    { name: "Alert", description: "+5 initiative; can't be surprised." },
    {
      name: "Lucky",
      description: "Three luck points to reroll.",
      repeatable: true,
    },
    {
      name: "Resilient",
      description: "+1 to an ability score and proficiency in its saves.",
      grantsAbilityScoreIncrease: true,
    },
  ];
  const feats: Record<string, string> = {};
  for (const f of featDefs) {
    const row = await prisma.feat.upsert({
      where: { name: f.name },
      update: f,
      create: f,
    });
    feats[f.name] = row.id;
  }

  const featureDefs: Prisma.FeatureCreateInput[] = [
    { name: "Darkvision", source: FeatureSource.RACE, subtype: "Elf" },
    {
      name: "Arcane Tradition",
      source: FeatureSource.CLASS,
      level: 2,
      subtype: "Wizard",
    },
    {
      name: "Fighting Style: Defense",
      source: FeatureSource.CLASS,
      level: 1,
      subtype: "Fighter",
    },
    {
      name: "Second Wind",
      source: FeatureSource.CLASS,
      level: 1,
      subtype: "Fighter",
    },
    {
      name: "Channel Divinity",
      source: FeatureSource.CLASS,
      level: 2,
      subtype: "Cleric",
    },
    {
      name: "Disciple of Life",
      source: FeatureSource.SUBCLASS,
      level: 1,
      subtype: "Life Domain",
    },
    {
      name: "Rage",
      source: FeatureSource.CLASS,
      level: 1,
      subtype: "Barbarian",
    },
    {
      name: "Reckless Attack",
      source: FeatureSource.CLASS,
      level: 2,
      subtype: "Barbarian",
    },
    {
      name: "Sneak Attack",
      source: FeatureSource.CLASS,
      level: 1,
      subtype: "Rogue",
    },
    {
      name: "Cunning Action",
      source: FeatureSource.CLASS,
      level: 2,
      subtype: "Rogue",
    },
  ];
  const features: Record<string, string> = {};
  for (const f of featureDefs) {
    const row = await prisma.feature.upsert({
      where: { name_source: { name: f.name, source: f.source } },
      update: f,
      create: f,
    });
    features[`${f.name}`] = row.id;
  }

  // Items have no unique constraint, so clear our named set before recreating.
  // Weapon/armor stats live in 1:1 satellites, written via nested `create`.
  const itemDefs: Prisma.ItemCreateInput[] = [
    {
      name: "Dagger",
      type: ItemType.WEAPON,
      baseValueCp: 200,
      weapon: {
        create: {
          weaponCategory: WeaponCategory.SIMPLE,
          damageDice: "1d4",
          damageType: DamageType.PIERCING,
          weaponProperties: [
            WeaponProperty.FINESSE,
            WeaponProperty.LIGHT,
            WeaponProperty.THROWN,
          ],
        },
      },
    },
    {
      name: "Greataxe",
      type: ItemType.WEAPON,
      baseValueCp: 3000,
      weapon: {
        create: {
          weaponCategory: WeaponCategory.MARTIAL,
          damageDice: "1d12",
          damageType: DamageType.SLASHING,
          weaponProperties: [WeaponProperty.HEAVY, WeaponProperty.TWO_HANDED],
        },
      },
    },
    {
      name: "Mace",
      type: ItemType.WEAPON,
      baseValueCp: 500,
      weapon: {
        create: {
          weaponCategory: WeaponCategory.SIMPLE,
          damageDice: "1d6",
          damageType: DamageType.BLUDGEONING,
        },
      },
    },
    {
      name: "Shortbow",
      type: ItemType.WEAPON,
      baseValueCp: 2500,
      weapon: {
        create: {
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
        },
      },
    },
    {
      name: "Leather Armor",
      type: ItemType.ARMOR,
      baseValueCp: 1000,
      armor: {
        create: {
          armorCategory: ArmorCategory.LIGHT,
          baseArmorClass: 11,
          addDexToArmorClass: true,
        },
      },
    },
    {
      name: "Chain Mail",
      type: ItemType.ARMOR,
      baseValueCp: 7500,
      armor: {
        create: {
          armorCategory: ArmorCategory.HEAVY,
          baseArmorClass: 16,
          strengthRequirement: 13,
          stealthDisadvantage: true,
        },
      },
    },
    {
      name: "Shield",
      type: ItemType.ARMOR,
      baseValueCp: 1000,
      armor: {
        create: {
          armorCategory: ArmorCategory.SHIELD,
          baseArmorClass: 2,
        },
      },
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
      traits: "Speaks in riddles; always sketching arcane diagrams.",
      ideals: "Knowledge. The pursuit of magical understanding is sacred.",
      bonds: "My spellbook holds a decade of research I would die to protect.",
      flaws: "I overlook danger when a new mystery presents itself.",
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
            alwaysPrepared: true, // Life Domain spell — always prepared
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
      traits: "Loud, blunt, and quick to laugh or to anger.",
      ideals: "Might. The strong are meant to rule the weak.",
      bonds: "My tribe was scattered; I fight to see them whole again.",
      flaws: "I answer nearly every insult with my axe.",
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

// Builds a nested Location hierarchy (realm -> region -> town -> building)
// using the self-referencing parent/children relation. Returns a name->id map
// so creatures can be placed into specific locations.
async function seedLocations() {
  const realm = await prisma.location.create({
    data: {
      locationName: "The Kingdom of Aldermere",
      type: "realm",
      description: "A temperate human kingdom ringed by forest and mountains.",
      children: {
        create: [
          {
            locationName: "Silverpine Forest",
            type: "region",
            description: "Ancient pine woods, home to elves and worse.",
            children: {
              create: [
                {
                  locationName: "Thornwick",
                  type: "town",
                  description: "A walled trading town on the forest's edge.",
                  children: {
                    create: [
                      {
                        locationName: "The Gilded Anvil",
                        type: "building",
                        description: "The town smithy and general store.",
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            locationName: "Emberpeak Mountains",
            type: "region",
            description: "Volcanic peaks veined with old dwarven roads.",
            children: {
              create: [
                {
                  locationName: "Dragon's Maw Cavern",
                  type: "dungeon",
                  description:
                    "A lava-lit cave system and ancient wyrm's lair.",
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Flatten the tree we just made into a name -> id lookup.
  const all = await prisma.location.findMany({
    select: { id: true, locationName: true },
  });
  const byName: Record<string, string> = {};
  for (const l of all) {
    byName[l.locationName] = l.id;
  }
  // Touch `realm` so the create result is used (root of the tree above).
  byName["The Kingdom of Aldermere"] = realm.id;
  return byName;
}

type Locations = Awaited<ReturnType<typeof seedLocations>>;

// Seeds the Creature roster (NPCs + monsters) with the full stat-block graph:
// StatBlockEntry rows across categories, CreatureSkill, CreatureDamageModifier,
// creature-owned InventoryItem, and CreaturePlacement links into locations.
async function seedCreatures(cat: Catalog, loc: Locations) {
  // 1) Seraphina — NPC, the town smith/cleric who runs The Gilded Anvil.
  await prisma.creature.create({
    data: {
      kind: CreatureKind.NPC,
      name: "Seraphina Dawnbringer",
      description: "A silver-haired half-elf smith blessed by the Dawnfather.",
      size: CreatureSize.MEDIUM,
      creatureType: CreatureType.HUMANOID,
      typeTags: ["half-elf"],
      alignment: "LG",
      armorClass: 18,
      armorClassNote: "chain mail, shield",
      hitPoints: 39,
      hitDice: "6d8 + 12",
      speed: 30,
      strength: 16,
      dexterity: 10,
      constitution: 14,
      intelligence: 12,
      wisdom: 16,
      charisma: 14,
      wisdomSaveProf: true,
      charismaSaveProf: true,
      darkvision: 60,
      languages: "Common, Elvish, Celestial",
      occupation: "Blacksmith & Cleric",
      faction: "Order of the Dawn",
      race: "Half-Elf",
      skills: {
        create: [
          { skill: "MEDICINE", proficiency: "PROFICIENT" },
          { skill: "INSIGHT", proficiency: "PROFICIENT" },
          { skill: "PERSUASION", proficiency: "EXPERTISE" },
        ],
      },
      entries: {
        create: [
          {
            category: StatBlockEntryCategory.TRAIT,
            name: "Spellcasting",
            description:
              "Seraphina is a 6th-level spellcaster (Wisdom; save DC 14). She has cure wounds, bless, and spiritual weapon prepared.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Warhammer",
            description:
              "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 3) bludgeoning damage.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.REACTION,
            name: "Protective Blessing",
            description:
              "When an ally within 30 ft. is hit, Seraphina grants them a +2 bonus to AC against that attack.",
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Mace"] } }, equipped: true },
          {
            item: { connect: { id: cat.items["Chain Mail"] } },
            equipped: true,
          },
          { item: { connect: { id: cat.items["Shield"] } }, equipped: true },
        ],
      },
      placements: {
        create: [
          {
            location: { connect: { id: loc["The Gilded Anvil"] } },
            quantity: 1,
            notes: "Works the forge from dawn till dusk.",
          },
        ],
      },
    },
  });

  // 2) Grumblin — NPC gnome tinkerer/shopkeeper in Thornwick.
  await prisma.creature.create({
    data: {
      kind: CreatureKind.NPC,
      name: "Grumblin Cogwhistle",
      description: "A soot-stained gnome who sells potions and oddments.",
      size: CreatureSize.SMALL,
      creatureType: CreatureType.HUMANOID,
      typeTags: ["gnome"],
      alignment: "CN",
      armorClass: 12,
      hitPoints: 22,
      hitDice: "5d6 + 5",
      speed: 25,
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 17,
      wisdom: 11,
      charisma: 13,
      intelligenceSaveProf: true,
      darkvision: 60,
      languages: "Common, Gnomish",
      occupation: "Alchemist & Merchant",
      faction: "Thornwick Traders' Guild",
      race: "Rock Gnome",
      skills: {
        create: [
          { skill: "ARCANA", proficiency: "PROFICIENT" },
          { skill: "SLEIGHT_OF_HAND", proficiency: "PROFICIENT" },
        ],
      },
      entries: {
        create: [
          {
            category: StatBlockEntryCategory.TRAIT,
            name: "Gnome Cunning",
            description:
              "Advantage on Intelligence, Wisdom, and Charisma saving throws against magic.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Dagger",
            description:
              "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.BONUS_ACTION,
            name: "Toss Alchemist's Fire",
            description:
              "Grumblin hurls a flask at a point within 20 ft.; each creature within 5 ft. takes 3 (1d6) fire damage.",
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: [
          { item: { connect: { id: cat.items["Dagger"] } }, equipped: true },
          {
            item: { connect: { id: cat.items["Potion of Healing"] } },
            quantity: 8,
          },
        ],
      },
      placements: {
        create: [
          {
            location: { connect: { id: loc["Thornwick"] } },
            quantity: 1,
            notes: "Runs a cluttered shop off the market square.",
          },
        ],
      },
    },
  });

  // 3) Ancient Red Dragon — MONSTER, legendary + lair, full stat block.
  await prisma.creature.create({
    data: {
      kind: CreatureKind.MONSTER,
      name: "Ancient Red Dragon",
      description: "A colossal wyrm wreathed in smoke and molten fury.",
      size: CreatureSize.GARGANTUAN,
      creatureType: CreatureType.DRAGON,
      alignment: "CE",
      armorClass: 22,
      armorClassNote: "natural armor",
      hitPoints: 546,
      hitDice: "28d20 + 252",
      speed: 40,
      flySpeed: 80,
      climbSpeed: 40,
      strength: 30,
      dexterity: 10,
      constitution: 29,
      intelligence: 18,
      wisdom: 15,
      charisma: 23,
      dexteritySaveProf: true,
      constitutionSaveProf: true,
      wisdomSaveProf: true,
      charismaSaveProf: true,
      blindsight: 60,
      darkvision: 120,
      languages: "Common, Draconic",
      conditionImmunities: [],
      challengeRating: "24",
      experiencePoints: 62000,
      legendaryActionsPerRound: 3,
      hasLair: true,
      environment: ["Mountain"],
      source: "Monster Manual",
      skills: {
        create: [
          { skill: "PERCEPTION", proficiency: "EXPERTISE" },
          { skill: "STEALTH", proficiency: "PROFICIENT" },
        ],
      },
      damageModifiers: {
        create: [
          { kind: DamageModifierKind.IMMUNITY, damageType: DamageType.FIRE },
        ],
      },
      entries: {
        create: [
          {
            category: StatBlockEntryCategory.TRAIT,
            name: "Legendary Resistance (3/Day)",
            description:
              "If the dragon fails a saving throw, it can choose to succeed instead.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Multiattack",
            description:
              "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Fire Breath (Recharge 5–6)",
            description:
              "The dragon exhales fire in a 90-foot cone. Each creature makes a DC 24 Dexterity save, taking 91 (26d6) fire damage on a failure, or half as much on a success.",
            sortOrder: 1,
          },
          {
            category: StatBlockEntryCategory.LEGENDARY_ACTION,
            name: "Tail Attack",
            description: "The dragon makes a tail attack.",
            sortOrder: 0,
            legendaryCost: 1,
          },
          {
            category: StatBlockEntryCategory.LEGENDARY_ACTION,
            name: "Wing Attack (Costs 2 Actions)",
            description:
              "The dragon beats its wings. Each creature within 15 ft. must succeed on a DC 25 Dexterity save or take 15 (2d6 + 8) bludgeoning damage and be knocked prone.",
            sortOrder: 1,
            legendaryCost: 2,
          },
          {
            category: StatBlockEntryCategory.LAIR_ACTION,
            name: "Magma Eruption",
            description:
              "Magma erupts from a point on the ground the dragon can see within 120 ft.; each creature within 20 ft. makes a DC 15 Dexterity save or takes 21 (6d6) fire damage.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.REGIONAL_EFFECT,
            name: "Sulfurous Haze",
            description:
              "The region within 6 miles of the lair is wreathed in ash and smoke, lightly obscuring the air.",
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: [
          {
            item: { connect: { id: cat.items["Wand of Magic Missiles"] } },
            quantity: 1,
          },
          {
            item: { connect: { id: cat.items["Potion of Healing"] } },
            quantity: 12,
          },
        ],
      },
      placements: {
        create: [
          {
            location: { connect: { id: loc["Dragon's Maw Cavern"] } },
            quantity: 1,
            notes: "Sleeps atop a mound of gold in the deepest chamber.",
          },
        ],
      },
    },
  });

  // 4) Goblin — low-CR MONSTER, packs the forest.
  await prisma.creature.create({
    data: {
      kind: CreatureKind.MONSTER,
      name: "Goblin Cutthroat",
      description: "A small, wiry raider with a wicked scimitar.",
      size: CreatureSize.SMALL,
      creatureType: CreatureType.HUMANOID,
      typeTags: ["goblinoid"],
      alignment: "NE",
      armorClass: 15,
      armorClassNote: "leather armor, shield",
      hitPoints: 7,
      hitDice: "2d6",
      speed: 30,
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8,
      darkvision: 60,
      languages: "Common, Goblin",
      challengeRating: "0.25",
      experiencePoints: 50,
      environment: ["Forest", "Underdark"],
      source: "Monster Manual",
      skills: {
        create: [{ skill: "STEALTH", proficiency: "EXPERTISE" }],
      },
      entries: {
        create: [
          {
            category: StatBlockEntryCategory.BONUS_ACTION,
            name: "Nimble Escape",
            description: "The goblin takes the Disengage or Hide action.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Scimitar",
            description:
              "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
            sortOrder: 0,
          },
        ],
      },
      inventory: {
        create: [
          {
            item: { connect: { id: cat.items["Leather Armor"] } },
            equipped: true,
          },
        ],
      },
      placements: {
        create: [
          {
            location: { connect: { id: loc["Silverpine Forest"] } },
            quantity: 8,
            notes: "A raiding band that ambushes the forest road.",
          },
        ],
      },
    },
  });

  // 5) Zombie — MONSTER with a poison immunity and condition immunity.
  await prisma.creature.create({
    data: {
      kind: CreatureKind.MONSTER,
      name: "Shambling Zombie",
      description: "A rotting corpse animated by dark magic.",
      size: CreatureSize.MEDIUM,
      creatureType: CreatureType.UNDEAD,
      alignment: "NE",
      alignmentNote: "neutral evil",
      armorClass: 8,
      hitPoints: 22,
      hitDice: "3d8 + 9",
      speed: 20,
      strength: 13,
      dexterity: 6,
      constitution: 16,
      intelligence: 3,
      wisdom: 6,
      charisma: 5,
      wisdomSaveProf: true,
      darkvision: 60,
      languages: "understands the languages it knew in life but can't speak",
      conditionImmunities: ["poisoned"],
      challengeRating: "0.25",
      experiencePoints: 50,
      environment: ["Urban", "Dungeon"],
      source: "Monster Manual",
      damageModifiers: {
        create: [
          { kind: DamageModifierKind.IMMUNITY, damageType: DamageType.POISON },
          {
            kind: DamageModifierKind.VULNERABILITY,
            damageType: DamageType.RADIANT,
            note: "turned or seared by holy power",
          },
        ],
      },
      entries: {
        create: [
          {
            category: StatBlockEntryCategory.TRAIT,
            name: "Undead Fortitude",
            description:
              "If damage reduces the zombie to 0 HP, it makes a Constitution save (DC 5 + damage) to drop to 1 HP instead, unless the damage is radiant or from a critical hit.",
            sortOrder: 0,
          },
          {
            category: StatBlockEntryCategory.ACTION,
            name: "Slam",
            description:
              "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.",
            sortOrder: 0,
          },
        ],
      },
      placements: {
        create: [
          {
            location: { connect: { id: loc["Dragon's Maw Cavern"] } },
            quantity: 4,
            notes: "Shuffle through the outer tunnels as guardians.",
          },
        ],
      },
    },
  });
}

async function main() {
  // Clear previously seeded rows (cascades to owned children). Creatures cascade
  // to entries/skills/damage modifiers/inventory/placements; characters cascade
  // to their owned rows. Locations are deleted by the full name set because the
  // hierarchy self-relation is SetNull, not Cascade (see LOCATION_NAMES).
  await prisma.playerCharacter.deleteMany({
    where: { characterName: { in: CHARACTER_NAMES } },
  });
  await prisma.creature.deleteMany({
    where: { name: { in: CREATURE_NAMES } },
  });
  await prisma.location.deleteMany({
    where: { locationName: { in: LOCATION_NAMES } },
  });

  const catalog = await seedCatalog();
  await seedCharacters(catalog);
  const locations = await seedLocations();
  await seedCreatures(catalog, locations);

  const created = await prisma.playerCharacter.findMany({
    where: { characterName: { in: CHARACTER_NAMES } },
    select: { id: true, characterName: true },
    orderBy: { characterName: "asc" },
  });
  console.log("Seeded characters:");
  for (const c of created) {
    console.log(`  ${c.id}  ${c.characterName}`);
  }

  const creatures = await prisma.creature.findMany({
    where: { name: { in: CREATURE_NAMES } },
    select: { id: true, name: true, kind: true },
    orderBy: { name: "asc" },
  });
  console.log("Seeded creatures:");
  for (const c of creatures) {
    console.log(`  ${c.id}  [${c.kind}] ${c.name}`);
  }

  const locs = await prisma.location.findMany({
    select: { id: true, locationName: true },
    orderBy: { locationName: "asc" },
  });
  console.log("Seeded locations:");
  for (const l of locs) {
    console.log(`  ${l.id}  ${l.locationName}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
