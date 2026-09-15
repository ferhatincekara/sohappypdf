---
slug: sign-pdf-in-the-browser
title: "Tarayıcıda imza: yazıcıyı ortadan kaldırmanın pratik yolu"
description: "Yazdırıp taratmadan görsel PDF imzası. Damganın kriptografik sertifika olmadığını da net söyleyen pratik bir iş akışı."
date: "2026-08-18"
author: Ferhat İncekara
role: Kurucu
cover: /images/blog/sign-pdf-in-the-browser.jpg
coverAlt: "Masada belge inceleyen eller"
toolHref: /sign-pdf
---

Günlük “şunu imzalayıp geri gönder” işinin çoğu nitelikli elektronik imza değildir. Sayfada görünen bir işarettir; operasyon PDF’i dosyalayabilsin diye. Yazdırıp ıslak imza atıp yeniden taramak, aynı işaretin yavaş halidir.

[Sign PDF](/sign-pdf) sayfaya görsel bir damga koyar. Kriptografik / PAdES imza değildir. Karşı taraf sertifika tabanlı imza istiyorsa bu araç o politikayı karşılamaz. İç yönlendirme, tedarikçi formları ve “2. sayfada bir isim yeter” işi için yazıcıyı kaldırır.

## Önünde ne olmalı

- Kilidi açık PDF. Protect ve unlock ayrı araçlardır.
- Sayfa numarası (1’den başlar).
- Konum: sayfa koordinatında `x`, `y`, `width`, `height`.
- Kısa bir `text` damgası (“Nihan Koç”) veya ek dosya olarak yüklenmiş imza görseli.

Tarayıcı aracı yerleştirmeyi adım adım gösterir. API aynı alanları `options` içinde bekler; imza görseli varsa görüntü yüklenip complete edildikten sonra `additionalFileIds[0]` olur.

## Yazıcısız, gerçekten teslim olan döngü

1. Kilitliyse [Unlock PDF](/unlock-pdf) ile aç.
2. [Sign PDF](/sign-pdf) aç, dosyayı bırak.
3. Damgayı imza satırına koy. Kutunun içinde kalsın; madde metninin üstüne binmek denetim paketinde kötü durur.
4. İmzalı PDF’i aynı oturumda indir.
5. Kendi diskinde veya DMS’te sakla. SoHappyPDF dosyaları yaklaşık iki saat sonra süresi dolar. Ürün bir arşiv değildir.

Tarih bloğu veya ilk sayfada “GİZLİ” de gerekiyorsa o [Edit PDF](/edit-pdf) veya [Watermark PDF](/watermark-pdf) işidir, ikinci bir imza değil.

## Operasyonu vuran limitler

Anonim ve Ücretsiz: günde 5 işlem, 25 MB, aynı anda 1 dosya, 50 sayfa. Free’de 80 sayfalık paket sayfa tavanında durur.

İmzalı dosyayı e-postala, iki saat sonra sekmeye dönüp indirme düğmesinin durmasını bekleme. Önce yere kaydet.

## API gövdesi

```json
{
  "sourceFileId": "FILE_ID",
  "targetFormat": "pdf",
  "type": "sign-pdf",
  "options": {
    "page": 1,
    "x": 72,
    "y": 72,
    "width": 160,
    "height": 64,
    "text": "Signed"
  }
}
```

`GET /conversions/{id}` `completed` olana kadar yokla, sonra `POST /files/{outputFileId}/download`. API anahtarlarını tarayıcıya koyma.

## Damgayı ne zaman reddetmeli

- Sözleşme nitelikli elektronik imza istiyor.
- Sertifika zinciri, zaman damgası veya uzun süreli doğrulama gerekiyor.
- PDF, resmi e-imza ürünüyle imzalanana kadar kilitli kalmalı.

Bu durumlarda e-imza tedarikçine yönlendir. “Yazdır, imzala, tara, hizanın tutmasını um” işinin geri kalanında tarayıcı damgası daha kısa yoldur.
