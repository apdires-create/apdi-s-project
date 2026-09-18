# 📐 Nook Layout & Mimari Yeniden Yapılandırma Kararları (layout-fix)

> **Tarih:** 2026-09-18  
> **Amaç:** 16:9 katı en-boy oranı prangasından ve kontrolsüz `clamp()`/`cqh` formüllerinden kurtularak; tek sayfa "Nerd Kartviziti" felsefesine uygun, içerik odaklı (inside-out), tarayıcı zoom dostu ve senkron kavisli (curve) stabil bir sahne mimarisi inşa etmek.

---

## 🎯 1. Temel Felsefe ve Çözülen Çelişkiler

1. **Tek Sayfa Nerd Kartviziti (Single-Viewport Console):**
   - Masaüstünde dış sayfa kaydırması (page scroll) kesinlikle olmayacak. Her şey tek bakışta algılanabilir, bir video oyunu HUD'ı veya arcade konsolu gibi derli toplu duracak.
2. **Kenarlara Yapışma Baskısının Bitişi (Negative Space):**
   - İçeriği 4K veya geniş monitörlerin 4 köşesine sakız gibi uzatıp deforme etmeyeceğiz.
   - Konsol, ekranın ortasında ideal ergonomik boyutlarında salınacak; arka plandaki Starfield (yıldız alanı) premium bir derinlik boşluğu (breathing room) oluşturacak.
3. **Büyük Ekran & Tipografi Gerçeği:**
   - Büyük ekranda yazı devasa olmaz; kullanıcılar daha fazla çalışma alanı ve net pikseller ister.
   - Yazılar insan gözü için konforlu olan standart `rem` birimlerinde tutulacak (`13px - 16px` arası).
4. **Tarayıcı Zoom (`Ctrl +` / `Ctrl -`) Dostu Mimari:**
   - `vw/vh/cqw` ile yazıyı büyütmeye zorlamak yerine tarayıcının kendi zoom motoruna saygı duyulacak. Görme ihtiyacına göre zoom yapıldığında arayüz doğal olarak ölçeklenecek, patlama ve taşma yapmayacak.

---

## 🏗️ 2. Üç Kademeli Düzen Modeli (3-Tier Layout System)

### 🥇 Kademe 1: "Golden Ratio State" (Geniş & Standart Masaüstü)
Ortada süzülen 3 kolonlu ana konsol.

```text
+--------------------------------------------------------------------------------+
|                                    BANNER                                      |
+---------------------+-----------------------+----------------------------------+
|                     |  [ WIDGET SLOT 1 ]    |   SEKMELER (Tab Bar)             |
|   FERAH PROFİL      |                       |  +-----+ +-----+ +-----+ +-----+ |
|      KARTI          |  [ WIDGET SLOT 2 ]    |  |KART | |KART | |KART | |KART | | (1. Satır)
|  (Avatar, İsim,     |                       |  +-----+ +-----+ +-----+ +-----+ |
|   Bio, Linkler)     |  [ WIDGET SLOT 3 ]    |  +-----+ +-----+ +-----+ +-----+ |
|                     |                       |  |KART | |KART | |KART | |KART | | (2. Satır)
|                     |  (Pagination ..)      |  +-----+ +-----+ +-----+ +-----+ |
+---------------------+-----------------------+----------------------------------+
```
- **Yerleşim:** 
  - Solda: Ferah Profil Kartı (~320px – 340px).
  - Ortada: 3 adet Widget Slotu (~260px – 280px).
  - Sağda: 2 Satırlık İçerik Kartı Gridi (`1fr`, kalan alan).
- **Yükseklik:** Ekranın `vh` değerine değil, **2 satır kartın ve 3 widget'ın toplam fiziksel yüksekliğine (~520px – 540px)** kilitli.

---

### 🥈 Kademe 2: "2 + 1 Ara Düzen" (Tablet Yatay & Dar Pencereler)
Ekran genişliği 3 kolonu yan yana taşıyamayacak kadar daraldığında:

```text
+----------------------------------------------------------------+
|  [ FERAH PROFİL KARTI ]    |    [ 3'LÜ WİDGET BLOĞU ]          |  (Üst Kat: ~50% / 50%)
+----------------------------------------------------------------+
|                     İÇERİK BLOĞU                               |
|  [KART]  [KART]  [KART]  [KART]  [KART]  [KART]                |  (Alt Kat: Tam Genişlik)
|  [KART]  [KART]  [KART]  [KART]  [KART]  [KART]                |  (Yine 2 Satır)
+----------------------------------------------------------------+
```
- Profil ve Widget yan yana üst kata yerleşir (toplam genişlikleri alt kata denk gelir).
- İçerik alanı alt kata tam genişlikte iner; kartlar 5'li veya 6'lı olarak yine 2 satırda ferahça açılır.
- Dış sayfa kaydırması yine oluşmaz; tek sayfa vizyonu korunur.

---

### 🥉 Kademe 3: "Dikey Mobil Düzen" (Akıllı Telefonlar / `< 640px`)
Dikey telefon ekranına girildiğinde sahne konteyneri çözülür (`display: contents`):
```text
+------------------------+
|  BANNER                |
+------------------------+
|  PROFİL KARTI          |
+------------------------+
|  WİDGET'LAR            |
+------------------------+
|  İÇERİK BLOĞU          |
+------------------------+
```
- 3 blok doğal dikey akışla alt alta dizilir. İçerik kartları yatay kaydırma veya kompakt mobil ızgarayla sunulur. (Mevcut çalışan mobil yapı aynen korunur).

---

## 📏 3. İçeriden Dışarıya Boyutlandırma Matematiği (Inside-Out Sizing)

1. **İçerik Kartı Boyutu:**
   - Standart afiş en-boy oranı: `2 / 3`.
   - İdeal kart afiş boyutu: ~`120px - 140px` genişlik, ~`180px - 210px` yükseklik + `35px` başlık.
   - İki satır kart + aradaki gap + üstteki sekme satırı = **İçerik Alanı Tavan Yüksekliği (~520px)**.
2. **Widget Bloğu Uyumu:**
   - 520px yüksekliğin içerisine 3 widget slotu (her biri ~140px yükseklik + 12px gap + pagination) tam oturur.
3. **Profil Kartı Uyumu:**
   - Sol kolon da aynı 520px yüksekliği tek parça olarak alır. Ön yüzde ferah bio alanı, arka yüzde taşmayan link listesi oluşur.

---

## 🎨 4. Senkronize Kavis ve Easing Sistemi (Curve Harmony)

Ekrandaki her kutunun bağımsız veya ekrana göre orantısız yuvarlaklaşması engellenecek; Braun/Apple endüstriyel tasarım disiplini uygulanacak:

1. **Sabit Radius Hiyerarşisi:**
   - **Ana Dış Kasalar (`--radius-panel`):** `18px` – `20px` (Profil kutusu, İçerik ana paneli, Widget dış sınırları).
   - **İç Kartlar & Slotlar (`--radius-card`):** `12px` (Kart afişleri, widget kartları, profil link satırları).
   - **Kontroller & Butonlar (`--radius-btn`):** `8px` veya tam hap `--radius-pill: 9999px`.
   - *Değişken `vw` radius kesinlikle kullanılmayacak; her cihazda jilet gibi net kavis korunacak.*
2. **Senkron Hareket Eğrisi (Animation Curve):**
   - Tüm hover, flip, açılış ve geçişler tek bir lüks bezier eğrisine bağlanacak:
     `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1);`

---

## 📋 5. Uygulama Yol Haritası (Execution Plan)

- [x] **Adım 1:** Alınan mimari kararların `docs/layout-fix.md` içerisine kaydedilmesi.
- [x] **Adım 2:** `docs/AI_INSTRUCTIONS.md` dosyasının yeni modüler CSS ve `js/` dosya yollarına göre güncellenmesi.
- [x] **Adım 3:** 6 modüler CSS dosyasının (`tokens.css`, `base.css`, `components.css`, `landing.css`, `owner.css`, `mobile.css`) iç düzeni, isimlendirme okunabilirliği ve açıklama satırlarının elden geçirilmesi (CSS Polish).
- [ ] **Adım 4:** Proje genel incelemesi ve `layout-fix` mimarisinin kodlanması için detaylı uygulama planının hazırlanması.
- [ ] **Adım 5:** Yeni sahne mimarisinin koda işlenmesi ve test edilmesi.
