# Build context MUST be the repo root (npm workspaces monorepo):
#   docker build -f frontend/Dockerfile -t enerjipanel-frontend .
# docker-compose.yml is expected to set: build.context: ., build.dockerfile: frontend/Dockerfile
#
# NOTE: VITE_GATEWAY_URL / VITE_REALTIME_URL are baked into the JS bundle
# at BUILD TIME by Vite — they cannot be changed at container runtime.
# docker-compose.yml must pass them as build.args, e.g.:
#   build:
#     context: .
#     dockerfile: frontend/Dockerfile
#     args:
#       VITE_GATEWAY_URL: http://localhost:4000
#       VITE_REALTIME_URL: http://localhost:3005

########################################
# Stage 1: build (Vite SPA build)
########################################
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/

ARG VITE_GATEWAY_URL
ARG VITE_REALTIME_URL
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}
ENV VITE_REALTIME_URL=${VITE_REALTIME_URL}

RUN npm run build --workspace=frontend

########################################
# Stage 2: runtime (static file serving only — no backend proxying;
# that's the deployment reverse-proxy Nginx's job)
########################################
FROM nginx:alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
