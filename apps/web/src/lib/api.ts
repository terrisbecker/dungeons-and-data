import type { ApiError, AuthResponse, Campaign, MeResponse } from "@dnd/shared";
import { getToken } from "./session";

// Server-only client for the Express API. Every browser call goes through Next
// (Route Handlers / Server Components), which attaches the JWT from the httpOnly
// cookie — the token never reaches the browser.
const API_URL = process.env.API_URL ?? "http://localhost:3000";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function errorFrom(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = (await res.json()) as ApiError;
    if (body?.error) message = body.error;
  } catch {
    // non-JSON body; keep the fallback
  }
  throw new ApiRequestError(res.status, message);
}

// Authenticated fetch: attaches the Bearer token from the session cookie.
export async function serverFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) await errorFrom(res, res.statusText);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// The current player + memberships (GET /auth/me).
export function getMe(): Promise<MeResponse> {
  return serverFetch<MeResponse>("/auth/me");
}

// Create a campaign (POST /campaigns). The API auto-seats the creator as its DM.
export function createCampaign(body: unknown): Promise<Campaign> {
  return serverFetch<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Public auth calls (no token needed) used by the BFF Route Handlers.
export async function authenticate(
  kind: "login" | "register",
  body: unknown,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/${kind}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) await errorFrom(res, "Authentication failed");
  return (await res.json()) as AuthResponse;
}
