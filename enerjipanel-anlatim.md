# EnerjiPanel — Bunu Neden Yapıyorum, Nasıl Bir Şey?

Bunu sana, bir mimara bir bina projesini anlatır gibi anlatmaya çalışacağım — çünkü aslında yaptığım şey buna çok benziyor.

---

## Neden yapıyorum?

Başvurduğum şirket (Inavitas), enerji yönetimi yazılımları yapan bir firma — yani binaların, tesislerin enerji tüketimini izleyen, optimize eden sistemler kuruyorlar. Bu şirketten daha önce bir eğitim sertifikası da almıştım.

Sadece "işte CV'm" diye başvurmak yerine, onlara "ben sizin yaptığınız işin küçük bir versiyonunu kendim baştan sona inşa ettim" diyebilmek istedim. Bu hem "ben bu işi gerçekten yapabiliyorum" demenin en güçlü yolu, hem de "sizin sektörünüzü, sizin problemlerinizi anlıyorum" mesajını veriyor.

Yani bu proje bir CV eki değil, bir **numune bina** gibi düşün — "bakın, ben böyle bir şey inşa edebiliyorum" demek için yapılmış bir gösteri projesi.

---

## Ne inşa ediyorum?

**EnerjiPanel**, bir evin ya da işletmenin elektrik tüketimini ve iç ortam konforunu (oda sıcaklığı, kombi durumu) tek bir ekrandan, **canlı olarak** gösteren bir sistem. Kullanıcı telefonuna/bilgisayarına baktığında "şu an evim ne kadar elektrik harcıyor, oda kaç derece, kombi ne yapıyor" sorusuna anında cevap alıyor. Ayrıca sistem "kombi 3 saattir gereksiz yere yüksek çalışıyor, bir derece düşürsen ayda 85 TL tasarruf edersin" gibi öneriler de veriyor.

---

## Mimari benzetmeler — sen bunları çok iyi anlarsın

### "Tek büyük bina" değil, "birbirine bağlı küçük yapılar" inşa ediyorum

Klasik bir yazılım projesi, tek bir büyük bina gibi düşünülebilir — her şey aynı çatı altında, iç içe geçmiş. Ben bunun yerine, her biri **kendi işini yapan, birbirinden bağımsız küçük yapılar** (buna "mikroservis mimarisi" deniyor) inşa ediyorum. Bir sitedeki ayrı bloklar gibi düşün:

- **Bir blok**: Kullanıcı giriş/kayıt işini yapıyor (kimlik doğrulama — bir binanın güvenlik/resepsiyon katı gibi)
- **Bir blok**: Hangi evin/tesisin hangi cihazları var, onu tutuyor
- **Bir blok**: Cihazlardan gelen veriyi (elektrik, sıcaklık) topluyor
- **Bir blok**: Bu veriyi anlık olarak kullanıcının ekranına ulaştırıyor

Her blok kendi "tapusuna" (kendi veritabanına) sahip — biri diğerinin arşivine doğrudan giremiyor, sadece resmi kapıdan (API) istek gönderebiliyor. Bunu böyle yapmamın sebebi: ilerde bir blok büyürse (mesela çok fazla kullanıcı olursa), sadece o bloğu büyütebiliyorsun, bütün binayı yıkıp yeniden yapmana gerek kalmıyor.

**Neden bunu böyle yaptım, tek bina daha kolay olmaz mıydı?** Aslında evet, tek bina (tek bir program) yazmak benim için daha hızlı olurdu. Ama başvurduğum ilan özellikle "birden fazla bağımsız yapı kurabiliyor musun" diye soruyor — ben de bunu bilerek, biraz daha zor ama tam istedikleri şekilde inşa ediyorum. Bu, senin bir müşterinin "sade bir ev yeter" dediği yerde bilerek daha karmaşık bir statik sistem kurup "bakın, büyük projeler için de yetkinim" göstermene benziyor.

### "Giriş kapısı" (Gateway) ve "resepsiyon" mantığı

Sitenin tek bir ana girişi var — herkes önce oradan geçiyor, kimliği kontrol ediliyor, sonra ilgili bloğa yönlendiriliyor. Buna "Gateway" diyoruz. Canlı veri akışı (WebSocket dediğimiz, sürekli açık kalan bir "telsiz hattı" gibi düşün) için ise ayrı, daha hızlı bir yol var — çünkü sürekli iletişim gerektiren bir şey, her seferinde resepsiyondan geçmek yerine doğrudan kendi hattından gitsin istiyoruz.

### Temel/altyapı katmanları

- **RabbitMQ**: Binalar arası "kurye" gibi — bir blok bir bilgiyi diğerine güvenli şekilde iletmek istediğinde, bu kurye üzerinden gönderiyor, kurye teslimatı garanti ediyor (biri o an kapalıysa bile mesaj kaybolmuyor, kurye bekliyor).
- **Redis**: Hızlı erişilen bir "not defteri" — "şu an kim hangi daireye bağlı" gibi anlık bilgileri burada tutuyoruz, çünkü her seferinde büyük arşive (asıl veritabanına) bakmak yavaş olurdu.
- **PostgreSQL**: Asıl, kalıcı arşiv — resmi kayıtların (kullanıcı bilgisi, tesis bilgisi, geçmiş veri) tutulduğu yer.

### İnşaat fazları — sana en tanıdık gelecek kısım burası

Bir binayı nasıl tek seferde "anahtar teslim" bitirmiyorsan (önce temel, sonra kaba inşaat, sonra ince işler, sonra dekorasyon), ben de bu projeyi fazlara ayırdım:

| Faz | Bina benzetmesi | Bu projede karşılığı |
|---|---|---|
| **Faz 0** | Temel + kaba inşaat + oturulabilir hale gelmesi | Giriş yap, bir "ev" ekle, cihazlarını gör, canlı veriyi izle — **temel işlev tam çalışıyor**, içine "oturulabiliyor" |
| **Faz 1** | İnce işler, elektrik/tesisat detayları | Uyarı sistemleri, geçmiş grafik ekranları, bildirimler — konfor katmanı |
| **Faz 2** | Dekorasyon, akıllı ev sistemleri gibi ekstralar | Karanlık tema, gelişmiş erişilebilirlik, izleme panelleri |

Yani şirkete göndereceğim şey **Faz 0** — "temeliyle, kaba inşaatıyla bitmiş, içine girilebilen, ama daha dekorasyonu yapılmamış bir yapı." Bunu göndermemin sebebi de tam olarak senin bildiğin bir şey: **bitmemiş ama yaşanabilir bir yapıyı göstermek, hiçbir şey göstermemekten çok daha iyidir.**

---

## Ne kadar sürer?

Faz 0 — yani "gösterilebilir, çalışan ilk hâl" — için hedefim Hedef: 2-2,5 hafta. Bunun içine şunlar giriyor://
- Blokların (servislerin) her birini kodlamak
- Hepsini birbirine bağlamak ve test etmek
- Gerçek bir sunucuya (kendi aldığım alan adına) yerleştirmek
- Kısa bir tanıtım videosu çekmek
- Kurulum talimatlarını yazmak

Faz 1 ve Faz 2 ise başvuru gönderildikten sonra, zaman buldukça üzerine ekleyeceğim katmanlar — "temel oturduktan sonra ince işleri yapmak" gibi, aceleye getirmeden.

---

## Özetle, bir cümleyle

Bir şirkete "ben bu işi yapabilirim" demek yerine, onların yaptığı işin küçük ama gerçek bir örneğini — temeliyle, altyapısıyla, planlı fazlarıyla — kendi başıma inşa ediyorum. Şu an temeli ve kaba inşaatı (Faz 0) bitirip, "işte anahtarı, içine girebilirsiniz" diyeceğim aşamadayım.
