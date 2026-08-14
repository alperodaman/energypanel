# EnerjiPanel — Akıllı Ev & İşletme Enerji + Konfor İzleme Platformu

**Stack:** Node.js (Express) + React (JavaScript) — mikroservis mimarisi, RabbitMQ, WebSocket, Redis, PostgreSQL (+ Faz 2'de MongoDB)

> **Not (teknoloji tercihi):** Proje bilinçli olarak düz JavaScript ile tasarlandı (TypeScript değil). TypeScript/NestJS deneyimi ayrı bir proje (GridOS) üzerinden gösteriliyor; bu proje spesifik olarak Node/Express/React JS stack'inde derinliği kanıtlamak için var.

---

## 0. Kapsam Planı — Faz 0 / Faz 1 / Faz 2

Bu proje tek seferde "her şey bitmiş" olarak değil, **planlı ve aşamalı** şekilde teslim ediliyor. Faz 0, ilandaki her teknik gereksinimi (JWT/REST, mikroservis mimarisi, PostgreSQL, RabbitMQ, Redis, WebSocket) tek uçtan uca akışta kanıtlayan minimum ama **tamamen çalışan** bir dilimdir.

### 🟢 Faz 0 — Uçtan Uca Çalışan Çekirdek (İlk teslim)
**Akış:** Kayıt ol → Giriş yap → Tesis/cihaz ekle → Canlı veri akışını WebSocket üzerinden Nabız Şeridi'nde gör.

Kapsanan servisler:
- **API Gateway** — auth doğrulama, REST yönlendirme (WS trafiği Gateway'den geçmez, Nginx doğrudan Realtime Service'e yönlendirir — bkz. §2.1)
- **Auth Service** — register/login/refresh, JWT
- **Facility Service** — tesis + cihaz oluşturma/listeleme (POST/GET yeterli; PATCH/DELETE Faz 1)
- **Telemetry Service** — cron ile sahte-gerçekçi veri üretimi, RabbitMQ'ya `telemetry.reading.created` publish
- **Realtime Service** — WebSocket + Redis bağlantı state, `telemetry:update` push

Kapsam dışı (Faz 0'da yok): Alert & Insights Service, eşik tanımlama, bildirim/toast sistemi, geçmiş & analiz grafiği.

**Faz 0 teslim paketi:**
- `docker-compose up` ile lokal tam ayağa kalkması (5 dakikada kurulum talimatı, README'de)
- Gerçek canlı deploy: **AWS EC2 üzerinde**, Route 53 ile `energypanel.alperodaman.com` (frontend) + `api.energypanel.alperodaman.com` (backend), Nginx container ile reverse proxy + Let's Encrypt SSL (bkz. §6)
- UptimeRobot ile dışarıdan uptime izleme (bkz. §6.5)
- 60-90 saniyelik demo video (kayıt → cihaz ekle → nabız şeridinde canlı veri)
- README (İngilizce): kurulum, mimari özeti, operations notes (§6.4), "Faz 1/Faz 2'de neler geliyor" bölümü
- Auth Service ve Facility Service için temel unit/integration testler (tüm servisler değil — test kültürünün varlığını göstermek yeterli)

### 🟡 Faz 1 — Tam Ürün (Mail sonrası, güncelleme olarak paylaşılabilir)
- **Alert & Insights Service** tam: eşik tanımlama, alarm üretimi, konfor+tasarruf önerileri
- Bildirim sistemi: header çan dropdown, toast (5 sn / kritik alarm kalıcı)
- Geçmiş & Analiz sayfası (ember/teal overlay grafik)
- Bildirimler tam liste sayfası, filtreleme
- Ayarlar sayfası (eşikler + hesap)
- Boş / yükleniyor / hata / bağlantı koptu state'leri (tasarım dokümanında tanımlı, burada uygulanıyor)
- Facility Service'te kalan CRUD uçları (PATCH/DELETE)
- **CI pipeline** (GitHub Actions): her PR'da lint + test
- Genişletilmiş test kapsamı: Alert & Insights, Telemetry, Realtime servisleri
- Pino ile yapılandırılmış (JSON) loglama + `prom-client` ile `/metrics` endpoint'leri (bkz. §6.5)

### 🔵 Faz 2 — İyileştirme Katmanı
- **MongoDB kullanımı**: bildirim okundu/okunmadı state'i ve insight geçmişi Mongo'da tutulur (ilişkisel olmayan, sık güncellenen, şema esnekliği gereken veri — Postgres yerine Mongo'nun daha uygun olduğu somut bir kullanım alanı)
- Erişilebilirlik (a11y) iyileştirmeleri — bkz. tasarım dokümanı §8
- Responsive detaylarının tam uygulanması
- Dark mode
- Rate limiting ve gelişmiş input validation'ın tüm uçlara yayılması (Faz 0'da sadece Auth'ta zorunlu)
- Grafana Cloud ile metrik görselleştirme + alerting (bkz. §6.5)
- GitHub Actions → EC2 otomatik deploy (CI/CD'nin son adımı, Faz 1'deki lint+test pipeline'ının üzerine inşa edilir)

### ⚠️ Riskler & Bilinçli Olarak Kapsam Dışı Bırakılanlar

**Riskler (Faz 0 teslimi öncesi kontrol edilecek):**
| Risk | Etki | Önlem |
|---|---|---|
| CloudAMQP free tier bağlantı/mesaj limiti | Demo sırasında RabbitMQ bağlantısı kesilebilir | Mail göndermeden hemen önce canlı akışı test et, limit dolmuşsa yeni bir free instance aç |
| Solo geliştirici, bus factor 1 | Zaman planlamasında yedek yok | Faz 0 kapsamı bilinçli dar tutuldu, buffer zaman bırakılmadan tarih taahhüt edilmiyor |
| EC2 `t3.small` kaynak sınırı (6 servis + 3 Postgres + RabbitMQ + Redis + Nginx) | Yoğun anda bellek yetersizliği | Faz 0'da monitoring (UptimeRobot) ile erken uyarı; gerekirse `t3.medium`'a geçiş hazır planda var |
| RabbitMQ mesajının iki kez teslim edilmesi (idempotency) | Aynı telemetry kaydının iki kez işlenmesi | Faz 1'de `eventId` bazlı dedup kontrolü eklenir; Faz 0'da düşük hacimli demo verisinde risk ihmal edilebilir düzeyde |

**Bilinçli olarak kapsam dışı bırakılanlar (Faz 0/1'de "unutulmadı, ertelendi"):**
- Concurrent refresh token race condition koruması (aynı anda iki refresh isteği) — Faz 2'de ele alınır
- Facility Service kullanılamaz durumdayken Telemetry Service'in davranışı (şu an tamamen event-bağımsız çalıştığı için doğrudan etkilenmiyor, ama senkron REST çağrısı eklenirse circuit breaker gerekecek) — Faz 1/2'de netleştirilir
- Production-grade secret management (bkz. §6.4) — Faz 0'da `.env`, ölçek büyürse ilk iyileştirme adayı
- Self-host monitoring (Prometheus/Grafana) yerine Grafana Cloud tercih edildi — EC2 kaynak kısıtı nedeniyle bilinçli karar (bkz. §6.5)

---

## 1. Senaryo

**Problem:** Ev/işletme sahipleri enerji tüketimlerini genelde ay sonunda faturada görüyor, günlük farkındalıkları yok. İç mekan konforu (oda sıcaklığı, kombi durumu) da genelde ayrı, entegre olmayan sistemlerle takip ediliyor.

**Çözüm:** Enerji tüketimi + iç mekan konfor verisini (sıcaklık, nem, kombi/klima durumu) tek platformda birleştiren, gerçek zamanlı cevap veren bir sistem. Tasarruf önerisi ile konfor verisi birlikte değerlendiriliyor ("kombi 3 saattir 24°C'de, dış hava müsait, 1 derece düşürsen ayda ~85 TL tasarruf" gibi).

**İki farklı kullanıcı profili (netleştirildi):**
- **Ev kullanıcısı:** Tek tesis, az sayıda cihaz (sayaç + termostat + kombi). Öncelik: günlük farkındalık, basit tasarruf önerisi. Dashboard'un varsayılan deneyimi bu profile göre optimize edilir.
- **İşletme kullanıcısı:** Çoklu tesis, çoklu cihaz, fatura tahmini ve eşik bazlı alarm önceliği daha yüksek. "Tesislerim" sayfası ve çoklu-tesis karşılaştırması bu profil için kritik (Faz 1/2'de tesisler-arası karşılaştırma grafiği eklenebilir).

Bu ayrım, Faz 1'de "Tesislerim" sayfasının işletme kullanıcısı için önceliklendirilmesini, Faz 0'ın ise tek-tesis ev senaryosuna odaklanmasını gerekçelendiriyor.

**Başarı nasıl ölçülür (gelecekte, gerçek kullanıcı verisiyle):** Bu bir portfolyo projesi olduğu için şu an ölçülecek gerçek kullanıcı yok, ama ürün düşüncesinin tamamlanması için hangi metriklerin izleneceği baştan tanımlanıyor: (1) önerilen `insight`lerin ne oranda kullanıcı tarafından uygulandığı (örn. hedef sıcaklığı öneriye göre değiştirme oranı), (2) tahmini tasarrufun (`estimatedSavings`) gerçekleşen tüketim değişimine ne kadar yakın çıktığı, (3) kritik alarmların ortalama fark edilme/onaylama süresi. Bu metrikler Faz 0/1 kapsamında toplanmıyor, ama Alert & Insights Service'in veri modeli (insight_history, Faz 2) ileride bu ölçümü yapabilecek şekilde tasarlandı.

---

## 2. Servis Haritası

| Servis | Sorumluluk | Veritabanı | Port (öneri) | Faz |
|---|---|---|---|---|
| **API Gateway** | Tek giriş noktası, auth doğrulama, REST yönlendirme (WS trafiği Nginx tarafından doğrudan Realtime Service'e yönlendirilir, bkz. §2.1 not) | — | 3000 | 0 |
| **Auth Service** | Kayıt/giriş, JWT üretimi, refresh token rotasyonu | PostgreSQL (`auth_db`) | 3001 | 0 |
| **Facility Service** | Tesis, cihaz CRUD | PostgreSQL (`facility_db`) | 3002 | 0 (temel) / 1 (tam CRUD) |
| **Telemetry Service** | Sensör verisi toplama, kalıcı hale getirme, sorgu | PostgreSQL (`telemetry_db`) | 3003 | 0 |
| **Alert & Insights Service** | Eşik kontrolü, öneri üretimi, alarm | PostgreSQL (`alert_db`) + MongoDB (bildirim okundu state, insight geçmişi) | 3004 | 1 |
| **Realtime Service** | WebSocket bağlantı yönetimi, canlı push | Redis (bağlantı state) | 3005 | 0 |

**Mesajlaşma:** RabbitMQ, topic exchange `enerjipanel.events`
**Simülasyon:** Telemetry Service içinde cron job, gerçek sensör yerine rastgele-gerçekçi veri üretir (elektrik: kWh, termostat: °C, kombi: açık/kapalı + hedef sıcaklık)

### 2.1 Mimari Prensipler

**Statelessness:**
- **Auth, Facility, Telemetry, Alert & Insights Service — tamamen stateless.** Her request kendi içinde yeterli bilgiyi taşır (JWT'deki `user_id` dahil), servis kendi belleğinde herhangi bir oturum/kullanıcı state'i tutmaz. Bu sayede her biri yatayda (birden fazla instance) sorunsuz ölçeklenebilir; herhangi bir instance herhangi bir request'i cevaplayabilir.
- **Realtime Service — bilinçli olarak stateful.** WebSocket bağlantıları doğası gereği bir instance'a "yapışır" (sticky). Bu tek istisna Redis'in neden var olduğunu açıklıyor: hangi kullanıcının hangi tesise abone olduğu bilgisi Redis'te tutulur, böylece birden fazla Realtime Service instance'ı çalışsa bile (yatay ölçek), bir event hangi instance'a düşerse düşsün doğru bağlantıya yönlendirilebilir. Bu, mimarideki **tek** state istisnasıdır ve bilinçli bir tasarım kararıdır — kaza değildir.
  - **Teknik detay (Faz 1, yatay ölçek gerektiğinde):** Socket.io'nun kendi başına birden fazla instance arasında broadcast yapabilmesi için `@socket.io/redis-adapter` paketi kullanılır. Bu adapter, Redis'in pub/sub mekanizmasını kullanarak "Instance A'daki bir bağlantıya, Instance B'de tetiklenen bir event'i" iletir. Redis burada sadece "kim hangi tesise abone" bilgisini tutmakla kalmaz, instance'lar arası mesaj köprüsü olarak da çalışır — Faz 0'da tek instance ile çalışırken bu adapter olmadan da sorun yaşanmaz, ama Faz 1/2'de yatay ölçek planlanıyorsa Faz 0'dan itibaren adapter'ı kurup terk etmemek gerekir (sonradan eklemek, bağlantı state yönetimini baştan değiştirmeyi gerektirir).
- **Gateway — stateless.** Sadece JWT doğrulama + REST yönlendirme yapar, kendi state'i yoktur.
  - **WS yönlendirme netliği:** WebSocket trafiği Gateway üzerinden **geçmez** — Nginx (§6.3), `/realtime` path'ini doğrudan Realtime Service container'ına proxy eder. Bunun nedeni, WebSocket bağlantılarının uzun ömürlü olması ve Gateway'i gereksiz bir ara katman haline getirmemesi; JWT doğrulaması bu durumda Realtime Service'in kendisi tarafından, handshake sırasında yapılır (aşağıdaki auth notuna bakın). Bu bilinçli bir kısayoldur — "Gateway her trafiğin tek giriş noktasıdır" ifadesi yalnızca REST için geçerlidir, WS için değildir.

**Database-per-service sınırları:**
- Servisler birbirinin veritabanına **doğrudan erişemez** ve cross-database foreign key **kullanılmaz** (Postgres bunu zaten farklı DB'ler arasında desteklemez, ama prensip olarak da bilinçli tercih).
- Servisler arası referans, ID bazlıdır (örn. Telemetry Service, `facilityId`'yi sadece bir string/UUID olarak tutar, Facility Service'in `facilities` tablosuna FK ile bağlanmaz). Referential integrity (örn. "bu facilityId gerçekten var mı") ilgili servisin REST API'sine senkron çağrı ile ya da event akışıyla asenkron olarak doğrulanır — hiçbir zaman DB seviyesinde değil.
- Bu, mikroservisin temel bedelidir (distributed consistency, eventual consistency riski) ama servislerin bağımsız deploy edilebilir/ölçeklenebilir olmasının önkoşuludur.

**İstisna notu — Alert & Insights Service neden iki farklı DB kullanıyor:** Servis haritasında bu servisin hem PostgreSQL (`alert_db`) hem MongoDB kullandığı görülüyor; bu, "database-per-service" prensibinin **ihlali değil**, servisin kendi sınırları içinde kalan bir tasarım kararı. Prensip "her veritabanına yalnızca sahibi servis erişir" der — "her servis yalnızca bir veritabanı teknolojisi kullanabilir" demez. Alert & Insights Service'in ilişkisel veriyi (alerts, thresholds — sabit şema, sorgu ağırlıklı) Postgres'te, şema esnekliği gereken veriyi (bildirim okundu state, insight geçmişi — sık değişen, doküman bazlı) Mongo'da tutması; her ikisine de yalnızca bu servisin dokunması koşuluyla prensiple çelişmiyor. Alternatifi (her ikisini de Postgres'te JSONB kolonlarla tutmak) daha basit olurdu ama MongoDB'nin ilan gereksinimlerinde açıkça listelenmesi ve bu senaryonun gerçek bir kullanım alanı sunması nedeniyle bilinçli olarak bu şekilde bırakıldı.

**Health check:**
- Her servis `/health` endpoint'i sunar (DB/RabbitMQ/Redis bağlantı durumunu da içeren basit bir kontrol). Docker Compose'un `depends_on`/`healthcheck` direktifleri ve Nginx'in upstream sağlık kontrolü için Faz 0'dan itibaren zorunlu (bkz. §6 — deployment EC2 üzerinde, Nginx container ile).

---

## 2.2 Veritabanı Şemaları

Her servisin kendi Prisma `schema.prisma` dosyası vardır. Servisler arası hiçbir foreign key yoktur (bkz. §2.1) — çapraz referanslar sade UUID kolonlarıdır.

### Auth Service (`auth_db`) *(Faz 0)*
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
}
```

### Facility Service (`facility_db`) *(Faz 0)*
```prisma
model Facility {
  id          String   @id @default(uuid())
  ownerUserId String   // cross-service referans, FK DEĞİL — sadece UUID
  name        String
  address     String?
  type        String   // "home" | "business"
  createdAt   DateTime @default(now())
  devices     Device[]

  @@index([ownerUserId])
}

model Device {
  id                 String   @id @default(uuid())
  facilityId         String
  facility           Facility @relation(fields: [facilityId], references: [id])
  name               String
  type               String   // "energy_meter" | "thermostat" | "boiler"
  targetTemperature  Float?
  createdAt          DateTime @default(now())

  @@index([facilityId])
}
```

### Telemetry Service (`telemetry_db`) *(Faz 0)*
```prisma
model Reading {
  id         String   @id @default(uuid())
  facilityId String   // cross-service referans, FK DEĞİL
  deviceId   String   // cross-service referans, FK DEĞİL
  deviceType String   // "energy_meter" | "thermostat" | "boiler"
  value      Float
  unit       String
  metadata   Json?
  occurredAt DateTime

  @@index([facilityId, deviceId, occurredAt(sort: Desc)])
}
```
**Büyüme notu:** Bu tablo cron ile sürekli beslendiği için en hızlı büyüyecek tablo. Faz 0/1'de composite index yeterli; veri hacmi arttıkça (örn. milyon+ satır) aylık partitioning veya TimescaleDB'ye geçiş değerlendirilir — Faz 0 kapsamında **uygulanmaz**, sadece bilinçli bir gelecek adımı olarak not düşülür (over-engineering'den kaçınmak için).

### Alert & Insights Service (`alert_db`) *(Faz 1)*
```prisma
model Alert {
  id               String   @id @default(uuid())
  facilityId       String
  relatedDeviceId  String?
  severity         String   // "warning" | "critical"
  alertType        String
  message          String
  status           String   @default("active") // "active" | "acknowledged"
  createdAt        DateTime @default(now())

  @@index([facilityId, status])
}

model Threshold {
  id         String   @id @default(uuid())
  facilityId String
  deviceId   String
  metric     String
  operator   String   // ">" | "<" | ">=" | "<="
  value      Float
  createdAt  DateTime @default(now())

  @@index([facilityId, deviceId])
}
```
Mongo tarafı (Faz 2, Mongoose ile):
```js
// notification_read_state
{ userId: String, notificationId: String, readAt: Date }

// insight_history
{ facilityId: String, insightId: String, message: String,
  estimatedSavings: { amount: Number, currency: String, period: String },
  generatedAt: Date }
```

**`estimatedSavings` hesaplama notu (bkz. PO değerlendirmesi):** Faz 1'de basit ve şeffaf bir formülle başlanır — örn. termostat için `(mevcutSıcaklık - hedefSıcaklık) × ortalamaKwhPerDerece × birimFiyat × varsayılanGünSayısı`. Gerçekçi kalibrasyon şart değil, ama hesaplama mantığı kod içinde yorum satırıyla belgelenir — "kara kutu bir sayı" olmaması önemli.

---

## 3. REST API — Endpoint Listesi

### Auth Service *(Faz 0)*
```
POST   /auth/register        { email, password, name }
POST   /auth/login           { email, password } → { accessToken, refreshToken }
POST   /auth/refresh         { refreshToken } → { accessToken }
GET    /auth/me              (JWT gerekli) → { id, email, name }
```
**Güvenlik notları (Faz 0'da zorunlu):**
- Şifreler bcrypt/argon2 ile hash'lenir
- Login endpoint'ine rate limiting (örn. `express-rate-limit`, IP başına 5 deneme/dakika)
- Input validation: Zod veya Joi ile tüm request body'leri şema doğrulamasından geçer
- Refresh token'lar DB'de saklanır, rotasyon uygulanır (her refresh'te eski token geçersiz kılınır)

### Facility Service
```
POST   /facilities                        { name, address, type: "home"|"business" }       [Faz 0]
GET    /facilities                        → kullanıcının tesisleri                          [Faz 0]
GET    /facilities/:id                                                                       [Faz 0]
PATCH  /facilities/:id                                                                        [Faz 1]
DELETE /facilities/:id                                                                        [Faz 1]

POST   /facilities/:id/devices            { name, type: "energy_meter"|"thermostat"|"boiler" } [Faz 0]
GET    /facilities/:id/devices                                                                [Faz 0]
PATCH  /devices/:id                       { name, targetTemperature? }                        [Faz 1]
DELETE /devices/:id                                                                            [Faz 1]
```

### Telemetry Service *(Faz 0)*
```
GET    /facilities/:id/telemetry          ?type=energy|temperature|boiler&from=&to=&granularity=hour|day
GET    /facilities/:id/telemetry/latest   → her cihaz tipi için son değer
GET    /devices/:id/telemetry/history     ?from=&to=
```
> Not: Bu servise dışarıdan veri girişi REST ile değil, RabbitMQ üzerinden simülatörden gelir (bkz. Event Şemaları).

### Alert & Insights Service *(Faz 1)*
```
GET    /facilities/:id/alerts             ?status=active|acknowledged
PATCH  /alerts/:id/acknowledge
GET    /facilities/:id/insights           → tasarruf/konfor önerileri listesi
GET    /facilities/:id/thresholds
POST   /facilities/:id/thresholds         { deviceId, metric, operator, value }
PATCH  /thresholds/:id
GET    /notifications/:userId/read-state  → Mongo'dan okundu/okunmadı bilgisi     [Faz 2]
```

### Realtime Service (WebSocket) *(Faz 0)*
```
Bağlantı: Socket.io client, handshake sırasında auth objesiyle:
  io("wss://api.energypanel.alperodaman.com/realtime", { auth: { token: accessToken } })

Client → Server:
  "subscribe:facility"    { facilityId }
  "unsubscribe:facility"  { facilityId }

Server → Client:
  "telemetry:update"      { facilityId, deviceId, deviceType, value, unit, timestamp }
  "alert:new"             { facilityId, alertId, severity, message, timestamp }        [Faz 1]
  "insight:new"           { facilityId, insightId, message, estimatedSavings, timestamp } [Faz 1]
```
**Auth notu:** Native tarayıcı WebSocket API'si el sıkışma (handshake) sırasında custom HTTP header göndermeyi desteklemez — bu yüzden JWT, `Authorization` header ile değil, Socket.io'nun handshake `auth` objesiyle taşınır. Sunucu tarafında `socket.handshake.auth.token` üzerinden okunup doğrulanır (`io.use()` middleware'i ile, bağlantı kurulmadan önce).

---

## 4. RabbitMQ — Event Şemaları

**Exchange:** `enerjipanel.events` (type: `topic`)
**Routing key deseni:** `<eventType>.<facilityId>.<deviceType>`

### `telemetry.reading.created` *(Faz 0)*
Yayınlayan: Telemetry Service · Dinleyen: Alert & Insights Service (Faz 1), Realtime Service
```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-11T10:15:00Z",
  "facilityId": "uuid",
  "deviceId": "uuid",
  "deviceType": "energy_meter",
  "value": 2.4,
  "unit": "kWh",
  "metadata": { "tariffPeriod": "peak" }
}
```
`deviceType` için diğer olası değerler: `thermostat` (`value`: °C, `unit`: "celsius"), `boiler` (`value`: 0/1, `metadata.targetTemperature`)

### `alert.created` *(Faz 1)*
Yayınlayan: Alert & Insights Service · Dinleyen: Realtime Service
```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-11T10:16:00Z",
  "facilityId": "uuid",
  "alertId": "uuid",
  "severity": "warning",
  "alertType": "threshold_exceeded",
  "relatedDeviceId": "uuid",
  "message": "Günlük tüketim eşiği aşıldı"
}
```

### `insight.generated` *(Faz 1)*
Yayınlayan: Alert & Insights Service · Dinleyen: Realtime Service
```json
{
  "eventId": "uuid",
  "occurredAt": "2026-08-11T10:20:00Z",
  "facilityId": "uuid",
  "insightId": "uuid",
  "insightType": "comfort_savings",
  "message": "Kombi 3 saattir 24°C'de, dış hava müsait",
  "estimatedSavings": { "amount": 85, "currency": "TRY", "period": "monthly" }
}
```

**Dayanıklılık ayarları:** Her kuyruk `durable: true`, işlenemeyen mesajlar `enerjipanel.events.dlq` dead-letter exchange'ine düşer, max 3 retry.

**Sözleşme (contract) notu:** Servisler arası event şemaları JS'te tip güvencesi olmadan tanımlandığı için, her event payload'u için JSDoc `@typedef` tanımı paylaşılan bir `shared-contracts` klasöründe tutulur. Bu, TypeScript'e geçmeden servisler arası şema kaymasını (bir servisin alan adını değiştirip diğerinin sessizce bozulmasını) editor seviyesinde erken yakalamayı sağlar.

---

## 5. Test & Kod Kalitesi Stratejisi

| Faz | Kapsam |
|---|---|
| **Faz 0** | Auth Service ve Facility Service için unit test (iş mantığı) + integration test (endpoint bazlı, en az happy-path + 1-2 hata senaryosu). ESLint + Prettier tüm servislerde aktif |
| **Faz 1** | Alert & Insights, Telemetry, Realtime servislerine test kapsamının genişletilmesi; GitHub Actions ile her PR'da otomatik lint + test |
| **Faz 2** | Kritik akışlar için (register→login→cihaz ekle→telemetry akışı) uçtan uca (e2e) test |

Test kütüphaneleri: Jest (unit/integration), Supertest (HTTP endpoint testleri).

**Linting & Formatting (Faz 0'dan itibaren aktif):**
- **ESLint** (`eslint-config-airbnb-base` veya `eslint-config-standard` temel alınarak) + **Prettier**, root'ta paylaşılan bir config paketi (`shared-eslint-config`) olarak tanımlanır, her servis bunu extend eder — servis başına farklı kural seti olmaz, tutarlılık korunur.
- Pre-commit hook (Husky + lint-staged) ile commit öncesi otomatik format/lint — CI'a düşmeden önce lokal olarak yakalanır.

---

## 6. Deployment (Faz 0) — AWS EC2

**Neden EC2 (Railway/Render yerine):** Elimde zaten bir AWS hesabı ve Route 53 üzerinden alınmış bir domain var. Bu hem maliyet açısından (free tier / düşük maliyetli `t3.small`) hem de "gerçek bir sunucuyu, DNS'i, reverse proxy'yi, SSL'i uçtan uca ben kurdum" demeyi sağladığı için tercih edildi — managed platformlar (Railway/Render) bu kısmı senin yerine hallettiği için, DevOps tarafını göstermek isteyen bir başvuru için EC2 daha güçlü bir sinyal.

### 6.1 Mimari

```
Route 53
  ├─ energypanel.alperodaman.com      → A kaydı → EC2 Elastic IP
  └─ api.energypanel.alperodaman.com  → A kaydı → EC2 Elastic IP
                                             │
                                    EC2 (t3.small, Ubuntu)
                                             │
                                   ┌─────────┴─────────┐
                                   │   Nginx (container) │  ← reverse proxy + SSL termination
                                   └─────────┬─────────┘
                    ┌───────────────┬────────┴────────┬───────────────┐
                    │               │                 │               │
              frontend (static)  gateway:3000   realtime:3005     (diğer servisler
              (Nginx serve eder)  → auth/facility/                 sadece internal
                                     telemetry'ye                  network'te,
                                     internal proxy)                dışarı açık değil)
```

### 6.2 EC2 Kurulum Adımları

1. **Elastic IP ayır ve EC2 instance'a bağla** — normal EC2 public IP'si restart'ta değişir, DNS kayıtlarını bozar. Elastic IP sabittir.
2. **Route 53'te A kayıtları:** `energypanel.alperodaman.com` ve `api.energypanel.alperodaman.com`, ikisi de Elastic IP'ye işaret eder.
3. **Security Group:** Sadece 80 (HTTP, sadece 443'e redirect için), 443 (HTTPS) ve 22 (SSH, mümkünse sadece kendi IP'ne kısıtlı) açık. Postgres/RabbitMQ/Redis portları **dışarıya asla açılmaz** — sadece Docker internal network üzerinden birbirleriyle konuşurlar.
4. **Docker + Docker Compose kurulumu** EC2 üzerinde (Ubuntu ise `apt` ile).
5. **Repo'yu EC2'ye çek, `.env` dosyalarını elle taşı** (SCP ile, Faz 0'da secret manager kullanılmıyor — bilinçli kapsam kararı, bkz. §6.4).
6. `docker-compose up -d --build` ile tüm servisler + Nginx container ayağa kalkar.

### 6.3 Nginx — Container Olarak, Docker Compose İçinde

Ayrı bir host-level Nginx kurmak yerine, Nginx de bir container olarak `docker-compose.yml`'e eklenir — bu, "her şey Docker ile yönetiliyor" tutarlılığını korur ve host makineyi kirletmez.

```yaml
# docker-compose.yml içinde örnek servis tanımı
services:
  nginx:
    image: nginx:latest
    container_name: enerjipanel-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/certbot/conf:/etc/letsencrypt:ro
      - ./nginx/certbot/www:/var/www/certbot:ro
    depends_on:
      - gateway
      - realtime-service

  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/www:/var/www/certbot
    entrypoint: >
      sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'
```

Örnek `nginx/conf.d/api.conf` (basitleştirilmiş):
```nginx
server {
    listen 80;
    server_name api.energypanel.alperodaman.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name api.energypanel.alperodaman.com;
    ssl_certificate     /etc/letsencrypt/live/api.energypanel.alperodaman.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.energypanel.alperodaman.com/privkey.pem;

    location / {
        proxy_pass http://gateway:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /realtime {
        proxy_pass http://realtime-service:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";   # WebSocket için zorunlu
    }
}
```
`energypanel.alperodaman.com` (frontend) için de aynı desende ayrı bir `conf.d` dosyası — statik build çıktısını doğrudan Nginx serve eder ya da frontend ayrı bir container olarak (basit bir `nginx:alpine` + build çıktısı) eklenir.

**İlk sertifika alımı** (`certbot/certbot` container'ı ile, tek seferlik):
```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d api.energypanel.alperodaman.com -d energypanel.alperodaman.com
```
Sonrasında yukarıdaki `certbot` servisi otomatik yeniler (12 saatte bir kontrol).

**Tüm servislerde restart policy:** `docker-compose.yml`'deki her servise `restart: always` eklenir — EC2 restart olursa (AWS bakım, manuel reboot vb.) Docker daemon açılışta tüm container'ları otomatik ayağa kaldırır, elle müdahale gerekmez.

### 6.4 Operations Notes (README'ye taşınacak — Team Lead'in soracağı sorulara hazır cevaplar)

| Soru | Cevap |
|---|---|
| **EC2 restart olursa servisler otomatik ayağa kalkıyor mu?** | Evet — tüm `docker-compose.yml` servislerinde `restart: always` policy'si var; Docker daemon sistem açılışında otomatik başlar (`systemctl enable docker`), container'lar da onunla birlikte kalkar. |
| **SSL sertifikası ne zaman expire olur, nasıl yenilenir?** | Let's Encrypt sertifikaları 90 günde bir expire olur. `certbot` container'ı 12 saatte bir `certbot renew` çalıştırır, expire tarihine 30 gün kalınca otomatik yeniler — elle müdahale gerekmez. |
| **Secrets (DB şifreleri, JWT secret) nerede tutuluyor?** | Faz 0'da `.env` dosyaları, `.gitignore`'da, EC2'ye SCP ile elle taşınıyor. Production-grade bir secret manager (AWS Secrets Manager, Doppler) kullanılmıyor — bu, kapsamı bilinçli daraltma kararı; ölçek büyürse ilk yapılacak iyileştirmelerden biri budur. |
| **Deploy nasıl yapılıyor?** | `git pull` + `docker-compose up -d --build` — elle çalıştırılan iki komut yerine bir `deploy.sh` script'ine dökülüyor (bkz. altında). CI/CD ile otomatikleştirme (GitHub Actions → EC2'ye SSH ile deploy) Faz 2'de değerlendirilir. |
| **Bir şey patlarsa loglara nasıl bakılıyor?** | `docker-compose logs -f <servis-adı>` Faz 0/1 için yeterli. Faz 1'de yapılandırılmış (structured/JSON) loglama, Faz 2'de merkezi log toplama eklenir — bkz. §6.5 Monitoring. |

`deploy.sh` (basit örnek):
```bash
#!/bin/bash
set -e
git pull origin main
docker compose up -d --build
docker image prune -f
echo "Deploy tamamlandı: $(date)"
```

### 6.5 Monitoring & Observability

Bu, ilanlarda sıkça "nice to have" ya da doğrudan aranan bir yetkinlik olduğu için, **kaynak dostu ve aşamalı** bir şekilde Faz 0'dan itibaren dahil ediliyor — EC2'nin sınırlı kaynaklarını (t3.small, 2GB RAM) zorlamayacak şekilde:

**Faz 0 — sıfır ek kaynak maliyetiyle:**
- Her serviste zaten var olan `/health` endpoint'i (bkz. §2.1)
- **UptimeRobot** (ücretsiz katman, dışarıdan/external): `api.energypanel.alperodaman.com/health` ve `energypanel.alperodaman.com` adreslerini 5 dakikada bir pingler, kesinti olursa mail/Slack bildirimi atar. EC2 üzerinde hiçbir kaynak tüketmez (tamamen dışarıdan çalışır), kurulumu 5 dakika sürer — efor/etki oranı en yüksek adım.

**Faz 1 — yapılandırılmış loglama:**
- Tüm servislerde `console.log` yerine **Pino** (JSON formatlı, hızlı bir Node.js logger) kullanılır. Bu, "log kültürü var" göstermenin ucuz ama etkili yolu — ileride bir log toplama aracına bağlanmaya hazır hale getirir.
- Her serviste `prom-client` ile temel bir `/metrics` endpoint'i (request sayısı, gecikme, hata oranı) eklenir — henüz görselleştirilmiyor, sadece expose ediliyor.

**Faz 2 — görselleştirme:**
- EC2 üzerinde ek Prometheus+Grafana container'ları çalıştırmak yerine (kaynak sıkıntısı riski), **Grafana Cloud'un ücretsiz katmanı** tercih edilir — servisler `/metrics` endpoint'lerini Grafana Cloud'a remote-write ile gönderir, görselleştirme ve alerting bulutta yapılır, EC2'ye ek yük binmez. Bu, "kaynak kısıtı olan bir ortamda doğru mimari kararı verebiliyorum" sinyalini de verir — self-host etmek her zaman "daha iyi" değildir.

**Neden bu sıralama:** UptimeRobot 5 dakikalık kurulumla en yüksek etkiyi (dışarıdan gerçek zamanlı kesinti tespiti) en düşük maliyetle sağlıyor, bu yüzden Faz 0'a alındı. Tam metrik/dashboard kurulumu ise gerçek efor gerektirir ve Faz 0'ın "hızlı, çalışan, sade" hedefiyle çelişir — bu yüzden kademeli bırakıldı.

---

## 7. Teknoloji Gerekçeleri (özet)

| Teknoloji | Neden |
|---|---|
| Express (JS, TS değil) | İlanın "Full stack Javascript development" ifadesiyle birebir uyum; TS/NestJS deneyimi ayrı proje (GridOS) üzerinden gösteriliyor |
| PostgreSQL (servis başına) | Database-per-service, ilişkisel veriye uygun |
| **Prisma** (Postgres ORM/migration) | Declarative schema + otomatik migration (`prisma migrate`), tip güvenli client (JS projelerinde de `prisma generate` ile çalışır). 2026 itibarıyla klasik Node.js backend'lerde (bizim senaryomuz — Railway/Render gibi standart Node ortamı, edge/Cloudflare Workers değil) hâlâ en olgun seçenek; Cal.com, Hashnode gibi üretimde büyük ölçekte kullanılıyor. Alternatif olan Drizzle daha çok edge/serverless (Cloudflare Workers, Bun) senaryolarında avantajlı — bizim deploy hedefimizde bu fark devreye girmiyor, bu yüzden Prisma'nın declarative migration + olgun tooling avantajı önceliklendirildi |
| MongoDB (Faz 2, Alert & Insights'ta) + Mongoose | Şema esnekliği gereken, sık güncellenen veri (bildirim okundu state, insight geçmişi) için ilişkisel olmayan model daha uygun |
| RabbitMQ | Dayanıklılık — servis geçici kapalıyken veri kaybolmamalı |
| Socket.io (ayrı serviste) | Bağlantı yönetimi iş mantığından izole, bağımsız ölçeklenir |
| Redis (Realtime'da) | Yatay ölçekte hangi kullanıcının hangi tesise abone olduğu paylaşılan state — bkz. §2.1 Statelessness |
| JWT | Stateless auth, Gateway doğrulayıp `user_id`'yi diğer servislere iletir |

## 8. Klasör Yapısı
```
enerjipanel/
  services/
    gateway/
      .env.example
      src/
    auth-service/
      .env.example
      prisma/schema.prisma
      src/
    facility-service/
      .env.example
      prisma/schema.prisma
      src/
    telemetry-service/
      .env.example
      prisma/schema.prisma
      src/
    alert-service/          ← Faz 1
      .env.example
      prisma/schema.prisma  ← Postgres taraf
      src/
    realtime-service/
      .env.example
      src/
  shared-contracts/          ← event şema JSDoc tanımları
  shared-eslint-config/      ← paylaşılan lint/format kuralları
  frontend/
    .env.example
  nginx/
    conf.d/                  ← api.conf, frontend.conf
    certbot/
      conf/                  ← Let's Encrypt sertifikaları (gitignore'da)
      www/                   ← ACME challenge dosyaları
  docker-compose.yml         → rabbitmq, redis, postgres, nginx, certbot
  deploy.sh                  → git pull + docker compose up -d --build
  .env.example                ← docker-compose için root seviye değişkenler
  .github/workflows/         ← Faz 1: lint + test CI
  README.md                  ← İngilizce, kurulum + roadmap + operations notes
```

**Not:** Her serviste ayrı `.env.example` bulunur (o servise özgü DB bağlantı string'i, port, JWT secret referansı vb.), gerçek `.env` dosyaları `.gitignore`'da. Root'taki `.env.example`, `docker-compose.yml`'in ihtiyaç duyduğu ortak değişkenleri (RabbitMQ/Redis bağlantı bilgileri gibi) kapsar.
