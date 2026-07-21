# Multi-stage build for the API image.

# --- Build stage: install all deps, generate the Prisma client, compile TS ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# prisma.config.ts requires DATABASE_URL to load; `generate` never connects, so
# a placeholder satisfies the config without needing a real database at build time.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate
RUN npm run build

# --- Prod deps: production-only node_modules (no dev tooling) ---
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime stage: only what's needed to run the compiled server ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
# generated Prisma client (built with the prisma CLI in the build stage); the
# runtime engine matches because both stages share the node:22-alpine base.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
