# EnerjiPanel

Kurulum talimatları geliştirme sürecinde eklenecek.

## Geliştirme notu

Altyapı container'larının portları (Postgres x3, RabbitMQ, Redis) lokal geliştirme için `127.0.0.1` üzerine map'lenmiştir (bkz. `docker-compose.yml` ve `.env.example`). Üretimde bu portların dışa kapatılması / servislerin yalnızca Docker internal network üzerinden erişilebilir olması değerlendirilmelidir.

Hedeflenen paket versiyonları için bkz. [NOTES.md](./NOTES.md).
