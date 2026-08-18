# EnerjiPanel — Architecture

EnerjiPanel is a real-time energy consumption and indoor comfort monitoring platform for homes and businesses, built as a JavaScript microservices system. This document explains what the system does, how it's structured, and why the key decisions were made the way they were.

## Contents

- [System Overview](#system-overview)
- [Design Principles](#design-principles)
- [Services](#services)
- [Data Model](#data-model)
- [Event Schemas](#event-schemas)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Known Trade-offs](#known-trade-offs)

---

## System Overview

Users register, add facilities (a home or business location) and devices (energy meters, thermostats, boilers), and see live consumption and comfort data streamed to their dashboard over WebSocket. A planned alerting layer (Phase 1) will surface threshold-based alerts and savings/comfort recommendations — for example, "your boiler has been running 3 hours at 24°C; lowering it by 1° would save roughly 85 TRY/month."

```
Route 53
  ├── energypanel.alperodaman.com      (frontend)
  └── api.energypanel.alperodaman.com  (backend)
        │
        ▼
     Nginx (reverse proxy + TLS termination)
        │
   ┌────┴─────────────────────────────────────┐
   │                                            │
API Gateway (REST only)              Realtime Service (WebSocket, direct)
   │
   ├── Auth Service         (auth_db)
   ├── Facility Service     (facility_db)
   ├── Telemetry Service    (telemetry_db)
   └── Alert & Insights     (alert_db + MongoDB, Phase 1)
        │
   RabbitMQ (enerjipanel.events, topic exchange)
```

Each service is independently deployable and owns its own database. Services communicate over REST for direct requests and over RabbitMQ for asynchronous, event-driven updates — never by reading each other's databases directly.

## Design Principles

### Stateless by default

Every service except Realtime Service is stateless: a request carries everything needed to process it (the `user_id` from the JWT), so any running instance can handle any request without shared in-memory session state. This is what allows horizontal scaling without sticky sessions.

Realtime Service is the deliberate exception, because WebSocket connections are inherently stateful — a given client stays connected to one instance for the life of the connection. It holds two distinct kinds of state in Redis, in separate key namespaces:

1. **Connection/subscription state** — who's connected, and which facilities they're subscribed to. When Realtime Service scales to multiple instances, `@socket.io/redis-adapter` uses Redis pub/sub to broadcast events across instances so a message published on one instance reaches a client connected to another.
2. **A reconciled facility-ownership cache** (`facility:owners`) — a local copy of "which user owns which facility," used to authorize `subscribe:facility` requests without a synchronous call to Facility Service. It's kept in sync via the `facility.created` event, backed by a periodic reconciliation job (see [Event Schemas](#event-schemas)).

### Database-per-service

Each service owns its own database, and there are no cross-service foreign keys — only plain UUID references (e.g. `Facility.ownerUserId` is a string, not a relation). This is the standard cost of a microservices architecture (eventual consistency, no cross-service joins) in exchange for independent deployability and scaling.

One service, `alert-service` (Phase 1), uses two databases — PostgreSQL for structured, query-heavy data (alerts, thresholds) and MongoDB for flexible, frequently-changing data (notification read-state, insight history). This isn't an exception to database-per-service: the rule is that each database has exactly one owning service, not that each service may use only one database technology.

### Event-driven discovery, not synchronous coupling

Telemetry Service and Realtime Service both need to know which facilities and devices exist, but neither calls Facility Service synchronously to find out. Instead, both consume `facility.created`/`device.created` events from RabbitMQ and maintain their own local read models (a Postgres table for Telemetry Service, a Redis hash for Realtime Service).

Because RabbitMQ events are removed once acknowledged, a lost or failed event could otherwise cause a local read model to silently drift from the source of truth. Both services run a periodic reconciliation job that pulls the full current state from Facility Service's internal endpoint (`GET /internal/facilities`, protected by a shared service secret, not a user JWT) and upserts any gaps. This reconciliation is additive-only by design — it fills in missing records but never deletes ones that were removed upstream, favoring a stale-but-safe local state over data loss. No request in the user-facing path ever makes a synchronous cross-service call.

### WebSocket authentication via handshake, not headers

WebSocket clients pass their JWT through Socket.io's `auth: { token }` option at connection time, read server-side via `socket.handshake.auth.token`. This isn't a style preference — native browser WebSocket connections can't set custom HTTP headers during the handshake, so `Authorization: Bearer <token>` isn't an option here.

### WebSocket traffic bypasses the Gateway

REST traffic goes through the Gateway, which validates JWTs and proxies to the appropriate service. WebSocket traffic does not — Nginx routes `/realtime` directly to Realtime Service, since WS connections are long-lived and authentication happens at the Socket.io handshake instead. "Single entry point" applies to REST; it doesn't apply to WS.

### Fail-fast environment validation

Every service validates its required environment variables at startup, before attempting any database, Redis, or RabbitMQ connection. If something's missing, the service logs exactly which variable and exits immediately, rather than starting in a half-working state and failing unpredictably on the first real request.

## Services

| Service | Responsibility | Database | Port |
|---|---|---|---|
| API Gateway | Single REST entry point, JWT validation, request proxying | — | 3000 |
| Auth Service | Registration, login, JWT issuance, refresh token rotation | PostgreSQL (`auth_db`) | 3001 |
| Facility Service | Facility & device CRUD, publishes `facility.created`/`device.created` | PostgreSQL (`facility_db`) | 3002 |
| Telemetry Service | Simulated sensor data generation, storage, querying | PostgreSQL (`telemetry_db`) | 3003 |
| Realtime Service | WebSocket connections, live push, subscription management | Redis | 3005 |
| Alert & Insights Service *(Phase 1)* | Threshold alerts, savings/comfort insights | PostgreSQL (`alert_db`) + MongoDB | 3004 |

Every service follows the same internal layering: **routes** (wiring only) → **controllers** (request/response shaping, validation) → **services** (business logic, database access). There is no separate repository/data-access layer — Prisma already provides that abstraction, and an extra layer at this scale would be unnecessary indirection.

## Data Model

Each service owns its own Prisma schema. A few representative models:

**Auth Service** — `User` 1–N `RefreshToken`

**Facility Service** — `Facility` (owned by `ownerUserId`, a UUID reference, not a foreign key) 1–N `Device`

**Telemetry Service** — `Reading` (facility/device references as plain UUIDs, indexed on `(facilityId, deviceId, occurredAt)`), plus two Phase-0-specific local read models: `TrackedDevice` and `FacilityOwnership`, both populated from RabbitMQ events rather than direct queries to Facility Service.

**Alert & Insights Service** *(Phase 1)* — `Alert` and `Threshold` in PostgreSQL; `notification_read_state` and `insight_history` as MongoDB documents.

## Event Schemas

**Exchange:** `enerjipanel.events` (topic), **routing key pattern:** `<eventType>.<facilityId>.<deviceType>`

| Event | Published by | Consumed by | Purpose |
|---|---|---|---|
| `facility.created` | Facility Service | Telemetry Service, Realtime Service | Populates each consumer's local ownership read model |
| `device.created` | Facility Service | Telemetry Service | Tells the telemetry simulator which devices to generate readings for |
| `telemetry.reading.created` | Telemetry Service | Realtime Service, Alert & Insights *(Phase 1)* | Drives the live WebSocket push and, later, threshold checks |
| `alert.created` *(Phase 1)* | Alert & Insights Service | Realtime Service | Pushes alerts to connected clients |
| `insight.generated` *(Phase 1)* | Alert & Insights Service | Realtime Service | Pushes savings/comfort recommendations |

Publishing is best-effort with retries: a service writes to its own database first, then attempts to publish (with a few retries on failure); a publish failure is logged but never blocks the original request from succeeding, since the database write is the source of truth.

Event payload shapes are documented via JSDoc `@typedef` definitions in a shared `shared-contracts` workspace, which catches most naming drift between services at edit time without requiring a full TypeScript migration.

## Deployment

The system runs on a single AWS EC2 instance (`t3.small`, Ubuntu) via Docker Compose, fronted by an Nginx container that handles reverse proxying and TLS termination (Let's Encrypt, auto-renewed via Certbot). Route 53 points both the frontend and API subdomains at the instance's Elastic IP. Only ports 80, 443, and 22 are exposed; PostgreSQL, RabbitMQ, and Redis are reachable only over the internal Docker network.

A self-managed EC2 deployment was chosen over a managed platform (e.g. Railway, Render) specifically to demonstrate setting up DNS, a reverse proxy, and TLS end to end, rather than delegating that to a platform.

Monitoring is staged by resource cost: external uptime checks (UptimeRobot) from day one at zero cost to the instance; structured logging and a `/metrics` endpoint in Phase 1; and Phase 2 pushes those metrics to Grafana Cloud's free tier rather than self-hosting Prometheus and Grafana on an instance that already runs six services, three Postgres databases, RabbitMQ, and Redis.

## Roadmap

- **Phase 0 (complete):** end-to-end flow — register, log in, add a facility and devices, see live telemetry over WebSocket. All core services, containerized, deployed to production.
- **Phase 1:** Alert & Insights Service, notifications, history/analytics view, expanded test coverage, CI pipeline, structured logging and metrics.
- **Phase 2:** MongoDB usage for notifications/insights, accessibility audit, full responsive design, dark mode, broader rate limiting, metrics dashboards, automated deployment.

## Known Trade-offs

These are deliberate, acknowledged gaps — not oversights:

- **No idempotency handling yet** for RabbitMQ's at-least-once delivery; a redelivered message could theoretically be processed twice. Negligible at current demo volume; addressed in Phase 1 via event-ID-based deduplication.
- **No protection against concurrent refresh-token requests.** Deferred to Phase 2.
- **Secrets are managed via `.env` files**, not a dedicated secret manager — a conscious scope decision for this stage.
- **Reconciliation jobs are additive-only**, in both Telemetry Service and Realtime Service — they never remove local records that were deleted upstream.
- **Graceful shutdown is implemented only in Facility Service** so far — a deliberate incremental rollout, to be extracted into a shared helper once needed elsewhere.
- **The `shared-contracts` package exists but isn't imported by any service yet** — event shapes are currently kept consistent by convention and documentation. Planned before Alert & Insights Service adds a new event consumer.
