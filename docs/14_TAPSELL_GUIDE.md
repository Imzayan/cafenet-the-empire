# راهنمای اتصالِ تپسل (تبلیغِ جایزه‌دار)

## وضعیتِ SDK (بررسی‌شده از نمونهٔ رسمیِ نوامبرِ ۲۰۲۶)
- Tapsell Plus و Legacy **منسوخ** شده‌اند؛ نسخهٔ فعلی = **Mediation SDK**.
- وابستگی: `ir.tapsell:tapsell:1.4.0-alpha04` + `ir.tapsell.mediation.adapter:legacy` + `legacy-ima-extension` از مخزن `https://maven.tapsell.ir` ✓ در `settings.gradle.kts`.
- APIٔ استفاده‌شده در `AdsManager.kt` (عینِ الگوی نمونهٔ رسمی):
  - `Tapsell.requestRewardedAd(zoneId, RequestResultListener{onSuccess(adId)/onFailure})`
  - `Tapsell.showRewardedAd(adId, activity, AdStateListener.Rewarded{onAdImpression/onAdClicked/onAdFailed/onAdClosed(completionState)/onRewarded})`
- جایزه فقط در `onRewarded()` و فقط یک‌بار؛ سپس تأییدِ سرور (`/rewards/claim`) با سقفِ ۵/روز و cooldownِ ۳۰۰ثانیه (فایلِ `config/economy.json`).

## شناسه‌ها
- **الان (توسعه)**: zoneِ آزمایشیِ رسمیِ نمونهٔ خودِ تپسل — `1d710cc7-5e96-46ac-a3e9-8463300333e6` با `TAPSELL_ZONE_IS_TEST=true` (تبلیغِ تستی، بدونِ درآمدِ واقعی).
- **انتشار**: کنسولِ ناشر (app.tapsell.ir) → ساختِ اپلیکیشن (package: com.cafenet.empire) → ساختِ zone از نوعِ **Rewarded Video** → شناسه را در `android/gradle.properties`:
```
TAPSELL_REWARDED_ZONE=<zone-واقعی>
TAPSELL_ZONE_IS_TEST=false
```

## جایگاه‌های منطقیِ بازی (همه به یک zone تپسل نگاشت می‌شوند؛ context به سرور می‌رود)
double_income، repair، gold_drop، xp_bonus، event_bonus، mission_bonus — تعریفِ پاداش‌ها فقط در `config/economy.json` سمتِ سرور.

## محدودیت‌ها (شفاف)
- تأییدِ سمتِ سرورِ تپسل (S2S) در این نسخه استفاده نشده؛ ضدِ تقلب بر پایهٔ: جایزه فقط از `onRewarded` + تأییدِ سرور با سقفِ روزانه/cooldown/اِیدی‌یک‌بار (ad_ref یکتا). جدولِ `ad_sessions` برای شکل‌گیریِ اتصالِ S2S در آینده آماده است.
- تپسل Mediation در WebView نیست — پخشِ تبلیغ activity بومی است؛ بازگشت به بازی خودکار است.
