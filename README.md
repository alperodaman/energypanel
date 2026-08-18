# EnergyPanel

A microservice-based platform for monitoring home/business energy consumption and indoor comfort (temperature, boiler/thermostat state) in real time. Built on a Node.js (Express) + React (JavaScript) stack, with database-per-service isolation, RabbitMQ for event-driven communication, and Socket.io for live data push.

> **Live:** [energypanel.alperodaman.com](https://energypanel.alperodaman.com) (frontend) · [api.energypanel.alperodaman.com](https://api.energypanel.alperodaman.com) (backend)

## Architecture Overview

```
                     ┌──────────────┐
        HTTP/REST →  │ API Gateway  │ → proxies to auth / facility / telemetry services
                     └──────────────┘
                            │
      ┌──────────────┬─────┴──────┬───────────────┬──────────────────┐
      │              │            │                │                  │
 Auth Service   Facility Svc  Telemetry Svc   Realtime Svc      Alert & Insights
 (auth_db)      (facility_db) (telemetry_db)  (Redis, stateful)  (Phase 1, alert_db+Mongo)
      │              │            │                │
      └──────────────┴────────────┴── RabbitMQ (enerjipanel.events) ──┘
```

WebSocket traffic bypasses the Gateway entirely — Nginx routes `/realtime` directly to the Realtime Service, since WS connections are long-lived and JWT auth happens at the Socket.io handshake instead.

- **Stateless by default:** every service except Realtime Service is stateless — any request carries all it needs (`user_id` from the JWT), so any instance can serve any request.
- **Database-per-service:** each service owns its own Postgres database; cross-service references are plain UUID strings, never foreign keys (e.g. `Facility.ownerUserId`).
- **Event-driven communication:** RabbitMQ topic exchange `enerjipanel.events`, routing key pattern `<eventType>.<facilityId>.<deviceType>`.
- **Real-time data:** Realtime Service pushes to clients over Socket.io; connection/subscription state lives in Redis so multiple instances can share it (`@socket.io/redis-adapter`).

**Phase 1 (not yet built):** Alert & Insights Service — threshold-based alerts, savings/comfort insights. Everything else below is implemented and running in production.

## Services

| Service | Responsibility | Database | Status |
|---|---|---|---|
| `gateway` | Single REST entry point, JWT validation, request proxying to auth/facility/telemetry | — | ✅ Implemented |
| `auth-service` | Register/login, JWT issuance, refresh token rotation | Postgres `auth_db` | ✅ Implemented |
| `facility-service` | Full facility & device CRUD, device-count aggregation, publishes `facility.created`/`device.created` | Postgres `facility_db` | ✅ Implemented |
| `telemetry-service` | Cron-driven realistic data simulation, telemetry storage/querying, publishes `telemetry.reading.created` | Postgres `telemetry_db` | ✅ Implemented |
| `realtime-service` | WebSocket (Socket.io) live push, connection/subscription state; the one stateful service | Redis | ✅ Implemented |
| `alert-service` | Threshold-based alerts, savings/comfort insights | Postgres `alert_db` + MongoDB | ⏳ Planned (Phase 1) |

### gateway

Express 5. Validates JWTs and proxies REST traffic to auth-service, facility-service and telemetry-service. Does not handle WebSocket traffic (see above).

### auth-service

Express 5 + Prisma 7 (PostgreSQL) + zod.

- `POST /auth/register` — `{ email, password, name }`
- `POST /auth/login` — `{ email, password }` → `{ accessToken, refreshToken }` (rate-limited)
- `POST /auth/refresh` — `{ refreshToken }` → `{ accessToken }`
- `GET /auth/me` — `Authorization: Bearer <token>` → current user

Domain: `User` 1—N `RefreshToken`.

### facility-service

Express 5 + Prisma 7 + zod, all endpoints JWT-protected.

- `POST /facilities` / `GET /facilities` (with `deviceCount` aggregation) / `GET /facilities/:id`
- `PATCH /facilities/:id` / `DELETE /facilities/:id` (409 if the facility still has devices)
- `POST /facilities/:id/devices` / `GET /facilities/:id/devices`
- `PATCH /devices/:id` / `DELETE /devices/:id`
- `GET /internal/facilities` — internal-only, protected by a shared service secret (not user JWT), used by telemetry-service and realtime-service for reconciliation

Domain: `Facility` (owned via `ownerUserId`, a UUID reference — no FK) 1—N `Device`.

### telemetry-service

Express 5 + Prisma 7. Runs a cron job that generates realistic fake sensor readings and publishes them to RabbitMQ.

- `GET /facilities/:id/telemetry` — `?type=energy|temperature|boiler&from=&to=&granularity=hour|day`
- `GET /facilities/:id/telemetry/latest` — latest reading per device
- `GET /devices/:id/telemetry/history` — `?from=&to=`

Also consumes `facility.created`/`device.created` events to track which devices to simulate, and periodically reconciles its local read model against facility-service's `/internal/facilities`.

### realtime-service

Express 5 + Socket.io + Redis. WebSocket handshake carries the JWT via `auth: { token }` (browsers can't set custom headers during the WS handshake).

- `subscribe:facility` / `unsubscribe:facility` — client → server
- `telemetry:update` — server → client, pushed on every `telemetry.reading.created` event

Ownership checks (is this user allowed to subscribe to this facility?) are done against a local Redis cache (`facility:owners`), kept in sync via the `facility.created` event plus a periodic reconciliation job — no synchronous call to facility-service on the request path.

## Tech Stack

Node.js (Express 5) · React 19 + Vite · PostgreSQL + Prisma 7 · RabbitMQ · Redis · Socket.io · Docker Compose · Nginx · AWS EC2

## Shared Packages

- **`shared-middleware`** (`@enerjipanel/shared-middleware`) — `createAuthenticateMiddleware({ jwtSecret })`: Express middleware that validates JWTs and populates `req.user`. Used by auth-service and facility-service.
- **`shared-eslint-config`** (`@enerjipanel/eslint-config`) — `neostandard` + Prettier based flat ESLint config, shared by all workspaces.
- **`shared-contracts`** — workspace intended for RabbitMQ event contract definitions; still empty, planning stage.

## Local Development Setup

**Prerequisites:** Docker, Docker Compose, Git, Node.js 24.

```bash
# 1) Clone
git clone <repo-url>
cd energypanel

# 2) Configure environment
cp .env.example .env
# fill in real values for POSTGRES_*_PASSWORD, RABBITMQ_PASSWORD, REDIS_PASSWORD,
# JWT_SECRET and INTERNAL_SERVICE_SECRET

# 3) Build and start everything (infra + all 6 app services + nginx-proxy)
docker compose up -d --build

# 4) Apply Prisma migrations for each service that has a schema
docker compose exec auth-service npx prisma migrate deploy
docker compose exec facility-service npx prisma migrate deploy
docker compose exec telemetry-service npx prisma migrate deploy
```

The whole stack is reachable through `nginx-proxy` at **http://localhost:8091** (frontend at `/`, API at `/api`, WebSocket at `/realtime` — see `VITE_GATEWAY_URL`/`VITE_REALTIME_URL` in `.env.example`). Individual service ports are not published to the host; everything goes through the proxy.

### Test

```bash
npm run test --workspace=services/auth-service
npm run test --workspace=services/facility-service
```

Tests run locally against the workspace (Jest + Supertest), not inside the containers — `npm install` at the repo root first. Currently only auth-service and facility-service have test coverage (Phase 1 extends this to telemetry, realtime and alert-service, plus CI).

## Production Deployment

- **Frontend:** https://energypanel.alperodaman.com
- **Backend:** https://api.energypanel.alperodaman.com

Deployed on a single AWS EC2 instance (`t3.small`, Ubuntu) running the same Docker Compose stack as local dev, fronted by an Nginx container doing reverse proxying and SSL termination (Let's Encrypt via Certbot). Route 53 A records point both hostnames at the instance's Elastic IP. Only ports 80, 443 and 22 are open in the security group — Postgres/RabbitMQ/Redis are never exposed publicly, only over the internal Docker network.

`docker-compose.prod.yml` overrides the local proxy config (host-based routing on 80/443 + TLS instead of path-based routing on 8091) and injects the public API URLs into the frontend build:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Operations Notes

- **Restarts:** every service has `restart: always` (or `unless-stopped`); if the EC2 instance reboots, Docker brings the whole stack back up automatically.
- **SSL:** Let's Encrypt certificates, auto-renewed by the `certbot` container (checks every 12 hours).
- **Monitoring:** UptimeRobot pings `https://energypanel.alperodaman.com` and `https://api.energypanel.alperodaman.com/health` every 5 minutes and alerts on downtime.
- **Memory constraint:** the `t3.small` instance has only 2GB RAM, which can't survive a parallel `docker compose build`. A 2GB swap file (`/swapfile`) was added as a safety net, and images are **always built one at a time** — `docker compose build <service-name>` — never a bare `docker compose build`.

Typical deploy:

```bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build gateway
docker compose -f docker-compose.yml -f docker-compose.prod.yml build auth-service
# ...repeat per changed service, one at a time (see memory constraint above)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
# if a schema changed:
docker compose exec facility-service npx prisma migrate deploy
```

## Infrastructure (docker-compose.yml)

| Service | Image / Build | Host exposure | Purpose |
|---|---|---|---|
| `postgres-auth` / `postgres-facility` / `postgres-telemetry` | postgres:18-alpine | internal only | one database per service |
| `rabbitmq` | rabbitmq:4.3-management-alpine | `127.0.0.1:15672` (management UI only, AMQP stays internal) | event bus |
| `redis` | redis:8.10-alpine, password-protected | internal only | realtime connection/subscription state |
| `auth-service`, `facility-service`, `telemetry-service`, `realtime-service`, `gateway` | built from `services/*/Dockerfile` | internal only | app services |
| `frontend` | built from `frontend/Dockerfile`, served by Nginx | internal only | React SPA static assets |
| `nginx-proxy` | nginx:latest | `127.0.0.1:8091` locally / `80`+`443` in production | reverse proxy, single entry point |

No application or database port is published beyond `127.0.0.1` locally; in production, only `nginx-proxy` is reachable from outside the instance at all.

## Roadmap

- **Phase 0 — ✅ Completed:** end-to-end flow (register → login → add facility/device → live telemetry over WebSocket), all 5 core services, Dockerized deployment on AWS EC2 with Nginx + Let's Encrypt, UptimeRobot monitoring, basic tests for auth-service and facility-service.
- **Phase 1:** Alert & Insights Service (thresholds, alerts, comfort/savings insights), notification system (toasts, bell dropdown), history/analytics page, settings page, GitHub Actions CI (lint + test per PR), expanded test coverage (telemetry, realtime, alert-service), structured logging (Pino) + `/metrics` (prom-client).
- **Phase 2:** MongoDB for notification read-state and insight history, accessibility improvements, full responsive design, dark mode, rate limiting/validation on all endpoints, Grafana Cloud dashboards, GitHub Actions → EC2 automated deploy.
