# راهنمای واردکردن کلیدها و مقادیرِ مالک

هیچ secret در APK یا گیت نمی‌رود. هر مقدارِ زیر جایِ مشخصِ خودش را دارد:

| کلید | کجا؟ | از کجا؟ | نوع |
|---|---|---|---|
| `IAB_PUBLIC_KEY` (اندروید) | `android/gradle.properties` | پنلِ توسعه‌دهندهٔ مایکت | RSA عمومی (Base64) — عمومی است ولی جایِ درستش این است |
| `IAB_PUBLIC_KEY` (سرور) | `backend/.env` | همان کلید | برای تأییدِ امضای خرید |
| `JWT_SECRET` | `backend/.env` | `openssl rand -hex 32` | **secret واقعی — هرگز گیت/APK** |
| `DATABASE_URL` | `backend/.env` | سرورِ PostgreSQL خودت | شاملِ گذرواژه — secret |
| `TAPSELL_REWARDED_ZONE` | `android/gradle.properties` | کنسولِ app.tapsell.ir | شناسهٔ zone (حساسیتِ کم) |
| `TAPSELL_ZONE_IS_TEST` | `android/gradle.properties` | — | تا وقتی zone واقعی نیست `true` |
| `SERVER_URL` | `android/gradle.properties` | دامنهٔ httpsِ مالک | خالی = مونتیزیشنِ خاموش |
| `CAFNET_KS_PASS` | gradle.properties محلی/CI | فقط مالک | secret keystore |

## چک‌لیستِ «برای انتشارِ واقعی چه چیزی از مالک لازم است؟»
1. حسابِ توسعه‌دهندهٔ مایکت + کلیدِ RSA + ساختِ ۸ محصولِ جدولِ 13_MYKET_GUIDE.md
2. حسابِ ناشرِ تپسل + zone واقعی
3. دامنه + سرور + PostgreSQL + HTTPS (بخشِ 12_BACKEND.md) → مقدارِ `SERVER_URL`
4. keystore: فایلِ `apk/cafnet-release.keystore` همان کلیدِ امضای همهٔ نسخه‌های نصب‌شده است؛ اگر مالک keystore رسمیِ دیگری دارد، فقط `CAFNET_KS`/`CAFNET_KS_PASS` را عوض کن (توجه: APK با کلیدِ متفاوت **روی نسخهٔ قبلی نصب نمی‌شود**).
