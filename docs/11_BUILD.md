# راهنمای Build

## ۱) بازیِ HTML (cafenet.html)
```bash
cd src && bash build.sh          # خروجی: cafnet.html (ترتیبِ ماژول‌ها داخلِ فایلِ build)
```
- سینتکس: ماژول‌ها را با فیلترِ `<script>` به یک فایل ببر و `node --check` بگیر (اسکریپتِ تستِ CI در repo: `scripts/check_js.sh`).
- نسخهٔ بازی در `src/p10_update.js` (VER) و `update.json` باید هم‌خوان باشند.

## ۲) APK اندروید (Kotlin)
پیش‌نیاز: JDK 17+، Android SDK (platform-34، build-tools 34)، Gradle 8.7.
```bash
cd android
# sdk.dir در local.properties
gradle assembleDebug                          # خروجی: app/build/outputs/apk/debug/
gradle assembleRelease                        # امضاشده با keystoreِ پروژه
```
- keystore: `../apk/cafnet-release.keystore` (alias: cafnet) — از gradle.properties: `CAFNET_KS` / `CAFNET_KS_PASS` قابلِ تغییر.
- versionCode/versionName: `android/app/build.gradle.kts` (قانون: هر انتشار vc بالاتر از قبلی).
- کلیدهای مونتیزیشن: `android/gradle.properties` → `IAB_PUBLIC_KEY`, `TAPSELL_REWARDED_ZONE`, `TAPSELL_ZONE_IS_TEST`, `SERVER_URL` (بخشِ ۱۵_KEYS).
- خروجیِ انتشار فقط بعد از: تستِ مرورگرِ HTML + `node --check` + نصبِ debug روی دستگاهِ واقعی.

## ۳) Backend
```bash
cd backend
npm ci && npm run build && npm start          # نیازِ DATABASE_URL در env
npm test                                      # ۳۱ تستِ یکپارچه با PostgreSQLِ embed
```
