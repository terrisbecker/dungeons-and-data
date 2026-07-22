import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  characterId: true,
  spellId: true,
  known: true,
  prepared: true,
  alwaysPrepared: true,
  sourceClass: true,
  spell: { select: { id: true, name: true, level: true } },
} satisfies Prisma.CharacterSpellSelect;

export function createCharacterSpell(
  data: Prisma.CharacterSpellUncheckedCreateInput,
) {
  return prisma.characterSpell.create({ data, select });
}

export function findCharacterSpells(characterId: string) {
  return prisma.characterSpell.findMany({
    where: { characterId },
    select,
  });
}

export function findCharacterSpell(characterId: string, spellId: string) {
  return prisma.characterSpell.findUnique({
    where: { characterId_spellId: { characterId, spellId } },
    select,
  });
}

export function updateCharacterSpell(
  characterId: string,
  spellId: string,
  data: Prisma.CharacterSpellUncheckedUpdateInput,
) {
  return prisma.characterSpell.update({
    where: { characterId_spellId: { characterId, spellId } },
    data,
    select,
  });
}

export function deleteCharacterSpell(characterId: string, spellId: string) {
  return prisma.characterSpell.delete({
    where: { characterId_spellId: { characterId, spellId } },
  });
}
