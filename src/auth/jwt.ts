import jwt, { type SignOptions } from "jsonwebtoken";
import type { SystemRole } from "@prisma/client";
import { unauthorized } from "../http/http-error.js";
import type { AuthContext } from "./auth.types.js";

// Fail-fast env guard, mirroring src/db.ts. Relies on `dotenv/config` having run
// first in src/index.ts, exactly like the DATABASE_URL guard.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// Capture into a typed const so the narrowing survives into the closures below
// (TS does not carry module-scope narrowing into nested function scopes).
const JWT_SECRET: string = process.env.JWT_SECRET;

const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

// Payload shape stored in the token. `sub` is the playerId (JWT convention).
interface TokenPayload {
  sub: string;
  username: string;
  systemRole: SystemRole;
}

export function signToken(ctx: AuthContext): string {
  const payload: TokenPayload = {
    sub: ctx.playerId,
    username: ctx.username,
    systemRole: ctx.systemRole,
  };
  const options: SignOptions = {
    expiresIn: EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Verify a token and return the caller context. Any failure (expired, bad
// signature, malformed) surfaces as a 401 for the error middleware to render.
export function verifyToken(token: string): AuthContext {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw unauthorized();
  }
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as TokenPayload).sub !== "string" ||
    typeof (decoded as TokenPayload).username !== "string" ||
    typeof (decoded as TokenPayload).systemRole !== "string"
  ) {
    throw unauthorized();
  }
  const payload = decoded as TokenPayload;
  return {
    playerId: payload.sub,
    username: payload.username,
    systemRole: payload.systemRole,
  };
}
