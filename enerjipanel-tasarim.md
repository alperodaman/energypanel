# EnerjiPanel — UI/UX Tasarım Sistemi

Bu doküman, EnerjiPanel'i kodlamaya başlarken referans alacağın tasarım rehberi. Renk, tipografi, sayfa sayfa yerleşim, bildirim davranışı ve erişilebilirlik dahil — hiçbir CSS bilgisi gerektirmeden uygulanabilecek netlikte yazıldı.

> **Faz notu:** Bu dokümandaki tüm sayfa/durum tanımları nihai hedefi gösterir. Faz 0 teslimi sadece Giriş/Kayıt, Dashboard'un Nabız Şeridi + tek tesis kartı, ve Tesis Detayı'nın temel halini kapsar. Geri kalan sayfalar (Geçmiş&Analiz, Bildirimler tam liste, Ayarlar) ve bildirim toast sistemi Faz 1'de uygulanır. Bkz. mimari dokümanı §0.

---

## 0. Tasarım Kararının Gerekçesi

Ürün iki farklı veri türünü birleştiriyor: **enerji** (sıcak, "yakıt/harcama" hissi) ve **konfor** (serin, "iç mekan/rahatlık" hissi). Bu ikiliği süsleme olarak değil, **bilgi olarak** kullanıyoruz: enerji verileri sıcak (ember) tonda, konfor/sıcaklık verileri soğuk (teal) tonda gösterilir. Kullanıcı bir bakışta "bu bir tüketim rakamı mı, bir sıcaklık rakamı mı" ayrımını renkten anlar — ayrı bir etiket okumasına gerek kalmaz.

Bu yüzden klasik tek-vurgu-rengi (amber tek başına) yerine **iki anlamlı vurgu rengi** kullanıyoruz.

**Önemli erişilebilirlik notu:** Renk tek başına anlam taşıyan bir sinyal olarak kullanılmaz — renk körü kullanıcılar (nüfusun yaklaşık %8'i erkeklerde) ember/teal ayrımını göremeyebilir. Bu yüzden her veri noktası renk + ikon (⚡ enerji, 🌡/🔥 konfor) kombinasyonuyla gösterilir; ikon her zaman rengin yedeği olarak tasarlanır, dekoratif değildir. Detay için bkz. §8.

> ⚠️ **TODO (kodlamaya başlarken ilk iş):** Bu dokümanda ikonlar emoji (⚡🌡🔥💡) olarak gösteriliyor — bu sadece dokümanda hızlı anlatım içindir, **gerçek üründe emoji kullanılmayacak.** Emoji render'ı işletim sistemine/tarayıcıya göre değişir (Windows'ta farklı, macOS'ta farklı görünür), tutarlı bir görsel dil için uygun değildir. Kodlamaya geçerken gerçek bir SVG ikon setine (öneri: **Lucide** — React ekosisteminde standart, ücretsiz, `lucide-react` paketiyle direkt kullanılabilir) geçilecek: ⚡→`Zap`, 🌡→`Thermometer`, 🔥→`Flame`, 💡→`Lightbulb`, 🔔→`Bell`.

---

## 1. Tasarım Tokenları

### Renk Paleti
| Token | Hex | Kullanım | Kontrast notu |
|---|---|---|---|
| `--bg` | `#FBF9F6` | Ana arka plan (sıcak beyaz, saf beyaz değil) | — |
| `--surface` | `#FFFFFF` | Kart yüzeyleri | — |
| `--text-primary` | `#241C15` | Ana metin (sıcak siyah) | `--bg` üzerinde ~16:1, AAA geçer |
| `--text-secondary` | `#6B6058` | İkincil metin | `--bg` üzerinde ~4.6:1, AA geçer (küçük metin için sınırda — 14px altı kullanımdan kaçın) |
| `--ember` | `#C2410C` | **Enerji verisi** vurgusu (tüketim, fatura, elektrik alarmları) | `--surface` üzerinde ~4.9:1, AA geçer |
| `--teal` | `#0E7490` | **Konfor verisi** vurgusu (sıcaklık, kombi, nem) | `--surface` üzerinde ~5.1:1, AA geçer |
| `--critical` | `#DC2626` | Kritik alarm | `--surface` üzerinde ~4.5:1, AA sınırında — kritik alarm metni her zaman bold + ikon ile desteklenir |
| `--success` | `#15803D` | Tasarruf/olumlu durum | `--surface` üzerinde ~4.6:1, AA geçer |
| `--border` | `#E7E1D9` | Ayraç çizgileri, kart kenarları | (dekoratif, kontrast şartı yok) |

> ⚠️ **TODO (kodlamaya başlarken ilk iş):** Yukarıdaki kontrast oranları (~4.9:1, ~5.1:1 vb.) tahmini/yaklaşık değerlerdir, gerçek bir araçla (örn. [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) veya Figma'da bir kontrast plugin'i) doğrulanmadı. İlk component'i kodlamadan önce her renk çiftini gerçek araçla ölç, bu tabloyu güncelle. Eğer bir çift AA'yı geçmiyorsa (özellikle `--critical` sınırda görünüyor), token'ı hafifçe koyulaştır — sonradan fark edip geri dönmek, baştan doğru ölçmekten çok daha maliyetli.

### Tipografi
| Rol | Font | Kullanım |
|---|---|---|
| Display (başlıklar) | **Sora** (Cabinet Grotesk lisanslı bir font olduğundan, ücretsiz/açık kaynak alternatifi olan Sora ile devam ediliyor) | Sayfa başlıkları, büyük canlı rakamlar |
| Body (gövde metin) | **Inter** | Paragraf, etiket, buton metni |
| Data (sayısal veri) | **JetBrains Mono** | Tüm sayısal değerler (kWh, °C, TL) — `font-variant-numeric: tabular-nums` |

**Neden bu ikili değil üçlü sistem:** Sayısal verinin çok olduğu bir dashboard'da, veri hep aynı monospace fontla gösterilirse gözle "bu bir ölçüm" tanınırlığı artar; başlıklarla karışmaz.

### Boşluk / Grid
- 8px temel birim (8/16/24/32/48/64)
- Kart köşe yuvarlaklığı: 12px (sıcak/yumuşak his, sert değil)
- Maks içerik genişliği: 1280px, kartlar arası 24px boşluk

### Sinyal Elemanı (Signature)
**"Nabız Şeridi"** — Dashboard'un en üstünde, sayfanın ilk göreceği şey: üç büyük canlı rakam (anlık tüketim [ember, ⚡ ikonlu], oda sıcaklığı [teal, 🌡 ikonlu], kombi durumu [teal, 🔥 ikonlu]) yan yana, her biri veri güncellendiğinde 400ms'lik yumuşak bir "nefes alma" (opacity 1→0.7→1) animasyonuyla tazelendiğini belli eder. Bu şerit ürünün "canlı" olduğunu ilk saniyede kanıtlıyor. **(Faz 0'da tam çalışır halde teslim edilir.)**

---

## 2. Sayfa Envanteri

| # | Sayfa | Faz |
|---|---|---|
| 1 | Giriş / Kayıt | 0 |
| 2 | Dashboard (ana sayfa) | 0 (Nabız Şeridi + tek tesis kartı) → 1 (tam kart grid) |
| 3 | Tesislerim (liste) | 0 (temel liste) → 1 (sparkline, çoklu tesis karşılaştırması) |
| 4 | Tesis Detayı (cihazlar) | 0 |
| 5 | Cihaz Ayarları | 1 |
| 6 | Geçmiş & Analiz | 1 |
| 7 | Bildirimler (tam liste) | 1 |
| 8 | Ayarlar (eşik tanımlama, hesap) | 1 |

---

## 3. Sayfa Sayfa Yerleşim

### 3.1 Giriş / Kayıt *(Faz 0)*
```
┌─────────────────────────────────────┐
│              [Logo]                  │
│                                       │
│         E-posta   [__________]       │
│         Şifre     [__________]       │
│                                       │
│              [ Giriş Yap ]           │
│         Hesabın yok mu? Kayıt ol     │
└─────────────────────────────────────┘
```
Sade, tek kolon, ortada. Sol/sağ boşlukta hafif ember→teal gradient bir dekoratif şerit (ürünün iki renk kimliğini ilk saniyede tanıtır — `aria-hidden="true"`, tamamen dekoratif, ekran okuyucu tarafından atlanır).

### 3.2 Dashboard (ana sayfa) — en kritik ekran
```
┌───────────────────────────────────────────────────┐
│ [Logo]  Tesis: [Ev ▾]         🔔(3)   [Avatar]     │  ← Header, bildirim burada [Faz 1: rozet+dropdown]
├───────────────────────────────────────────────────┤
│  NABIZ ŞERİDİ (canlı, pulse animasyonlu)            │  [Faz 0]
│  ⚡ 2.4 kWh    🌡 22.5°C    🔥 Kombi: Açık (24°C)   │
├───────────────────┬─────────────────┬───────────────┤
│ Bugünkü Tüketim    │ Aylık Fatura     │ Aktif        │  [Faz 1]
│ [küçük grafik]     │ Tahmini: 850 TL  │ Bildirimler  │
│                    │                  │ (son 3, kart │
│                    │                  │  içinde)     │
├───────────────────┴─────────────────┴───────────────┤
│  Tüketim Grafiği (7 gün)     [ember çizgi]           │  [Faz 1]
│  [alan grafiği - genişlik: tam]                       │
├───────────────────────────────────────────────────┤
│  Konfor & Tasarruf Önerileri (kartlar, teal vurgulu)  │  [Faz 1]
│  💡 "Kombi 3 saattir 24°C'de..." [detay →]            │
└───────────────────────────────────────────────────┘
```
**Neden bu sıra:** Nabız şeridi en üstte çünkü "şu an ne oluyor" sorusu her şeyden önce cevaplanmalı. Grafikler ve öneriler altta çünkü onlar "geçmişe bakış" — anlık olanla karıştırılmamalı.

**Faz 0 dashboard'u:** Sadece Nabız Şeridi + seçili tek tesisin cihaz kartları çalışır durumda. Diğer bölümler (fatura tahmini, öneri kartları, 7 günlük grafik) statik/placeholder olarak gösterilebilir veya tamamen Faz 1'e kadar gizlenebilir — kısmi/boş görünen bir bölüm yerine, çalışan Nabız Şeridi'ne odaklanmak Faz 0'ın izlenimini güçlendirir.

**Ev vs işletme kullanıcısı — dashboard'da ne değişiyor (bkz. mimari doküman §1):**

| | Ev kullanıcısı | İşletme kullanıcısı |
|---|---|---|
| **Faz 0'da görünen** | Header'daki "Tesis: [Ev ▾]" dropdown'u pasif/gizli (tek tesis olduğu için seçim gereksiz) — dashboard doğrudan tek tesisin verisiyle açılır | Aynı Nabız Şeridi + cihaz kartları, ama Header'daki tesis dropdown'u Faz 0'da bile aktif (kullanıcı birden fazla tesis eklemiş olabilir, dropdown ile aralarında geçiş yapar) |
| **Faz 1'de eklenen** | Aylık fatura tahmini kartı, tek grafik üzerinden 7 günlük tüketim | Yukarıdakilere ek olarak: "Tesislerim" sayfasında tesisler-arası karşılaştırma görünümü, alarm önceliği daha belirgin (işletme kullanıcısı için eşik aşımı bildirimleri dashboard'da üstte, ev kullanıcısında öneri kartları öncelikli) |

Bu ayrım karmaşık bir "mod değiştirme" mekanizması değil — dashboard bileşenleri aynı kalır, sadece **kullanıcının kaç tesisi olduğuna göre** (facility count) hangi bileşenlerin öne çıktığı/gizlendiği değişir. Yani tasarım tarafında ekstra bir "ev modu / işletme modu" toggle'ı yok, veri kendisi arayüzü şekillendiriyor.

### 3.3 Tesislerim *(Faz 0 temel, Faz 1 tam)*
Kart grid (2-3 sütun), her kartta: tesis adı, tip ikonu (ev/işletme), o tesisin son 24 saat mini-tüketim sparkline'ı (Faz 1), "Detay →". Sağ üstte "+ Yeni Tesis" butonu (ember dolgu, birincil aksiyon).

İşletme kullanıcı profili için (bkz. mimari doküman §1), Faz 1'de bu sayfaya "tesisler arası karşılaştırma" görünümü eklenmesi değerlendirilir — ev kullanıcısı için tek tesis olduğundan bu görünüm önem taşımaz, varsayılan olarak gizli kalır.

### 3.4 Tesis Detayı *(Faz 0)*
```
┌───────────────────────────────────────────┐
│ ← Tesislerim / Ev                           │
├───────────────────────────────────────────┤
│  Cihazlar                    [+ Cihaz Ekle] │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │⚡Sayaç   │ │🌡Termostat│ │🔥Kombi  │        │
│  │2.4 kWh  │ │22.5°C    │ │Açık     │        │
│  │[Ayarla] │ │[Ayarla]  │ │[Ayarla] │        │
│  └─────────┘ └─────────┘ └─────────┘        │
└───────────────────────────────────────────┘
```
Her cihaz kartı kendi tipine göre renklendirilir (elektrik=ember, termostat/kombi=teal) — dashboard'daki renk mantığıyla tutarlı. Renk + ikon her zaman birlikte, ikon tek başına da tip ayrımını taşıyabilecek şekilde.

### 3.5 Cihaz Ayarları *(Faz 1)*
Basit form: cihaz adı, (termostat/kombi ise) hedef sıcaklık slider'ı, eşik tanımlama linki ("Bu cihaz için uyarı eşiği belirle → Ayarlar"). Slider, klavye ile de kontrol edilebilir olmalı (ok tuşları ile artır/azalt), sadece mouse-drag'e bağımlı olmamalı.

### 3.6 Geçmiş & Analiz *(Faz 1)*
Üstte tarih aralığı seçici (bugün/hafta/ay/özel), altta büyük grafik (tüketim + sıcaklık overlay, iki farklı y-ekseni, ember ve teal çizgiler aynı grafikte üst üste — korelasyonu görmek için: "kombi açıkken tüketim nasıl artıyor"). Grafik verisi görsel olarak erişilemeyen kullanıcılar için altta bir özet tablo/liste alternatifi sunulur (Faz 2).

### 3.7 Bildirimler (tam liste) *(Faz 1)*
Kronolojik liste, her satırda: ikon (alarm=kırmızı üçgen, öneri=teal ampul), mesaj, zaman, "Okundu işaretle". Üstte filtre: Tümü / Alarmlar / Öneriler. Okundu/okunmadı state'i backend'de MongoDB'de tutulur (bkz. mimari doküman §2, Faz 2).

### 3.8 Ayarlar *(Faz 1)*
İki sekme: **Eşikler** (cihaz bazlı eşik tanımlama formu — metrik, operatör, değer) ve **Hesap** (ad, e-posta, şifre değiştir).

---

## 4. Bildirim Sistemi — Nerede, Nasıl Davranır *(Faz 1)*

| Yer | Davranış |
|---|---|
| **Header çan ikonu** | Her zaman görünür, okunmamış sayı rozeti. Tıklayınca dropdown: son 5 bildirim + "Tümünü Gör" linki (Bildirimler sayfasına) |
| **Toast (anlık)** | Yeni bir `alert:new` veya `insight:new` WebSocket event'i geldiğinde, ekranın **sağ alt köşesinde** 5 saniyelik toast belirir, üstüne tıklanırsa ilgili sayfaya gider. Kritik alarmlar (severity: critical) 5 saniyede kaybolmaz, elle kapatılana kadar kalır. Toast'lar `aria-live="polite"` (kritik alarmlar `assertive`) bölgesinde render edilir, ekran okuyucu kullanıcıları da bilgilendirilir |
| **Dashboard kartı** | "Aktif Bildirimler" kartı her zaman son 3 bildirimi gösterir — kullanıcı toast'ı kaçırsa bile dashboard'a girince görür |
| **Renk kodu** | Kritik alarm: kırmızı sol kenarlık + üçgen ikon; öneri: teal sol kenarlık + ampul ikon — liste taranırken tipi renk körü kullanıcılar dahil anında ayırt edilir |

---

## 5. Durum Ekranları (State'ler)

- **Boş durum (ilk kullanım):** Tesis yoksa dashboard yerine "İlk tesisini ekle" büyük CTA kartı, dekoratif basit çizgi illüstrasyon (ev silueti) *(Faz 0)*
- **Yükleniyor:** İskelet (skeleton) kartlar, spinner değil — nabız şeridi için üç gri "nefes alan" placeholder kutu *(Faz 0)*
- **Bağlantı koptu (WebSocket):** Nabız şeridinin üstünde ince turuncu şerit: "Canlı bağlantı kesildi, yeniden bağlanılıyor…" *(Faz 0)*
- **Hata:** Kırmızı değil nötr gri kutu + net mesaj + "Tekrar dene" butonu (hata rengi sadece gerçek alarm için ayrılmış, kullanıcı hata ile alarm'ı karıştırmasın) *(Faz 1)*

---

## 6. Responsive Notlar *(Faz 2)*

- Nabız şeridi mobilde 3 rakam yan yana sığmaz → dikey stack, her biri tam genişlik kart
- Sidebar yok (header + tesis seçici dropdown), bu yüzden mobil geçişi zaten kolay
- Grafikler mobilde yatay scroll yerine, gösterge aralığı otomatik daralır (7 gün yerine 3 gün varsayılan)

## 7. Hareket (Motion) Notları
- Nabız şeridi: veri güncellenince 400ms opacity pulse — **tek** animasyon kaynağı, başka yerde ekstra animasyon yok (aşırıya kaçmamak için) *(Faz 0)*
- Sayfa geçişleri: fade, 150ms — dikkat çekmeyen, sade *(Faz 1)*
- Toast giriş/çıkış: sağdan kayarak, 200ms *(Faz 1)*
- `prefers-reduced-motion` medya sorgusu tespit edildiğinde tüm animasyonlar (pulse dahil) anlık geçişe düşürülür — hareket hassasiyeti olan kullanıcılar için *(Faz 2)*

## 8. Erişilebilirlik (a11y)

- **Renk asla tek başına anlam taşımaz:** Her ember/teal ayrımı ikon ile desteklenir (§0'da açıklandı)
- **Kontrast:** Tüm metin/arka plan kombinasyonları WCAG AA hedefler (bkz. §1 tablo notları); `--critical` kırmızısı sınırda olduğundan her zaman bold + ikon ile desteklenir
- **Klavye navigasyonu:** Tüm interaktif elemanlar (form alanları, slider'lar, buton, dropdown, toast kapatma) sadece klavye ile de kullanılabilir olmalı; görünür focus ring korunur (`outline` kaldırılmaz)
- **Ekran okuyucu:** Nabız şeridindeki canlı güncellenen rakamlar `aria-live="polite"` bölgesinde; dekoratif görseller `aria-hidden`; ikon-only butonlarda (ör. bildirim çanı) `aria-label` zorunlu
- **Form hataları:** Sadece renkle değil, metin + ikon ile gösterilir, `aria-describedby` ile input'a bağlanır
- Bu madde Faz 2'de tam denetimden geçirilir (otomatik: axe-core; manuel: klavye-only gezinme testi), ancak Faz 0/1'deki tüm yeni bileşenler yukarıdaki kurallara baştan uygun yazılır — sona bırakılan bir "iyileştirme" değil, geliştirme sırasında uygulanan bir kural seti.

> **Kodlamaya başlamadan önce yapılacaklar (özet):** (1) §1'deki kontrast oranlarını gerçek bir araçla doğrula, (2) emoji ikonları Lucide (`lucide-react`) ile değiştir. İkisi de ilk component'ten önce halledilirse, sonradan tüm bileşenleri geri dönüp güncelleme riski ortadan kalkar.

## 9. Dark Mode — Roadmap Notu

Faz 0/1 kapsamı dışında. Token sistemi (`--bg`, `--surface`, `--text-primary` vb. CSS custom properties olarak tanımlı olması) ileride bir `data-theme="dark"` değişkeni ile karşılık gelen koyu tonların eklenmesini kolaylaştıracak şekilde tasarlanmıştır — mevcut token yapısı bunu baştan öngörür, ayrı bir yeniden yazım gerektirmez.
