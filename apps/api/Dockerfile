# Multi-stage build for the API image in the npm-workspaces monorepo.
# IMPORTANT: build from the REPO ROOT so the workspace + lockfile are in context:
#   docker build -f apps/api/Dockerfile -t dnd-api .

# --- Build stage: install the workspace, generate Prisma client, compile TS ---
FROM node:22-alpine AS build
WORKDIR /repo
# Manifests first for cached installs (workspace root + the packages involved).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
# Sources needed to build @dnd/api (it does not import @dnd/shared at runtime,
# but the workspace symlink must resolve during install).
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/api apps/api
# prisma.config.ts requires DATABASE_URL to load; `generate` never connects, so
# a placeholder satisfies the config without needing a real database at build time.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npm run prisma:generate -w @dnd/api
RUN npm run build -w @dnd/api

# --- Prod deps: production-only node_modules (no dev tooling) ---
FROM node:22-alpine AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev

# --- Runtime stage: only what's needed to run the compiled server ---
FROM node:22-alpine AS runtime
WORKDIR /repo/apps/api
ENV NODE_ENV=production
COPY --from=prod-deps /repo/node_modules /repo/node_modules
# generated Prisma client from the build stage (engine matches: same base image)
COPY --from=build /repo/node_modules/.prisma /repo/node_modules/.prisma
COPY --from=build /repo/node_modules/@prisma/client /repo/node_modules/@prisma/client
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/apps/api/prisma.config.ts ./prisma.config.ts
COPY --from=build /repo/packages/shared /repo/packages/shared
EXPOSE 3000
CMD ["node", "dist/index.js"]
