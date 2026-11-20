# Backend — CAFENET monetization

REST API امن برای ثبتِ تراکنش، Ledger اتمیک و ضدِ تقلب.

## شروعِ سریع (توسعه)
```bash
npm ci
npm run build
npm test        # ۳۱ تستِ یکپارچه — PostgreSQL را خودش embed می‌کند؛ بدونِ نیازِ نصب
npm start       # برای اجرای واقعی نیازِ DATABASE_URL + JWT_SECRET در env
```

## APIها
| مسیر | متد | توضیح |
|---|---|---|
| /auth/guest | POST | ورودِ مهمان با deviceId |
| /auth/refresh | POST | چرخشِ session |
| /player/profile | GET | پروفایل + entitlements + VIP |
| /player/wallet | GET | موجودیِ Ledger |
| /shop/products | GET | محصولات (بدونِ قیمت — قیمت فقط از SDK مایکت) |
| /purchases/verify | POST | ثبتِ امنِ خرید (امضای RSA، توکنِ یکتا، idempotent) |
| /purchases/history | GET | تاریخچه |
| /purchases/restore | POST | بازیابی |
| /rewards/claim | POST | ادعای پاداشِ تبلیغ (سقفِ روزانه/cooldown/adRef یکتا) |
| /vip/status | GET | وضعیتِ اشتراک |
| /battle-pass | GET | وضعیتِ فصل |
| /battle-pass/progress | POST | افزودنِ XP (سقفِ ۲۰۰۰/درخواست) |
| /battle-pass/claim | POST | ادعای تیر (اعتبارِ تیر/پرمیوم سمتِ سرور) |
| /analytics/events | POST | رویدادها |

## جداول
players, player_sessions, wallets, wallet_ledger, products, transactions,
purchase_entitlements, reward_claims, ad_sessions, subscriptions,
battle_pass_progress, analytics_events — مهاجرت: `migrations/001_init.sql` (idempotent).

## امنیت
HTTPS (پشتِ nginx)، token-hash در DB، rate limit، ضدِ replay با UNIQUE constraint،
Ledger اتمیک با BEGIN/COMMIT، بدونِ secret در کد/گیت، خطاها بدونِ نشتِ جزئیات.
`/purchases/verify` بدونِ `IAB_PUBLIC_KEY` همهٔ خریدها را رد می‌کند (امنِ پیش‌فرض).
