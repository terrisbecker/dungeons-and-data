// Shared API contract — the response shapes the Express API returns, consumed by
// the web app (and available to the API). Type-only: everything here is erased at
// compile time, so there is no build step and no runtime dependency. Keep these
// in sync with the API's `select` projections (e.g. src/auth/auth.queries.ts).

export type SystemRole = "USER" | "ADMIN";
export type CampaignRole = "DUNGEON_MASTER" | "PLAYER";
export type CampaignStatus =
  "PLANNING" | "ACTIVE" | "ON_HIATUS" | "COMPLETED" | "ARCHIVED";

// A Player as exposed publicly — never includes the password hash. Dates are
// serialized as ISO strings over the wire.
export interface PlayerPublic {
  id: string;
  username: string;
  displayName: string | null;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

// POST /auth/register and /auth/login.
export interface AuthResponse {
  token: string;
  player: Pick<PlayerPublic, "id" | "username" | "systemRole">;
}

export interface Membership {
  id: string;
  role: CampaignRole;
  joinedAt: string;
  campaign: { id: string; name: string; status: CampaignStatus };
}

// GET /auth/me — the current player plus their campaign memberships.
export interface MeResponse extends PlayerPublic {
  memberships: Membership[];
}

// The API's generic error body: { "error": "…" }.
export interface ApiError {
  error: string;
}
