# Prognoz Markazi — Telegram futbol prognoz boti

Cloudflare Workers asosida ishlaydigan, Poisson taqsimoti orqali futbol
o'yinlariga prognoz beruvchi va Telegram kanalga avtomatik post qiluvchi bot.

## Loyiha tuzilishi

```
prognoz-markazi/
├── wrangler.toml       # Cloudflare Workers konfiguratsiyasi (cron, KV)
├── package.json
└── src/
    ├── index.js        # Asosiy fayl: cron handler, ish jarayoni
    ├── poisson.js       # Poisson modeli — prognoz hisoblash
    ├── apiFootball.js   # API-Football bilan ishlash
    └── telegram.js       # Telegram'ga post yuborish
```

## O'rnatish qadamlari

### 1. Kerakli hisoblar

- **Cloudflare hisob** — cloudflare.com (bepul reja yetarli)
- **API-Football kaliti** — api-football.com yoki RapidAPI orqali ro'yxatdan
  o'ting, bepul reja kuniga 100 so'rovga ruxsat beradi
- **Telegram bot** — Telegram'da @BotFather bilan gaplashib, `/newbot`
  buyrug'i orqali yangi bot yarating, tokenni saqlab qo'ying
- **Telegram kanal** — "Prognoz Markazi" kanalini yarating, yaratgan
  botingizni kanalga **admin** qilib qo'shing

### 2. Lokal muhitni sozlash

```bash
npm install -g wrangler
cd prognoz-markazi
npm install
wrangler login
```

### 3. KV Storage yaratish

```bash
wrangler kv:namespace create "PROGNOZ_KV"
```

Buyruq natijasida chiqqan `id` qiymatini `wrangler.toml` faylidagi
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID` o'rniga qo'ying.

### 4. Maxfiy kalitlarni qo'shish

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHANNEL_ID
wrangler secret put API_FOOTBALL_KEY
```

`TELEGRAM_CHANNEL_ID` odatda `@kanal_username` yoki `-100...` formatidagi
raqamli ID bo'ladi (kanal public bo'lmasa, raqamli ID kerak bo'ladi —
buni @userinfobot orqali topish mumkin).

### 5. Lokal sinov

```bash
npm run dev
```

Brauzerda `http://localhost:8787/run` manzilini oching — bu cron
jarayonini qo'lda ishga tushiradi va natijani ko'rsatadi.

### 6. Productionga deploy qilish

```bash
npm run deploy
```

Shundan so'ng bot `wrangler.toml`da belgilangan jadval bo'yicha
(hozirda har kuni ertalab soat 07:00, Toshkent vaqti) avtomatik ishlaydi.

## Keyingi qadamlar (yaxshilash uchun g'oyalar)

- [ ] Liga o'rtacha ko'rsatkichlarini har safar hisoblash o'rniga
      haftalik keshlash (API so'rovlarini tejash uchun)
- [ ] Postlash vaqtini o'yin boshlanishiga yaqinroq (masalan 2-3 soat oldin)
      sozlash — hozirgi versiya kunni boshida barcha o'yinlarni post qiladi
- [ ] Statistik rasm/jadval generatsiyasi (masalan Cloudflare Images yoki
      SVG-to-PNG orqali)
- [ ] Ko'proq liga qo'shish (O'zbekiston Superligasi, Champions League)
- [ ] Xatolarni Telegram orqali o'zingizga (admin) xabar qilish
