import { cache } from "react";
import type {
  ApiError,
  AuthResponse,
  Campaign,
  CampaignMembership,
  CampaignRole,
  CharacterSheet,
  CharacterSummary,
  CreatureKind,
  CreatureStatBlock,
  CreatureSummary,
  FeatCatalog,
  FeatureCatalog,
  ItemCatalog,
  LocationDetail,
  LocationRow,
  MeResponse,
  SpellCatalog,
  UpdateCampaignInput,
  UpdateMembershipInput,
} from "@dnd/shared";
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

// A single campaign with its roster (GET /campaigns/:id). Wrapped in React's
// cache() so the campaign layout and the page it renders share one request.
export const getCampaign = cache((id: string): Promise<Campaign> => {
  return serverFetch<Campaign>(`/campaigns/${encodeURIComponent(id)}`);
});

// Join a campaign as a PLAYER by its id (POST /campaigns/:id/join). The API
// seats the caller (from the token) — the id is only used to find the campaign.
// Returns the created membership row (the lean shape the API create returns).
export function joinCampaign(id: string): Promise<{
  id: string;
  campaignId: string;
  playerId: string;
  role: CampaignRole;
  joinedAt: string;
}> {
  return serverFetch(`/campaigns/${encodeURIComponent(id)}/join`, {
    method: "POST",
  });
}

export function updateCampaign(
  id: string,
  body: UpdateCampaignInput,
): Promise<Campaign> {
  return serverFetch<Campaign>(`/campaigns/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCampaign(id: string): Promise<void> {
  return serverFetch<void>(`/campaigns/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Self-service leave (POST /campaigns/:id/leave) — seats/removes only the
// caller, resolved from the token, so the id only identifies the campaign.
export function leaveCampaign(id: string): Promise<void> {
  return serverFetch<void>(`/campaigns/${encodeURIComponent(id)}/leave`, {
    method: "POST",
  });
}

export function updateMembership(
  id: string,
  body: UpdateMembershipInput,
): Promise<CampaignMembership> {
  return serverFetch<CampaignMembership>(
    `/campaign-memberships/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function deleteMembership(id: string): Promise<void> {
  return serverFetch<void>(`/campaign-memberships/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// A player's own characters (GET /characters?playerId=…).
export function getMyCharacters(playerId: string): Promise<CharacterSummary[]> {
  return serverFetch<CharacterSummary[]>(
    `/characters?playerId=${encodeURIComponent(playerId)}`,
  );
}

// The full virtual character sheet (GET /characters/:id/sheet).
export function getCharacterSheet(id: string): Promise<CharacterSheet> {
  return serverFetch<CharacterSheet>(
    `/characters/${encodeURIComponent(id)}/sheet`,
  );
}

// Create a character (POST /characters). Returns the created row (incl. its id).
export function createCharacter(body: unknown): Promise<{ id: string }> {
  return serverFetch<{ id: string }>("/characters", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Attach a class to a character (POST /character-classes).
export function createCharacterClass(body: unknown): Promise<{ id: string }> {
  return serverFetch<{ id: string }>("/character-classes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Attach a skill proficiency to a character (POST /character-skills).
export function createCharacterSkill(body: unknown): Promise<{ id: string }> {
  return serverFetch<{ id: string }>("/character-skills", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Soft-delete a character (DELETE /characters/:id). Used to roll back a partial
// creation when a child-row step fails.
export function deleteCharacter(id: string): Promise<void> {
  return serverFetch<void>(`/characters/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Shared catalogs (GET /items, /spells, /feats, /features). Readable by any
// authed user; the catalog pages use these server-side, while the sheet pickers
// fetch /api/catalog/[topic] from the client.
export function listItems(): Promise<ItemCatalog[]> {
  return serverFetch<ItemCatalog[]>("/items");
}

export function listSpells(): Promise<SpellCatalog[]> {
  return serverFetch<SpellCatalog[]>("/spells");
}

export function listFeats(): Promise<FeatCatalog[]> {
  return serverFetch<FeatCatalog[]>("/feats");
}

export function listFeatures(): Promise<FeatureCatalog[]> {
  return serverFetch<FeatureCatalog[]>("/features");
}

// Every location owned by a campaign (GET /locations?campaignId=…), flat and
// alphabetical. The browser derives the tree, the breadcrumb, and the parent
// picker from this single list rather than fetching level by level.
export function listLocations(campaignId: string): Promise<LocationRow[]> {
  return serverFetch<LocationRow[]>(
    `/locations?campaignId=${encodeURIComponent(campaignId)}`,
  );
}

// One location with the creatures placed there (GET /locations/:id).
export function getLocation(id: string): Promise<LocationDetail> {
  return serverFetch<LocationDetail>(`/locations/${encodeURIComponent(id)}`);
}

export function createLocation(body: unknown): Promise<LocationRow> {
  return serverFetch<LocationRow>("/locations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateLocation(
  id: string,
  body: unknown,
): Promise<LocationRow> {
  return serverFetch<LocationRow>(`/locations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteLocation(id: string): Promise<void> {
  return serverFetch<void>(`/locations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Every creature visible from a campaign (GET /creatures). `includeShared`
// folds in the shared-catalog rows (campaignId null) so a DM sees their own
// creatures and the common bestiary in one read.
export function listCreatures(
  campaignId: string,
  { includeShared = false, kind }: ListCreaturesOptions = {},
): Promise<CreatureSummary[]> {
  const query = new URLSearchParams({ campaignId });
  if (includeShared) query.set("includeShared", "true");
  if (kind) query.set("kind", kind);
  return serverFetch<CreatureSummary[]>(`/creatures?${query}`);
}

export interface ListCreaturesOptions {
  includeShared?: boolean;
  kind?: CreatureKind;
}

// The full stat block (GET /creatures/:id/sheet) — scalars, derived, skills,
// entries, damage modifiers, inventory, and location placements.
export function getCreatureStatBlock(id: string): Promise<CreatureStatBlock> {
  return serverFetch<CreatureStatBlock>(
    `/creatures/${encodeURIComponent(id)}/sheet`,
  );
}

export function createCreature(body: unknown): Promise<{ id: string }> {
  return serverFetch<{ id: string }>("/creatures", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCreature(id: string, body: unknown): Promise<unknown> {
  return serverFetch(`/creatures/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCreature(id: string): Promise<void> {
  return serverFetch<void>(`/creatures/${encodeURIComponent(id)}`, {
    method: "DELETE",
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
