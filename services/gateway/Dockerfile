# Build context MUST be the repo root (npm workspaces monorepo):
#   docker build -f services/gateway/Dockerfile -t enerjipanel-gateway .
# docker-compose.yml is expected to set: build.context: ., build.dockerfile: services/gateway/Dockerfile

########################################
# Stage 1: deps
# Install the gateway workspace's dependencies plus the workspace
# packages it depends on at runtime (@enerjipanel/shared-middleware,
# used by app.js for requireEnv()).
########################################
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY services/gateway/package.json ./services/gateway/package.json
COPY shared-middleware/package.json ./shared-middleware/package.json

RUN npm ci --workspace=@enerjipanel/gateway --include-workspace-root

########################################
# Stage 2: build
# No build step: this service is a stateless proxy with no Prisma schema
# and nothing to generate.
########################################
FROM node:24-alpine AS build
WORKDIR /app

COPY --from=deps /app ./

########################################
# Stage 3: runtime
########################################
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared-middleware ./shared-middleware
# npm workspaces links @enerjipanel/shared-middleware as a symlink to this
# sibling directory, so its source (not just package.json) must be present
# at runtime too, not just in node_modules.
COPY shared-middleware/src ./shared-middleware/src
COPY services/gateway/src ./services/gateway/src
COPY services/gateway/package.json ./services/gateway/package.json

WORKDIR /app/services/gateway
USER node
EXPOSE 4000

CMD ["node", "src/index.js"]
