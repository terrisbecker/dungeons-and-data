-- DropForeignKey
ALTER TABLE "CharacterFeat" DROP CONSTRAINT "CharacterFeat_featId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterFeature" DROP CONSTRAINT "CharacterFeature_featureId_fkey";

-- DropForeignKey
ALTER TABLE "CharacterSpell" DROP CONSTRAINT "CharacterSpell_spellId_fkey";

-- AddForeignKey
ALTER TABLE "CharacterSpell" ADD CONSTRAINT "CharacterSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeat" ADD CONSTRAINT "CharacterFeat_featId_fkey" FOREIGN KEY ("featId") REFERENCES "Feat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeature" ADD CONSTRAINT "CharacterFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
