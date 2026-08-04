-- armorClass becomes a service-layer derived value (computed from equipped
-- armor/shield InventoryItems + Dex, following 5e rules). The stored column
-- is renamed to baseArmorClass and made nullable: it now serves as a
-- fallback used when nothing is equipped (null = 10 + Dex) or a hand-set
-- override for AC the equipment formula can't express (natural armor,
-- class-feature-style AC). Renaming (not dropping) preserves existing data.

ALTER TABLE "PlayerCharacter" RENAME COLUMN "armorClass" TO "baseArmorClass";
ALTER TABLE "PlayerCharacter" ALTER COLUMN "baseArmorClass" DROP NOT NULL;

ALTER TABLE "Creature" RENAME COLUMN "armorClass" TO "baseArmorClass";
ALTER TABLE "Creature" ALTER COLUMN "baseArmorClass" DROP NOT NULL;
