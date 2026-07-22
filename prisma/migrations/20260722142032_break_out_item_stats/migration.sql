-- CreateTable
CREATE TABLE "WeaponStats" (
    "itemId" UUID NOT NULL,
    "weaponCategory" "WeaponCategory" NOT NULL,
    "damageDice" TEXT NOT NULL,
    "damageType" "DamageType" NOT NULL,
    "versatileDamage" TEXT,
    "weaponProperties" "WeaponProperty"[],
    "rangeNormal" INTEGER,
    "rangeLong" INTEGER,

    CONSTRAINT "WeaponStats_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "ArmorStats" (
    "itemId" UUID NOT NULL,
    "armorCategory" "ArmorCategory" NOT NULL,
    "baseArmorClass" INTEGER NOT NULL,
    "addDexToArmorClass" BOOLEAN NOT NULL DEFAULT false,
    "maxDexBonus" INTEGER,
    "strengthRequirement" INTEGER,
    "stealthDisadvantage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ArmorStats_pkey" PRIMARY KEY ("itemId")
);

-- AddForeignKey
ALTER TABLE "WeaponStats" ADD CONSTRAINT "WeaponStats_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmorStats" ADD CONSTRAINT "ArmorStats_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill weapon satellites from the Item columns before they are dropped.
-- Rows missing any required stat are skipped (they keep only their base Item row).
INSERT INTO "WeaponStats" ("itemId", "weaponCategory", "damageDice", "damageType", "versatileDamage", "weaponProperties", "rangeNormal", "rangeLong")
SELECT "id", "weaponCategory", "damageDice", "damageType", "versatileDamage", COALESCE("weaponProperties", ARRAY[]::"WeaponProperty"[]), "rangeNormal", "rangeLong"
FROM "Item"
WHERE "type" = 'WEAPON'
  AND "weaponCategory" IS NOT NULL
  AND "damageDice" IS NOT NULL
  AND "damageType" IS NOT NULL;

-- Backfill armor satellites.
INSERT INTO "ArmorStats" ("itemId", "armorCategory", "baseArmorClass", "addDexToArmorClass", "maxDexBonus", "strengthRequirement", "stealthDisadvantage")
SELECT "id", "armorCategory", "baseArmorClass", COALESCE("addDexToArmorClass", false), "maxDexBonus", "strengthRequirement", "stealthDisadvantage"
FROM "Item"
WHERE "type" = 'ARMOR'
  AND "armorCategory" IS NOT NULL
  AND "baseArmorClass" IS NOT NULL;

-- DropColumn (type-specific stats now live in the satellite tables)
ALTER TABLE "Item" DROP COLUMN "weaponCategory",
DROP COLUMN "damageDice",
DROP COLUMN "damageType",
DROP COLUMN "versatileDamage",
DROP COLUMN "weaponProperties",
DROP COLUMN "rangeNormal",
DROP COLUMN "rangeLong",
DROP COLUMN "armorCategory",
DROP COLUMN "baseArmorClass",
DROP COLUMN "addDexToArmorClass",
DROP COLUMN "maxDexBonus",
DROP COLUMN "strengthRequirement",
DROP COLUMN "stealthDisadvantage";
