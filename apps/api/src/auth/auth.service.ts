import { unauthorized } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalString, requireString } from "../http/validate.js";
import {
  createPlayerAccount,
  findPlayerForLogin,
  findPlayerWithMemberships,
} from "./auth.queries.js";
import { signToken } from "./jwt.js";
import { hashPassword, verifyPassword } from "./password.js";

// Register a new account. Always creates a plain USER (systemRole defaults to
// USER); the Admin role is granted only via the seed or an existing Admin.
export async function registerService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const username = requireString(body, "username");
  const password = requireString(body, "password");
  const displayName = optionalString(body, "displayName");

  const passwordHash = await hashPassword(password);

  // Duplicate username -> P2002 -> 409 via mapPrismaError (which returns never,
  // so `player` stays correctly typed).
  const player = await createPlayerAccount({
    username,
    passwordHash,
    ...(displayName !== undefined ? { displayName } : {}),
  }).catch(mapPrismaError);

  const token = signToken({
    playerId: player.id,
    username: player.username,
    systemRole: player.systemRole,
  });
  return { token, player };
}

// Exchange username/password for a token. A missing user and a wrong password
// both surface as the same generic 401 (no account enumeration).
export async function loginService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const username = requireString(body, "username");
  const password = requireString(body, "password");

  const player = await findPlayerForLogin(username);
  if (!player || !(await verifyPassword(password, player.passwordHash))) {
    throw unauthorized();
  }

  const token = signToken({
    playerId: player.id,
    username: player.username,
    systemRole: player.systemRole,
  });
  return {
    token,
    player: {
      id: player.id,
      username: player.username,
      systemRole: player.systemRole,
    },
  };
}

// "Who am I" — the current player (public fields) plus their memberships. A
// valid token for a since-deleted account yields 401.
export async function meService(playerId: string) {
  const player = await findPlayerWithMemberships(playerId);
  if (!player) throw unauthorized();
  return player;
}
