import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

// Public projection — never exposes passwordHash.
const select = {
  id: true,
  username: true,
  displayName: true,
  systemRole: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerSelect;

export function findPlayers() {
  return prisma.player.findMany({ orderBy: { username: "asc" }, select });
}

export function findPlayerById(id: string) {
  return prisma.player.findUnique({ where: { id }, select });
}

export function updatePlayer(
  id: string,
  data: Prisma.PlayerUncheckedUpdateInput,
) {
  return prisma.player.update({ where: { id }, data, select });
}

export function deletePlayer(id: string) {
  return prisma.player.delete({ where: { id } });
}
