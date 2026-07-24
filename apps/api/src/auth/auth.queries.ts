import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

// Public projection — NEVER includes passwordHash. Reused by register's return
// value and anywhere a Player is surfaced from the auth layer.
export const playerPublicSelect = {
  id: true,
  username: true,
  displayName: true,
  systemRole: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlayerSelect;

// Login lookup — the ONLY query that reads passwordHash, so the hash never
// leaks into a response.
export function findPlayerForLogin(username: string) {
  return prisma.player.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      systemRole: true,
      passwordHash: true,
    },
  });
}

export function createPlayerAccount(data: Prisma.PlayerUncheckedCreateInput) {
  return prisma.player.create({ data, select: playerPublicSelect });
}

// The current player plus their campaign memberships — the "who am I" read.
// Memberships tell the frontend which campaigns the caller DMs (and thus what
// it may edit) without decoding the token or a second request.
export function findPlayerWithMemberships(id: string) {
  return prisma.player.findUnique({
    where: { id },
    select: {
      ...playerPublicSelect,
      memberships: {
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          campaign: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
}
