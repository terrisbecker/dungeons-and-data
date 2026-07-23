# Authenticating a request

Every route except `GET /health`, `POST /auth/register`, and `POST /auth/login`
requires a **JWT** sent in an `Authorization: Bearer <token>` header. You get a
token by registering or logging in, then attach it to every subsequent request.

## Setup

The API needs `JWT_SECRET` set (it fails fast on startup otherwise). Copy the
template and start Postgres:

```bash
cp .env.example .env             # sets JWT_SECRET, ADMIN_USERNAME/PASSWORD, …
docker compose up -d db
npx tsx prisma/seed.ts           # seeds accounts + data (see below)
npm run dev                      # API on http://localhost:3000
```

## Getting a token

**Register** a brand-new account (always created as a plain `USER`):

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"username":"mira","password":"correct-horse","displayName":"Mira"}' | jq
```

**Log in** to an existing account:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"mira","password":"correct-horse"}' | jq
```

Both return the same shape — a signed token plus the public player record (never
the password hash):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": { "id": "…", "username": "mira", "systemRole": "USER" }
}
```

## Sending an authenticated request

Capture the token, then pass it as a Bearer header:

```bash
# Log in and keep just the token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"mira","password":"correct-horse"}' | jq -r '.token')

# Use it — any authenticated user may READ anything
curl -s http://localhost:3000/characters \
  -H "authorization: Bearer $TOKEN" | jq -r '.[] | "\(.id)  \(.characterName)"'
```

### Who am I — `GET /auth/me`

The one authenticated route under `/auth`. It returns the current player plus
their campaign memberships, so a frontend knows the caller's global role **and**
which campaigns they DM (i.e. what to render as editable) without decoding the
token or a second request:

```bash
curl -s http://localhost:3000/auth/me -H "authorization: Bearer $TOKEN" | jq
```

```json
{
  "id": "…",
  "username": "dm_seed",
  "displayName": "Seed Dungeon Master",
  "systemRole": "USER",
  "memberships": [
    {
      "id": "…",
      "role": "DUNGEON_MASTER",
      "campaign": {
        "id": "…",
        "name": "The Sunless Citadel",
        "status": "ACTIVE"
      }
    }
  ]
}
```

Writes go through the same header; the server decides from your role whether the
write is allowed:

```bash
# PATCH a character you own (200) — or get 403 if it isn't yours
curl -s -X PATCH "http://localhost:3000/characters/$CID" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"currentHitPoints":12}' | jq
```

## Roles at a glance

The token carries only your **global** role; Dungeon Master / owner authority is
resolved from the database on each request.

| Role               | How you get it                                         | May write                                          |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------- |
| **Admin**          | `systemRole = ADMIN` (seeded, or set by another Admin) | everything                                         |
| **Dungeon Master** | a `CampaignMembership` with `role = DUNGEON_MASTER`    | anything in **their** campaign(s); shared catalogs |
| **Player**         | any logged-in user                                     | their own character(s) and children                |

Everyone authenticated may **read** every resource. Creating a campaign
(`POST /campaigns`) makes you its DM automatically.

## Seeded accounts

`npx tsx prisma/seed.ts` prints the ids it creates and seeds three logins so you
can exercise each role immediately:

| Username      | Password                            | Role                                          |
| ------------- | ----------------------------------- | --------------------------------------------- |
| `admin`       | value of `ADMIN_PASSWORD` in `.env` | Admin                                         |
| `dm_seed`     | `dm-dev-password`                   | DM of the demo campaign "The Sunless Citadel" |
| `player_seed` | `player-dev-password`               | Player who owns all five seeded characters    |

Worked example — the player can edit their own character, the DM can edit the
campaign's creatures, and a fresh user can do neither:

```bash
login() { curl -s -X POST http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d "{\"username\":\"$1\",\"password\":\"$2\"}" | jq -r '.token'; }

PLAYER=$(login player_seed player-dev-password)
DM=$(login dm_seed dm-dev-password)

# player_seed owns "Aria Nightbreeze" — find her id, then edit her (200)
ARIA=$(curl -s http://localhost:3000/characters -H "authorization: Bearer $PLAYER" \
  | jq -r '.[] | select(.characterName=="Aria Nightbreeze") | .id')
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "http://localhost:3000/characters/$ARIA" \
  -H "authorization: Bearer $PLAYER" -H 'content-type: application/json' \
  -d '{"currentHitPoints":9}'                                    # -> 200

# the same edit by a brand-new user is refused
NEW=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"username":"nobody","password":"pw123456"}' | jq -r '.token')
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "http://localhost:3000/characters/$ARIA" \
  -H "authorization: Bearer $NEW" -H 'content-type: application/json' \
  -d '{"currentHitPoints":9}'                                    # -> 403
```

## Browser clients (CORS)

CORS is enabled, so a browser SPA on another origin (e.g. Vite on
`http://localhost:5173`) can call the API and send the `Authorization` header.
By default any origin is allowed — fine for a Bearer-token API, since the token
lives in a header, not a cookie. To restrict it, set `CORS_ORIGIN` to a
comma-separated allowlist:

```bash
CORS_ORIGIN="http://localhost:5173,https://app.example.com"
```

## Response codes

- **401 Unauthorized** — no token, a malformed/expired token, or wrong
  credentials on login. Errors are intentionally generic (`{"error":"…"}`).
- **403 Forbidden** — a valid token, but your role can't perform this write.
- **400 Bad Request** — a malformed body or a non-UUID id.

Tokens expire after `JWT_EXPIRES_IN` (default `7d`); there is no refresh or
revocation yet, so a token stays valid until it expires.
