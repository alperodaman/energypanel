# Build context MUST be the repo root (npm workspaces monorepo):
#   docker build -f services/telemetry-service/Dockerfile -t enerjipanel-telemetry .
# docker-compose.yml is expected to set: build.context: ., build.dockerfile: services/telemetry-service/Dockerfile

########################################
# Stage 1: deps
# Install the telemetry-service workspace's dependencies (incl. devDependencies,
# needed for `prisma generate` in the build stage) plus the workspace
# packages it depends on at runtime (@enerjipanel/shared-middleware).
########################################
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/telemetry-service/package.json ./services/telemetry-service/package.json
COPY shared-middleware/package.json ./shared-middleware/package.json

RUN npm ci --workspace=@enerjipanel/telemetry-service --include-workspace-root

########################################
# Stage 2: build
# Generate the Prisma client from schema.prisma.
########################################
FROM node:24-alpine AS build
WORKDIR /app

COPY --from=deps /app ./
COPY services/telemetry-service/prisma ./services/telemetry-service/prisma

# `db.js` imports the generated client from `../generated/prisma-client/client.js`
# (see prisma/schema.prisma `generator client { output = "../generated/prisma-client" }`).
# Without this step the runtime image fails with:
#   "Cannot find module '.prisma/client/default'"
# (observed and documented in NOTES.md's CI notes).
WORKDIR /app/services/telemetry-service
RUN npx prisma generate

########################################
# Stage 3: runtime
########################################
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared-middleware ./shared-middleware
# npm workspaces links @enerjipanel/shared-middleware as a symlink to this
# sibling directory, so its source (not just package.json) must be present
# at runtime too, not just in node_modules.
COPY shared-middleware/src ./shared-middleware/src
COPY --from=build /app/services/telemetry-service/generated ./services/telemetry-service/generated
COPY services/telemetry-service/src ./services/telemetry-service/src
COPY services/telemetry-service/package.json ./services/telemetry-service/package.json

WORKDIR /app/services/telemetry-service
USER node
EXPOSE 3003

CMD ["node", "src/index.js"]
