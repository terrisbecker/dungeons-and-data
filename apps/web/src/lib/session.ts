import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "./session-config";

// Server-side session helpers. The JWT lives in an httpOnly cookie the browser's
// JS can never read; only these server helpers (and the proxy) touch it.

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
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
