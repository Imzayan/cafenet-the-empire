# راهنمای اتصالِ مایکت (پرداختِ واقعی)

## ۱) حسابِ توسعه‌دهنده
- ثبت‌نام در پنلِ توسعه‌دهندگانِ مایکت (myket.ir) → ساختِ اپلیکیشن با **package: com.cafenet.empire** (دقیقاً).
- در پنل، بخشِ «درآمدزایی/پرداخت درون‌برنامه‌ای» را فعال و **کلیدِ RSA عمومی (Base64)** را کپی کن.

## ۲) محصولات — شناسه‌ها باید دقیقاً این‌ها باشند
| شناسه | نوع | عنوانِ پیشنهادی |
|---|---|---|
| gold_pack_1 | مصرفی | بسته کوچک سکه (۱۰ سکه) |
| gold_pack_2 | مصرفی | بسته متوسط سکه (۲۵ سکه) |
| gold_pack_3 | مصرفی | بسته بزرگ سکه (۶۰ سکه) |
| diamond_pack_1 | مصرفی | بسته کوچک الماس (۵۰) |
| diamond_pack_2 | مصرفی | بسته بزرگ الماس (۱۲۰) |
| starter_bundle | مصرفی | بسته شروع (۱۵سکه+۳۰الماس+پوسته+۲تعمیر) |
| remove_ads | غیرمصرفی | حذف تبلیغات غیرجایزه‌دار |
| vip_monthly | اشتراک | عضویت ماهانه VIP |

- قیمت‌ها فقط در پنلِ مایکت تنظیم می‌شوند؛ بازی قیمت را از SDK می‌گیرد (`queryInventoryAsync`) — هیچ قیمتی در کد نیست.
- نوعِ هر محصول در `config/products.json` و جدولِ `products` دیتابیس هم باید همین باشد.

## ۳) کلیدِ RSA در پروژه
`android/gradle.properties`:
```
IAB_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...   (کلیدِ پنل — عمومی است، ولی جای درستش اینجا/CI است)
```
همین کلید در backend هم لازم است: `backend/.env` → `IAB_PUBLIC_KEY=...` (برای تأییدِ امضای سمتِ سرور).

## ۴) نسخهٔ SDK و کلاس‌ها (طبق مستنداتِ رسمیِ myketstore/billing-sample-android)
- `ir.myket:billing:2.2` از مخزن `https://maven.myket.ir` (در settings.gradle.kts ✓)
- کلاس‌ها: `IabHelper.startSetup` → `queryInventoryAsync(true, skus)` → `launchPurchaseFlow`/`launchSubscriptionPurchaseFlow` → `handleActivityResult` در `onActivityResult` → `consumeAsync` برای مصرفی‌ها → `dispose` در onDestroy.
- placeholderهای مانیفست: `marketApplicationId=ir.mservices.market`، `marketBindAddress=ir.mservices.market.InAppBillingService.BIND` ✓ در build.gradle.kts.
- قواعدِ پیاده‌شده در `BillingManager.kt`: developerPayload یکتا برای هر خرید + تطبیق، تحویلِ جایزه فقط بعد از `consumeAsync` موفق، صفِ تلاشِ مجدد برای قطعِ اینترنت، مدیریتِ لغو/ناموفق/Pending، بازیابیِ خرید با `queryInventoryAsync`.

## ۵) تست
- تا وقتی `IAB_PUBLIC_KEY` خالی باشد: setup billing fail می‌شود و دکمه‌ها پیامِ «پرداخت در این نسخه تنظیم نشده است» می‌دهند — عمداً؛ هیچ مسیرِ جعلی وجود ندارد.
- بعد از تنظیمِ کلید: یک خریدِ واقعیِ ارزان (gold_pack_1) از حسابِ تستِ خودت → بررسیِ تراکنش در جدولِ `transactions` و Ledger.
