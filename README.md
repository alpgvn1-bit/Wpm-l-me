# WPM Testi 🐄

Yapay zeka destekli kelime hızı ölçer. Her turda farklı metin üretilir.

## EXE Yapmak İçin

### Yöntem 1: GitHub Actions (Kolay)
1. Bu klasörü GitHub'a push et
2. Actions sekmesine git → **Build EXE** workflow'u çalıştır
3. Artifacts'tan `WPM-Testi-Setup.exe` indir

### Yöntem 2: Lokal Build
Node.js kurulu olmalı.

```bash
npm install
npm run dist
```

`dist/` klasöründe `.exe` dosyası oluşur.

## 🐄 Easter Egg
Oyun başladıktan sonra `baycow` yaz... ne olacağını gör!
