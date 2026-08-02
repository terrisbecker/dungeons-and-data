# Dungeons and Data

*A frontend/backend monorepo to help dungeon masters manage their game, players, NPCs, and encounters.*

## Overview

I started Dungeons and Data as a way to teach myself Prisma ORM. After getting through that learning process pretty quickly, I decided to expand the project to include a backend API and a frontend using shadcn/ui components. This repository is the current wip, and at the current state, it has what you need to set up a local web server.

## Who is this for?

The current state of the tool is usable by computer savvy DnD nerds. It requires a few steps and TypeScript dependencies to get it up and going locally, but once it's going, it'll hopefully feel like a virtual notebook to help keep your DnD games organized. If you have networking skills, you can even host the server locally and have the whole party use the tool. I plan to expand beyond the current state as time permits, and launch this publicly on a web server, but that's well in the future still.

## Dependencies

You'll need these installed:

- **[Node.js](https://nodejs.org/) 20+** (ships with `npm`). Check with `node -v`.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (or any
  way to run PostgreSQL 17 — I use OrbStack). Check
  with `docker -v`.
- **Git**, to clone the repo.

## Installation

```bash
git clone <this-repo-url>
cd dungeons-and-data
npm install
```

This is an **npm workspaces monorepo** (`apps/api`, `apps/web`,
`packages/shared`), so one `npm install` at the repo root installs and links
everything. 

Next, set up your environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The defaults already match the Docker database below, so local dev works
without editing anything. Two vars worth knowing:

- `JWT_SECRET` (`apps/api/.env`) — required, the API won't start without it.
  The example value is fine for local dev.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`apps/api/.env`) — becomes your first
  admin login once you seed the database below.

Start the database:

```bash
docker compose up -d db
```

This runs Postgres 17 in a container on `localhost:5432` with credentials
that already match `apps/api/.env`, persisted in a named Docker volume.
`docker compose ps` should show `dnd-postgres` as `healthy` within a few
seconds.

Then create the schema and load sample data:

```bash
npm run prisma:migrate
npm run seed
```

The seed script populates some sample data like catalog items, spells, five sample characters, sample locations in the fogotton realms, a few creatures, and login accounts you can use right away: an admin (from `ADMIN_USERNAME`/
`ADMIN_PASSWORD`), plus a demo DM (`dm_seed`) and player (`player_seed`)
already seated in a demo campaign — see `apps/api/prisma/seed.ts` for their
passwords.

## How to use

```bash
npm run dev
```

This runs the API and web app together. Open the web app and log in with one
of the seeded accounts above:

- **Web app:** http://localhost:3001 — the actual UI, start here.
- **API:** http://localhost:3000 — the backend it talks to; you shouldn't
  need to hit this directly.

From there: log in, create or join a campaign, and start adding characters,
locations, and creatures. Stop everything with `Ctrl+C`.

Other useful commands (run from the repo root):

| Command | What it does |
| --- | --- |
| `npm run dev:api` / `npm run dev:web` | Run just one app, with auto-reload |
| `npm run build` | Build both apps for production |
| `npm run lint` / `npm run format` | Lint / format the repo |
| `npm run prisma:migrate` | Apply a new database migration |
| `npm run seed` | Re-run the seed script (safe to repeat) |

**If something doesn't start:** it's almost always a missing `.env` file or
the database container not running yet. Double check steps 2–4 above
before digging further. A stuck port (3000/3001 already in use) is the other
common culprit; stop whatever's holding it, or change `PORT` in
`apps/api/.env`.

More detail lives under [`docs/`](./docs) — `frontend.md`,
`authentication.md`, `character-sheet.md`, and `creature-stat-block.md`.
`CLAUDE.md` at the repo root has the full architecture and data model.

## Planned releases

Roughly in order:

- An item economy layer (shops, chests, buy/sell pricing) on top of the
  existing item catalog.
- An encounter tracker and dice rolling.
- A public, hosted deployment (currently local-only).