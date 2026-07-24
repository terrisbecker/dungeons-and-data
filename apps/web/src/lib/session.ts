import { cookies } from "next/headers";
import type { SystemRole } from "@dnd/shared";
import { SESSION_COOKIE, sessionCookieOptions } from "./session-config";

// Server-side session helpers. The JWT lives in an httpOnly cookie the browser's
// JS can never read; only these server helpers (and the proxy) touch it.

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

// Claims the API bakes into the JWT (see apps/api/src/auth/jwt.ts): `sub` is the
// playerId. These are read WITHOUT verifying the signature — only ever to fire a
// parallel read the API itself re-authorizes (e.g. fetching a page's data with
// the playerId while /auth/me loads in parallel), never as an auth decision. A
// forged cookie just makes the accompanying authenticated API call 401.
export interface SessionClaims {
  playerId: string;
  username: string;
  systemRole: SystemRole;
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const token = await getToken();
  if (!token) return null;
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return null;
  try {
    const json = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof payload.sub === "string" &&
      typeof payload.username === "string" &&
      typeof payload.systemRole === "string"
    ) {
      return {
        playerId: payload.sub,
        username: payload.username,
        systemRole: payload.systemRole as SystemRole,
      };
    }
  } catch {
    // Malformed token — treat as no session.
  }
  return null;
}

// Set from a Route Handler after a successful login/register.
export async function setSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
