# EnerjiPanel

Ev ve işyerleri için enerji tüketimi ile iç ortam konforunu (sıcaklık vb.) izlemeye yönelik, mikroservis mimarisiyle geliştirilen bir izleme paneli. Her servis kendi veritabanına sahiptir, servisler arası referanslar foreign key değil düz UUID'dir; RabbitMQ olay tabanlı iletişim, Redis ise gerçek zamanlı (WebSocket) katmanın durum paylaşımı için kullanılır.

> Proje aktif geliştirme aşamasındadır (Faz 0). Aşağıdaki mimari, hedeflenen nihai yapıyı da içerir; hangi servislerin şu an gerçekten çalışır durumda olduğu "Servisler" bölümünde işaretlenmiştir.

## Mimari

```
                     ┌──────────────┐
        HTTP/REST →  │ API Gateway  │ → auth / facility / telemetry servislerine proxy
                     └──────────────┘
                            │
      ┌──────────────┬─────┴──────┬───────────────┬──────────────────┐
      │              │            │                │                  │
 Auth Service   Facility Svc  Telemetry Svc   Realtime Svc      Alert & Insights
 (auth_db)      (facility_db) (telemetry_db)  (Redis, stateful)  (Faz 1, alert_db+Mongo)
      │              │            │                │
      └──────────────┴────────────┴── RabbitMQ (enerjipanel.events) ──┘
```

- **Stateless prensip:** Realtime Service dışındaki tüm servisler stateless'tır.
- **Database-per-service:** Her servisin kendi Postgres veritabanı vardır, servisler arası ilişkiler foreign key ile değil UUID string referanslarıyla kurulur (örn. `Facility.ownerUserId`).
- **Olay tabanlı iletişim:** RabbitMQ üzerinde `enerjipanel.events` adlı topic exchange, routing key formatı `<eventType>.<facilityId>.<deviceType>`.
- **Gerçek zamanlı veri akışı:** Realtime Service, Socket.io ile istemcilere push yapar; birden fazla instance arasında bağlantı/subscription durumu Redis (`@socket.io/redis-adapter`) üzerinden paylaşılır. JWT, WebSocket handshake'inin `auth` objesi üzerinden taşınır.

## Servisler

| Servis | Sorumluluk | Veritabanı | Durum |
|---|---|---|---|
| `auth-service` | Kayıt/giriş, JWT üretimi, refresh token rotasyonu | Postgres `auth_db` | ✅ Uygulandı |
| `facility-service` | Tesis (facility) ve cihaz (device) CRUD | Postgres `facility_db` | ✅ Uygulandı (temel CRUD; update/delete Faz 1) |
| `gateway` | Tek REST giriş noktası, JWT doğrulama, ilgili servise yönlendirme | — | ⏳ Planlandı |
| `telemetry-service` | Sensör verisi toplama/sorgulama (simülasyon ile üretilecek) | Postgres `telemetry_db` | ⏳ Planlandı |
| `realtime-service` | WebSocket (Socket.io) ile canlı veri push'u; tek stateful servis | Redis | ⏳ Planlandı |
| `alert-service` | Eşik tabanlı uyarılar ve öngörüler (insights) | Postgres `alert_db` + MongoDB | ⏳ Planlandı (Faz 1) |

### auth-service

Express 5 + Prisma 7 (PostgreSQL) + zod ile yazılmış, ESM tabanlı bir servis.

- `POST /register` — `{ email, password, name }` → kullanıcı oluşturur
- `POST /login` — `{ email, password }` → access/refresh token çifti döner (rate-limit korumalı)
- `POST /refresh` — `{ refreshToken }` → yeni token çifti döner
- `GET /me` — `Authorization: Bearer <token>` ile giriş yapmış kullanıcıyı döner

Domain: `User` 1—N `RefreshToken`.

### facility-service

Aynı stack (Express 5, Prisma 7, zod), tüm endpoint'ler JWT ile korunur.

- `POST /` — tesis oluşturur `{ name, address?, type: "home" | "business" }`
- `GET /` — çağıran kullanıcıya ait tesisleri listeler
- `GET /:id` — tek bir tesisi getirir
- `POST /:id/devices` — cihaz ekler `{ name, type: "energy_meter" | "thermostat" | "boiler", targetTemperature? }`
- `GET /:id/devices` — bir tesisin cihazlarını listeler

Domain: `Facility` (sahibi `ownerUserId` ile auth-service'teki kullanıcıya UUID referansıyla bağlanır, FK yoktur) 1—N `Device`.

## Paylaşılan paketler

- **`shared-middleware`** (`@enerjipanel/shared-middleware`) — `createAuthenticateMiddleware({ jwtSecret })`: JWT doğrulayan, `req.user`'ı dolduran Express middleware'i. Hem auth-service hem facility-service tarafından kullanılır.
- **`shared-eslint-config`** (`@enerjipanel/eslint-config`) — `neostandard` + Prettier tabanlı, tüm workspace'lerde ortak kullanılan flat ESLint config.
- **`shared-contracts`** — RabbitMQ olay şemalarının (event contracts) tutulacağı workspace; henüz boş, planlama aşamasında.

## Altyapı (docker-compose.yml)

| Servis | Image | Host portu | Amaç |
|---|---|---|---|
| `postgres-auth` | postgres:18-alpine | 5433 → 5432 | `auth_db` |
| `postgres-facility` | postgres:18-alpine | 5434 → 5432 | `facility_db` |
| `postgres-telemetry` | postgres:18-alpine | 5435 → 5432 | `telemetry_db` |
| `rabbitmq` | rabbitmq:4.3-management-alpine | 5672 (AMQP), 15672 (yönetim arayüzü) | olay tabanlı mesajlaşma |
| `redis` | redis:8.10-alpine (şifreli) | 6379 | realtime-service bağlantı/subscription durumu |

Tüm portlar lokal geliştirme için yalnızca `127.0.0.1` üzerine map'lenmiştir. Üretimde bu portların dışa kapatılması / servislerin yalnızca Docker internal network üzerinden erişilebilir olması değerlendirilmelidir.

## Kurulum

Gereksinimler: Node.js (paket versiyonları için [NOTES.md](./NOTES.md)), Docker & Docker Compose.

```bash
# 1) Bağımlılıkları kur (npm workspaces)
npm install

# 2) Ortam değişkenlerini hazırla
cp .env.example .env
cp services/auth-service/.env.example services/auth-service/.env
cp services/facility-service/.env.example services/facility-service/.env
# .env dosyalarındaki JWT_SECRET değerinin tüm servislerde aynı olduğundan emin olun
# (henüz claim'leri yeniden imzalayan bir gateway olmadığı için secret paylaşılıyor)

# 3) Altyapı container'larını ayağa kaldır (Postgres x3, RabbitMQ, Redis)
docker compose up -d

# 4) Her servis için Prisma client üret ve migration'ları uygula
npm run prisma:generate --workspace=services/auth-service
npm run prisma:migrate --workspace=services/auth-service
npm run prisma:generate --workspace=services/facility-service
npm run prisma:migrate --workspace=services/facility-service

# 5) Servisleri çalıştır (ayrı terminallerde)
npm run dev --workspace=services/auth-service       # PORT=4001
npm run dev --workspace=services/facility-service    # PORT=4002
```

### Test

```bash
npm run test --workspace=services/auth-service
npm run test --workspace=services/facility-service
```

## Yol haritası

- **Faz 0** (devam ediyor): kayıt → giriş → tesis ekleme → canlı cihaz verisini görüntüleme uçtan uca akışı; gateway, telemetry-service ve realtime-service'in tamamlanması.
- **Faz 1**: facility/device için update/delete, alert-service (eşikler, uyarılar, öngörüler), geçmiş veri/analitik sayfaları.
- **Faz 2**: MongoDB tabanlı bildirim/insight geçmişi, karanlık mod, izleme (Pino, prom-client, Grafana Cloud).

