-- CreateEnum
CREATE TYPE "Ability" AS ENUM ('STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA');

-- CreateEnum
CREATE TYPE "Alignment" AS ENUM ('LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE');

-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('ACROBATICS', 'ANIMAL_HANDLING', 'ARCANA', 'ATHLETICS', 'DECEPTION', 'HISTORY', 'INSIGHT', 'INTIMIDATION', 'INVESTIGATION', 'MEDICINE', 'NATURE', 'PERCEPTION', 'PERFORMANCE', 'PERSUASION', 'RELIGION', 'SLEIGHT_OF_HAND', 'STEALTH', 'SURVIVAL');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('PROFICIENT', 'EXPERTISE', 'HALF');

-- CreateEnum
CREATE TYPE "SpellSchool" AS ENUM ('ABJURATION', 'CONJURATION', 'DIVINATION', 'ENCHANTMENT', 'EVOCATION', 'ILLUSION', 'NECROMANCY', 'TRANSMUTATION');

-- CreateEnum
CREATE TYPE "FeatureSource" AS ENUM ('RACE', 'CLASS', 'SUBCLASS', 'BACKGROUND', 'FEAT');

-- CreateEnum
CREATE TYPE "RestType" AS ENUM ('SHORT', 'LONG', 'OTHER');

-- CreateEnum
CREATE TYPE "CreatureSize" AS ENUM ('TINY', 'SMALL', 'MEDIUM', 'LARGE', 'HUGE', 'GARGANTUAN');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('ADVENTURING_GEAR', 'WEAPON', 'ARMOR', 'AMMUNITION', 'POTION', 'SCROLL', 'WAND', 'ROD', 'STAFF', 'RING', 'WONDROUS_ITEM', 'TOOL', 'FOOD_AND_DRINK', 'TRADE_GOOD', 'CONTAINER', 'MOUNT_OR_VEHICLE', 'TREASURE', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'ARTIFACT');

-- CreateEnum
CREATE TYPE "WeaponCategory" AS ENUM ('SIMPLE', 'MARTIAL');

-- CreateEnum
CREATE TYPE "WeaponProperty" AS ENUM ('AMMUNITION', 'FINESSE', 'HEAVY', 'LIGHT', 'LOADING', 'RANGE', 'REACH', 'SPECIAL', 'THROWN', 'TWO_HANDED', 'VERSATILE');

-- CreateEnum
CREATE TYPE "ArmorCategory" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY', 'SHIELD');

-- CreateEnum
CREATE TYPE "DamageType" AS ENUM ('ACID', 'BLUDGEONING', 'COLD', 'FIRE', 'FORCE', 'LIGHTNING', 'NECROTIC', 'PIERCING', 'POISON', 'PSYCHIC', 'RADIANT', 'SLASHING', 'THUNDER');

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "locationName" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCharacter" (
    "id" UUID NOT NULL,
    "characterName" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "subrace" TEXT,
    "alignment" "Alignment",
    "size" "CreatureSize" NOT NULL DEFAULT 'MEDIUM',
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "inspiration" BOOLEAN NOT NULL DEFAULT false,
    "strength" SMALLINT NOT NULL,
    "dexterity" SMALLINT NOT NULL,
    "constitution" SMALLINT NOT NULL,
    "intelligence" SMALLINT NOT NULL,
    "wisdom" SMALLINT NOT NULL,
    "charisma" SMALLINT NOT NULL,
    "strengthSaveProf" BOOLEAN NOT NULL DEFAULT false,
    "dexteritySaveProf" BOOLEAN NOT NULL DEFAULT false,
    "constitutionSaveProf" BOOLEAN NOT NULL DEFAULT false,
    "intelligenceSaveProf" BOOLEAN NOT NULL DEFAULT false,
    "wisdomSaveProf" BOOLEAN NOT NULL DEFAULT false,
    "charismaSaveProf" BOOLEAN NOT NULL DEFAULT false,
    "maxHitPoints" INTEGER NOT NULL,
    "currentHitPoints" INTEGER NOT NULL,
    "temporaryHitPoints" INTEGER NOT NULL DEFAULT 0,
    "hitPointMaxModifier" INTEGER NOT NULL DEFAULT 0,
    "armorClass" INTEGER NOT NULL,
    "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "deathSaveFailures" INTEGER NOT NULL DEFAULT 0,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "flySpeed" INTEGER,
    "swimSpeed" INTEGER,
    "climbSpeed" INTEGER,
    "darkvision" INTEGER,
    "concentratingOnSpellId" UUID,
    "copper" INTEGER NOT NULL DEFAULT 0,
    "silver" INTEGER NOT NULL DEFAULT 0,
    "electrum" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "platinum" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "background" TEXT,
    "traits" TEXT,
    "playerId" UUID,
    "campaignId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "className" TEXT NOT NULL,
    "subclass" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "hitDieSize" INTEGER NOT NULL,
    "hitDiceUsed" INTEGER NOT NULL DEFAULT 0,
    "spellcastingAbility" "Ability",

    CONSTRAINT "CharacterClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpellSlot" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "isPact" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SpellSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterResource" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "current" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "rechargeOn" "RestType" NOT NULL DEFAULT 'LONG',

    CONSTRAINT "CharacterResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proficiency" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Proficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "skill" "Skill" NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'PROFICIENT',

    CONSTRAINT "CharacterSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL DEFAULT 'ADVENTURING_GEAR',
    "rarity" "ItemRarity" NOT NULL DEFAULT 'COMMON',
    "isMagic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "requiresAttunement" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "consumable" BOOLEAN NOT NULL DEFAULT false,
    "baseValueCp" INTEGER,
    "weaponCategory" "WeaponCategory",
    "damageDice" TEXT,
    "damageType" "DamageType",
    "versatileDamage" TEXT,
    "weaponProperties" "WeaponProperty"[],
    "rangeNormal" INTEGER,
    "rangeLong" INTEGER,
    "armorCategory" "ArmorCategory",
    "baseArmorClass" INTEGER,
    "addDexToArmorClass" BOOLEAN,
    "maxDexBonus" INTEGER,
    "strengthRequirement" INTEGER,
    "stealthDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "characterId" UUID,
    "npcId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "attuned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPC" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "NPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpcPlacement" (
    "npcId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "NpcPlacement_pkey" PRIMARY KEY ("npcId","locationId")
);

-- CreateTable
CREATE TABLE "MonsterPlacement" (
    "monsterId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "MonsterPlacement_pkey" PRIMARY KEY ("monsterId","locationId")
);

-- CreateTable
CREATE TABLE "Spell" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "school" "SpellSchool",
    "description" TEXT,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSpell" (
    "characterId" UUID NOT NULL,
    "spellId" UUID NOT NULL,
    "known" BOOLEAN NOT NULL DEFAULT true,
    "prepared" BOOLEAN NOT NULL DEFAULT false,
    "sourceClass" TEXT,

    CONSTRAINT "CharacterSpell_pkey" PRIMARY KEY ("characterId","spellId")
);

-- CreateTable
CREATE TABLE "Feat" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Feat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterFeat" (
    "characterId" UUID NOT NULL,
    "featId" UUID NOT NULL,

    CONSTRAINT "CharacterFeat_pkey" PRIMARY KEY ("characterId","featId")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" "FeatureSource" NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterFeature" (
    "characterId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "CharacterFeature_pkey" PRIMARY KEY ("characterId","featureId")
);

-- CreateTable
CREATE TABLE "CharacterCondition" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,
    "notes" TEXT,

    CONSTRAINT "CharacterCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "PlayerCharacter_playerId_idx" ON "PlayerCharacter"("playerId");

-- CreateIndex
CREATE INDEX "PlayerCharacter_campaignId_idx" ON "PlayerCharacter"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterClass_characterId_className_key" ON "CharacterClass"("characterId", "className");

-- CreateIndex
CREATE UNIQUE INDEX "SpellSlot_characterId_level_isPact_key" ON "SpellSlot"("characterId", "level", "isPact");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterResource_characterId_name_key" ON "CharacterResource"("characterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Proficiency_characterId_type_name_key" ON "Proficiency"("characterId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSkill_characterId_skill_key" ON "CharacterSkill"("characterId", "skill");

-- CreateIndex
CREATE INDEX "Item_type_idx" ON "Item"("type");

-- CreateIndex
CREATE INDEX "Item_rarity_idx" ON "Item"("rarity");

-- CreateIndex
CREATE INDEX "InventoryItem_itemId_idx" ON "InventoryItem"("itemId");

-- CreateIndex
CREATE INDEX "InventoryItem_characterId_idx" ON "InventoryItem"("characterId");

-- CreateIndex
CREATE INDEX "InventoryItem_npcId_idx" ON "InventoryItem"("npcId");

-- CreateIndex
CREATE UNIQUE INDEX "Spell_name_key" ON "Spell"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feat_name_key" ON "Feat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_source_key" ON "Feature"("name", "source");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterCondition_characterId_name_key" ON "CharacterCondition"("characterId", "name");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterClass" ADD CONSTRAINT "CharacterClass_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellSlot" ADD CONSTRAINT "SpellSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterResource" ADD CONSTRAINT "CharacterResource_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proficiency" ADD CONSTRAINT "Proficiency_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSkill" ADD CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpcPlacement" ADD CONSTRAINT "NpcPlacement_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "NPC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpcPlacement" ADD CONSTRAINT "NpcPlacement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterPlacement" ADD CONSTRAINT "MonsterPlacement_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterPlacement" ADD CONSTRAINT "MonsterPlacement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSpell" ADD CONSTRAINT "CharacterSpell_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSpell" ADD CONSTRAINT "CharacterSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeat" ADD CONSTRAINT "CharacterFeat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeat" ADD CONSTRAINT "CharacterFeat_featId_fkey" FOREIGN KEY ("featId") REFERENCES "Feat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeature" ADD CONSTRAINT "CharacterFeature_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeature" ADD CONSTRAINT "CharacterFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterCondition" ADD CONSTRAINT "CharacterCondition_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CHECK constraints (hand-added; Prisma has no native @check).
-- Keep these in sync with the schema comments in prisma/schema.prisma.
-- ---------------------------------------------------------------------------

-- Ability scores stay within the 5e range (1–30).
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_abilityScores_range_check" CHECK (
  "strength"     BETWEEN 1 AND 30 AND
  "dexterity"    BETWEEN 1 AND 30 AND
  "constitution" BETWEEN 1 AND 30 AND
  "intelligence" BETWEEN 1 AND 30 AND
  "wisdom"       BETWEEN 1 AND 30 AND
  "charisma"     BETWEEN 1 AND 30
);

-- An InventoryItem belongs to exactly one owner. Extend this list when
-- shopId/chestId owner columns are added.
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_single_owner_check" CHECK (
  (("characterId" IS NOT NULL)::int + ("npcId" IS NOT NULL)::int) = 1
);
