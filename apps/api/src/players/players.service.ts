import { Prisma, SystemRole } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalEnum, optionalString } from "../http/validate.js";
import { hashPassword } from "../auth/password.js";
import {
  deletePlayer,
  findPlayerById,
  findPlayers,
  updatePlayer,
} from "./players.queries.js";

const SYSTEM_ROLES = Object.values(SystemRole);

export function listPlayersService() {
  return findPlayers();
}

export async function getPlayerService(id: string) {
  const row = await findPlayerById(id);
  if (!row) throw notFound();
  return row;
}

// `systemRole` is only reachable here for Admins (the route guard blocks it for
// everyone else). `password`, when present, is re-hashed before storage.
export async function updatePlayerService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.PlayerUncheckedUpdateInput = {};

  const displayName = optionalString(body, "displayName");
  if (displayName !== undefined) data.displayName = displayName;

  const systemRole = optionalEnum(body, "systemRole", SYSTEM_ROLES);
  if (systemRole !== undefined) data.systemRole = systemRole;

  const password = optionalString(body, "password");
  if (password !== undefined) data.passwordHash = await hashPassword(password);

  try {
    return await updatePlayer(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deletePlayerService(id: string): Promise<void> {
  try {
    await deletePlayer(id);
  } catch (error) {
    mapPrismaError(error);
  }
}
