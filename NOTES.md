# Notlar

## Hedeflenen paket versiyonları

Aşağıdaki versiyonlar sonraki adımlarda servisler kurulurken `package.json`'a `"^"` OLMADAN, sabit (exact) olarak yazılacak.

| Paket | Versiyon | Not |
|---|---|---|
| prisma / @prisma/client | 7.9.1 | |
| express | 5.2.1 | Express 5 — Express 4 pattern'leriyle karıştırma, async hata yakalama native destekli |
| socket.io / socket.io-client | 4.8.3 | |
| @socket.io/redis-adapter | 8.3.0 | |
| amqplib | 2.0.1 | |
| redis | 6.2.1 | |
| bcrypt | 6.0.0 | |
| jsonwebtoken | 9.0.3 | |
| zod | 4.4.3 | v4 API — v3'ten hata mesajı formatı farklı |
| express-rate-limit | 8.6.2 | |
| jest | 30.4.2 | |
| supertest | 7.2.2 | |
| eslint | 10.8.1 | flat config |
| prettier | 3.9.6 | |
| eslint-config-standard | 17.1.0 | kurulum anında güncel stabil, bkz. `shared-eslint-config` |
| react / react-dom | 19.2.8 | |
| vite | 8.2.1 | |
| pino / pino-http | 10.3.1 / 11.0.0 | Faz 1 |
| prom-client | 15.1.3 | Faz 1 |

## Modül sistemi standardı

Proje genelinde tüm Node.js servisleri (gateway, auth-service, facility-service, telemetry-service, realtime-service) ESM (`type: module`) kullanır — CommonJS `require`/`module.exports` kullanılmaz. Bu, auth-service'in `@prisma/adapter-pg` ile ESM import kullanma ihtiyacından doğan bilinçli bir proje geneli karardır. Yeni bir servis kurulurken bu adımların (package.json `type: module`, `.js` uzantılı relative import, Jest ESM config) baştan uygulanması gerekir, sonradan dönüştürülmesi gerekmez.

## Docker image tag'leri (docker-compose.yml)

Kurulum anında (2026-08) güncel stabil tag'ler seçildi:

- `postgres:18-alpine`
- `rabbitmq:4.3-management-alpine`
- `redis:8.10-alpine`
