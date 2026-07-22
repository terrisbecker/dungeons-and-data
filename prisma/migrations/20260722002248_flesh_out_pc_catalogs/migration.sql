-- AlterTable
ALTER TABLE "CharacterSpell" ADD COLUMN     "alwaysPrepared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Feat" ADD COLUMN     "grantsAbilityScoreIncrease" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisite" TEXT,
ADD COLUMN     "repeatable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "level" INTEGER,
ADD COLUMN     "subtype" TEXT;

-- AlterTable
ALTER TABLE "PlayerCharacter" ADD COLUMN     "bonds" TEXT,
ADD COLUMN     "flaws" TEXT,
ADD COLUMN     "ideals" TEXT;

-- AlterTable
ALTER TABLE "Spell" ADD COLUMN     "castingTime" TEXT,
ADD COLUMN     "concentration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "damageType" "DamageType",
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "higherLevel" TEXT,
ADD COLUMN     "isAttack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "material" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "materialComponent" TEXT,
ADD COLUMN     "range" TEXT,
ADD COLUMN     "ritual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savingThrow" "Ability",
ADD COLUMN     "somatic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verbal" BOOLEAN NOT NULL DEFAULT false;
