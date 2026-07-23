import type { SystemRole } from "@prisma/client";

// The authenticated caller, decoded from the JWT and attached to the request by
// `requireAuth`. Only the GLOBAL role travels in the token; per-campaign (DM)
// and character-ownership (player) authority is resolved from the DB per request
// so membership/ownership changes take effect immediately.
export interface AuthContext {
  playerId: string;
  username: string;
  systemRole: SystemRole;
}

// Augment Express's Request so handlers and guards can read `req.auth` once
// `requireAuth` has run. Optional because public routes (/auth, /health) skip it.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
