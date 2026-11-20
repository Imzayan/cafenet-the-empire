# فاز A — گزارشِ ممیزیِ کامل (پیش از تغییر) — 2026-11-20

## ۱) وضعیتِ محیطِ ساخت

| ابزار | وضعیت |
|---|---|
| Java | OpenJDK **21.0.13** ✓ (سازگار با AGP 8.5) |
| Android SDK | **نداشت** → نصب شد: platform-34 + build-tools 34.0.0 + platform-tools (458MB، نصبِ تأییدشده) |
| Gradle | **نداشت** → دانلودِ Gradle **8.7** |
| Node.js | v24.22.3 + npm 11.19.1 ✓ |
| PostgreSQL | **نداشت** → برای تستِ واقعی از باینریِ embedded-postgres استفاده می‌شود؛ راهنمای PG واقعی در مستندات |
| adb/دستگاه واقعی | **دسترس‌ناپذیر** → نصبِ روی دستگاه = NOT TESTED (شفاف گزارش می‌شود) |

## ۲) ممیزیِ پروژهٔ فعلی (هیچ‌چیز از صفر ساخته نمی‌شود)

### APKٔ فعلی (shell اندروید)
- **package**: `com.cafenet.empire` — **versionCode 7 / versionName 1.6.1** — minSdk 21 / targetSdk 34
- ساختار: **apktool-decoded**، فقط **۱ فایل smali** (MainActivity) — یعنی **سورسِ Gradle/Kotlin وجود ندارد**؛ شلِ فعلی WebView خالص است (boot.html → cafnet.html)، landscape، fullscreen، ذخیره با DOM storage.
- **یافتهٔ امنیتی مهم**: مانیفستِ فعلی فقط `VIBRATE` دارد — **اجازهٔ INTERNET نیست**؛ بنابراین آپدیت‌کنندهٔ HTML داخلِ APKٔ فعلی عملاً هرگز کار نکرده (fetch بی‌اجازه شکست می‌خورد و بی‌صدا catch می‌شود). APKٔ جدیدِ monetization اجازهٔ INTERNET+ACCESS_NETWORK_STATE می‌گیرد.
- keystore: `cafnet-release.keystore` — همان کلیدی که از v1.2.1 تا کنون همهٔ APKهای نصب‌شده روی دستگاهِ مالک را امضا کرده؛ پس آپدیتِ سازگار معتبر است.
- کتابخانه‌ها/Gradle: هیچ (پروژهٔ apktool) — منابعِ res و آیکون‌ها قابلِ انتقال.

### لایهٔ بازی (HTML5)
- ماژول‌ها: p2_core(712) p3_sim(1498) p4_scene(2004) p4b_gfx(254) p5_ui(792) p6_story(561) p7_online(142) p8_store(155) p9_assets(170) p9b_embed(42) p10_update(62) — مجموع ۶٬۳۹۲ خط؛ همه حفظ می‌شوند.
- اقتصادِ فعلی: سکه (Gold)، پولِ نقد، شهرت، XP؛ فروشگاهِ پوسته/تزئینات محلی؛ بتل‌پسِ **مسیرِ رایگانِ** فصلی (۲۰ تیر، XP از پایانِ روز) — همهِ آفلاین و سالم.
- **MOCK-TEST یافت شد** (طبق برآوردِ brief): `src/p8_store.js` — provider خرید با برچسب `MOCK-TEST` که با `setTimeout` جایزه می‌دهد + قیمتِ هاردکدِ «۹۹/۲۱۹/۴۹۹ هزار تومان» در HTML + خودآزماییِ خریدِ جعلی. → طبق قانونِ ۳ brief، از نسخهٔ انتشار حذف می‌شود و جایش provider واقعیِ Bridge می‌نشیند (قیمت فقط از SDK).
- لایهٔ آنلاینِ موجود (p7_online + server/server.js): ذخیرهٔ ابری/لیدربورد/توکنِ HMAC با ذخیره‌گاهِ JSON — بدونِ Ledger، بدونِ تراکنش؛ **جایگزینِ Backendِ تازه می‌شود** (سورسِ قدیمی دست‌نخورده می‌ماند؛ منتشر نمی‌شود).
- ذخیره‌سازی: `localStorage` با schema.version — مهاجرتِ حذفِ save ممنوع؛ فقط افزودنی.

## ۳) پشتیبان
`download/_backups/cafenet-empire-pre-monetization-20261120-1324.tar.gz` (33.9MB، کلِ ریپو بدون .git)

## ۴) نتایجِ پژوهشِ رسمی (بدونِ حدس — از مخازنِ رسمی)

### پرداختِ مایکت (github.com/myketstore/billing-sample-android)
- وابستگی: `ir.myket:billing:2.2` از مخزن `https://maven.myket.ir`
- کلاس‌ها: `ir.myket.billingclient.IabHelper` + `IabResult/Inventory/Purchase` از `ir.myket.billingclient.util`
- جریان: `startSetup` → `queryInventoryAsync(true, skus)` (قیمتِ واقعی اینجا می‌آید) → `launchPurchaseFlow`/`launchSubscriptionPurchaseFlow` → callback → **جایزهٔ مصرفی فقط پس از `consumeAsync` موفق** → `dispose` در onDestroy
- مانیفستِ placeholder: `marketApplicationId=ir.mservices.market`، `marketBindAddress=ir.mservices.market.InAppBillingService.BIND` + `<queries>` برای دیدِ بسته
- کلیدِ RSA عمومی از پنلِ مایکت (public است؛ secret نیست)؛ تأییدِ امضا داخلِ SDK + توصیهٔ سرور؛ **بدونِ این کلید، setup با خطای مودبانه قطع می‌شود** — خریدِ جعلی وجود نخواهد داشت.
- سازگاری: minSdk 21 / compileSdk 34+ ✓ با تنظیماتِ فعلی

### تبلیغات تپسل (نمونهٔ رسمیِ 2026-11: tapsellorg/TapsellMediation-AndroidSample)
- Tapsell Plus و Legacy **منسوخ**؛ راهِ فعلی = **Mediation SDK**
- وابستگی: `ir.tapsell:tapsell:1.4.0-alpha04` + آداپتورها `ir.tapsell.mediation.adapter:legacy`، `legacy-ima-extension` از `https://maven.tapsell.ir`
- APIٔ Rewarded (عینِ کدِ نمونه): `Tapsell.requestRewardedAd(zoneId, RequestResultListener{onSuccess(adId)/onFailure(msg)})` → `Tapsell.showRewardedAd(adId, activity, AdStateListener.Rewarded{ onAdClicked / onAdClosed(completionState) / onAdFailed / onAdImpression / onRewarded })` — **جایزه فقط در `onRewarded()` و یک‌بار**
- zoneهای **آزمایشیِ رسمیِ** خودِ نمونه (برای توسعه): REWARDED همه‌شبکه‌ها `1d710cc7-5e96-46ac-a3e9-8463300333e6` — تا حسابِ واقعیِ ناشرِ مالک، فقط همین محیطِ آزمایشی استفاده می‌شود (قانون: شناسهٔ جعلی ممنوع؛ این شناسه جعلی نیست، متعلق به نمونهٔ رسمیِ خودِ تپسل است و برچسبِ TEST می‌خورد).

## ۵) تصمیم‌های معماریِ قطعی
- نسخهٔ تازه: **versionCode 8 / versionName 1.7.0** با همان applicationId و همان keystore → آپدیتِ سازگار روی v1.6.1
- محتویاتِ HTML حفظ + ماژولِ تازهٔ `p11_money.js` (فروشگاهِ واقعی + جایگاه‌های تبلیغ + VIP/BP ابری) — حذفِ فقط MOCK و قیمتِ هاردکد
- بدونِ BASE_URL واقعی و بدونِ کلیدها، مونتیزیشن **خاموش** و پیامِ صادقانه — هیچ مسیرِ جعلیِ جایزه وجود ندارد
