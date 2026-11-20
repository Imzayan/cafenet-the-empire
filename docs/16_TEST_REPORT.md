# گزارشِ تستِ کامل — وضعیتِ هر تست: PASS / FAIL / BLOCKED / NOT TESTED

## Backend (real integration — PostgreSQL embed + سرورِ واقعی + RSA واقعی) — ۳۱/۳۱ PASS
| تست | وضعیت |
|---|---|
| درخواست بدونِ Token → 401 | PASS |
| Token نامعتبر → 401 | PASS |
| auth/guest + auth/refresh | PASS |
| wallet اولیه صفر | PASS |
| فهرست ۸ محصول بدونِ قیمت | PASS |
| خرید با امضای نامعتبر → 503 مسدود | PASS |
| sku نامعلوم → 400 | PASS |
| خریدِ معتبر (RSA واقعی) → grant + wallet | PASS |
| ثبتِ دوبارهٔ همان توکن → replay بدونِ grant (idempotent) | PASS |
| توکنِ خریدِ بازیکنِ دیگر → 409 | PASS |
| تاریخچهٔ خرید | PASS |
| remove_ads → entitlement | PASS |
| vip_monthly → اشتراکِ ۳۰روزه + vip/status | PASS |
| placement نامعلوم → 400 | PASS |
| ادعای جایزه → grant + claimsLeftToday | PASS |
| cooldown → 429 | PASS |
| adRef تکراری → replay بدونِ grant | PASS |
| سقفِ روزانه (۵) → ششمی 429 | PASS |
| بتل‌پس: تیرِ قفل → 403، XP → تیر، claim → +2 سکه، دوباره → 409، پرمیوم بدونِ اشتراک → 402 | PASS |
| analytics ثبت | PASS |
| rate limit → 429 | PASS |
| restart → مهاجرتِ idempotent + سرویسِ سالم | PASS |

## بازیِ HTML (مرورگرِ واقعی — chromium headless)
| تست | وضعیت |
|---|---|
| بیلدِ 1.7.0: صفر خطا در جریانِ کاملِ بازی (شروع تا صحنهٔ روز) | PASS |
| صفرِ رشتهٔ MOCK در نسخهٔ انتشار | PASS |
| بدونِ پل: فروشگاه → پیامِ صادقانه «فقط در نسخهٔ نصب‌شده از مایکت» | PASS |
| بدونِ پل: خرید → هیچ تغییری در coins (بدونِ پاداشِ JS) | PASS |
| با پلِ هارنس: قیمتِ SDK رندر (۹٬۹۰۰/۸۹٬۰۰۰ تومانِ شبیه‌سازِ SDK) | PASS |
| با پل: خریدِ مجازِ سرور → +۵ سکه؛ دقیقاً یک callback | PASS |
| تبلیغ بدونِ fill → بدونِ جایزه؛ coins دست‌نخورده | PASS |
| جریانِ آفلاینِ کامل (مشتری/تعمیر/بتل‌پسِ رایگان) | PASS |

## اندروید (کد + بیلد)
| تست | وضعیت |
|---|---|
| بیلدِ Gradle debug | **PASS** — BUILD SUCCESSFUL، app-debug.apk (13.9MB) |
| بیلدِ Gradle release | **PASS** — BUILD SUCCESSFUL، app-release.apk (11.5MB) |
| دِکودِ APKٔ release: versionCode=8 / versionName=1.7.0 | **PASS** |
| امضای release: SHA-256 گواهی `534f155a…d87e4` = همان امضای v1.6.1 | **PASS** (آپدیتِ سازگار) |
| resources.arsc: Stored 0٪ | **PASS** |
| bundle داخلِ APK: VER 1.7.0 + ۹ asset | **PASS** |
| نصب روی دستگاهِ واقعی | **NOT TESTED** — adb/دستگاه در این محیط در دسترس نیست |
| خرید واقعی مایکت روی دستگاه | **BLOCKED** — نیازمندِ کلیدِ پنلِ مالک + حسابِ مایکت |
| تبلیغ واقعی تپسل روی دستگاه | **BLOCKED** — نیازمندِ zone واقعی (الان zoneِ آزمایشیِ رسمی) |
| ANR/crash/حافظه روی دستگاه | NOT TESTED — نیازمندِ دستگاه |

> نکتهٔ شفاف: کلیدِ AppKey تپسل داخلِ بیلد فعلی، کلیدِ آزمایشیِ رسمیِ نمونهٔ خودِ تپسل است (`TAPSELL_ZONE_IS_TEST=true`)؛ کلیدِ RSA مایکت و SERVER_URL عمداً خالی‌اند تا هیچ مسیرِ جعلیِ پول/جایزه وجود نداشته باشد.

## راه‌اندازیِ real-world Backend (دامنه/HTTPS/PG واقعی)
BLOCKED — نیازمندِ سرور/دامنهٔ مالک؛ راهنمای کامل در 12_BACKEND.md.

> هیچ تستِ شبیه‌سازی‌شده‌ای به‌عنوان واقعی معرفی نشده است.
