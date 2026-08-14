Merhaba. Sana EnerjiPanel adında bir proje için rehberlik/planlama desteği istiyorum. Bu bir iş başvurusu için hazırladığım bir portfolyo projesi — enerji tüketimi + iç mekan konforunu (sıcaklık, kombi durumu) tek platformda birleştiren, gerçek zamanlı çalışan bir izleme sistemi.

## Sana ekte iki doküman veriyorum

1. **Mimari dokümanı** — servis haritası, veritabanı şemaları (Prisma), REST API listesi, RabbitMQ event şemaları, statelessness/database-per-service prensipleri, deployment planı (AWS EC2 + Nginx + Certbot), monitoring planı, riskler ve kapsam dışı bırakılanlar.
2. **Tasarım dokümanı** — UI/UX tasarım sistemi, renk/tipografi tokenları, sayfa sayfa yerleşim, bildirim davranışı, erişilebilirlik kuralları.

Bu dokümanlar uzun bir planlama sürecinin sonucu — birçok kişilikle (Team Lead, UI/UX Designer, Product Owner, Project Manager, İK) defalarca gözden geçirildi, tutarsızlıklar düzeltildi. **Lütfen bu dokümanlardaki kararları sorgulamadan, verili kabul ederek ilerle** (örn. neden mikroservis, neden düz JavaScript/TypeScript değil, neden Prisma gibi konular zaten netleşti — tekrar tartışmaya açmana gerek yok).

## Kapsam planı — önemli

Proje üç fazlı planlandı:
- **Faz 0**: Uçtan uca çalışan çekirdek (kayıt→giriş→tesis/cihaz ekle→canlı veri akışını izle). Şu an **buradayım**, kodlamaya Faz 0 ile başlıyorum.
- **Faz 1**: Tam ürün (bildirimler, alarm/öneri sistemi, geçmiş analiz sayfası vb.)
- **Faz 2**: İyileştirme katmanı (MongoDB kullanımı, dark mode, gelişmiş monitoring vb.)

Şimdilik sadece **Faz 0**'a odaklanıyoruz.

## Nasıl çalışacağız — bu kısım kritik

Ben kodu **Claude Code**'a yazdıracağım, sen değil. Senin görevin kod yazmak değil, **planlamak ve yönlendirmek**:

1. Kodlamaya nereden başlamam gerektiğini bana **öner** (hangi servis/parça ilk sırada olmalı, neden) ve kararı bana bırak — fikrimi sor, dayatma.
2. Ben bir başlangıç noktası onayladıktan sonra, Faz 0'ı **küçük, birbirini takip eden adımlara** böl — her adım, Claude Code'a tek seferde verebileceğim, makul büyüklükte, net bir görev tanımı olmalı (örn. "Auth Service'in Prisma şemasını ve register/login endpoint'lerini oluştur" gibi — tek adımda bütün projeyi istemek değil).
3. Her adımı tamamladıktan sonra (Claude Code'da çalıştırıp sonucu buraya getireceğim), bir sonraki adıma geçeceğiz — yani bu bir **çalışma oturumu** gibi ilerleyecek, tek seferde tüm planı verip beni başıboş bırakmayacaksın.
4. Adımların sırası mimari dokümandaki bağımlılıkları gözetmeli (örn. bir servisin diğerine ihtiyaç duyduğu yerler, docker-compose'un ne zaman devreye gireceği, testlerin nerede yazılacağı).

## İlk isteğim

Lütfen önce iki dokümanı da dikkatlice incele, sonra bana **nereden başlamamı önerdiğini** ve **neden** söyle — ama başlamadan önce benim onayımı/fikrimi al. Onayladıktan sonra Faz 0'ın tamamı için adım adım bir plan çıkaralım, ve ilk adımı Claude Code'a vermeye hazır hale getirelim.
