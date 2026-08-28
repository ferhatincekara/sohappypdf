---
slug: compress-pdf-without-losing-quality
title: "PDF’i 1 MB altına indirip kaliteyi nasıl korursun"
description: "E-posta ve yükleme limitleri için sıkıştır; her görseli ezmeden seviye seç. Metin ile fotoğrafı ayır, süre dolmadan indir."
date: "2026-08-14"
author: Ferhat İncekara
role: Kurucu
cover: /images/blog/compress-pdf-without-losing-quality.jpg
coverAlt: "Kahve fincanının yanında belge gösteren bir dizüstü bilgisayar"
toolHref: /compress-pdf
---

“Bunu küçült” acil durumlarının çoğu e-posta limiti, form yüklemesi ve birkaç megabaytı reddeden sohbet uygulamalarıdır. Her zaman 200 KB’lık dosya gerekmez. Telefonda açıldığında hâlâ orijinale benzeyen bir dosya gerekir.

[Compress PDF](/compress-pdf) üç seviye sunar: `low`, `medium`, `high`. Ortadan başla. İlk geçiş hâlâ büyükse `high` dene.

## PDF’i asıl şişiren şey

- Kamera çözünürlüğünde tam sayfa fotoğraf ve tarama
- İhtiyacın olmayan gömülü fontlar
- 300 DPI slayt dışa aktarımı
- Zaten sıkıştırılmış, sonra masaüstü uygulamadan yeniden kaydedilmiş dosya

Metin ağırlıklı sözleşmeler kahramanca sıkıştırma istemez. Görsel ağırlıklı sunumlar ister.

## Seviyeyi bilinçli seç

- **Low** daha fazla görsel ayrıntı bırakır. Baskıya yakın iş veya okunması gereken imza fotoğrafları için.
- **Medium** varsayılandır. E-posta için ilk denemedir.
- **High** sert tavanlar içindir (birçok portal hâlâ “1 MB altı” der). Sonuçta kanıtla. Göndermeden fotoğraflara ve küçük yazıya zoom yap.

High hâlâ yetmiyorsa genelde taramayla savaşıyorsundur. Aranabilir metin de istiyorsan [OCR PDF](/ocr-pdf) ayrı bir iştir ve Pro’dadır. Sıkıştırma metin katmanı eklemez.

## Aynı dosyayı sonsuza kadar döndürme

Her çalışma bir işlemdir. Anonim ve Ücretsiz hesaplar günde 5 hak alır. Zaten küçük bir dosyayı tekrar sıkıştırmak kaliteyi yer, anlamlı byte kazandırmaz. Orijinali sakla. Bir kez sıkıştır. Tavanı aşarsa [Extract pages](/extract-pages) ile gerçekten gereken sayfaları al, o alt kümeyi sıkıştır.

Free girişte 25 MB ve 50 sayfa tavanı da koyar. 60 sayfalık tarama başlamaz. Pro dosya tavanını 1 GB yapar ve sayfa tavanını kaldırır.

## Çıktıya tasarımcı gibi bak

Sonucu açıp şunlara bak:

1. İlk sayfadaki logolar
2. Küçük dipnotlar
3. İnsan veya ürün fotoğrafları
4. İnce çizgili tablolar

Bu dördü hâlâ okunuyorsa iş bitti. Yazı dağılırsa `medium`e dön ve kullanılmayan sayfaları düş.

## API notu

`POST /conversions` gövdesi `"type": "compress-pdf"`, `"targetFormat": "pdf"` ve `"options": { "level": "medium" }`. `completed` olana kadar yokla, sonra indir. Dosyalar yaklaşık iki saat sonra süresi dolar — kullanıcıya lazımsa sonucu kendi deponda tut.

## Kısa tarif

1. Orijinali sakla.
2. `medium` ile sıkıştır.
3. Portal hâlâ reddederse bir kez `high` dene.
4. Hâlâ büyükse önemli sayfaları çıkar, onları sıkıştır.

Bu sıra çoğu sunumu 1 MB altına indirir; her fotoğrafı gürültüye çevirmez.
