# بسته‌ی دارایی‌های پیکسل‌آرت — CAFENET: THE EMPIRE

نسخه‌ی ۱.۰.۰ — همه‌ی دارایی‌ها با کد تولید شده‌اند (`scripts/make_assets.py`)، پس‌زمینه‌ی شفاف، پالتِ هم‌اهنگ با مراجعِ طراحیِ بسته (پالتِ نئونِ شب).

## ساختار

```
assets/
  manifest.json          ← فهرستِ کامل + مشخصاتِ فریم‌ها
  chars/<kind>.png       ← ۱۱ شیتِ کاراکتر: ۹ نوعِ مشتری + نظیف + تعمیرکار
  tiles/floor-stages.png ← Tile Set کف: ۵ مرحله × ۲ واریانت — تایلِ ۳۶×۲۱ (هم‌_grid با شبکه‌ی برداریِ بازی)
  tiles/wall-lv{0..2}.png← تایلِ دیوار — ۳ سطحِ ارتقا، ۳۶×۷۶
  tiles/carpet.png | mat.png
  fx/{sparkle,burst,coin,levelup,smoke}.png
  ui/{coin,gem,star,trophy,energy,heart,angry,sleepy,love}.png — ۲۴×۲۴
```

## فرمتِ شیتِ کاراکتر

- فریم: **۳۲×۴۴** · شیت: ۶ ستون × ۳ ردیف (۱۹۲×۱۳۲)
- ردیف‌ها: `down / up / right` — **left در زمانِ اجرا آینه می‌شود** (`leftMirrored: true`)
- ستون‌ها: `idle, w1..w4` (چرخه‌ی ۴ فریمیِ راه‌رفتن) + `sit`
- فریم‌گزینیِ اجرایی: `frame = 1 + floor(bob*0.2) % 4` (bob = فازِ حرکتِ sim)

## نقاطِ اتصال (همه با garded fallback)

| نقطه | فایل | رفتار در نبودِ دارایی |
|---|---|---|
| کفِ سالن | `p4_scene.js → buildBG` | الگویِ تایل ۳۶×۲۱ دقیقاً هم‌grid |
| دیوار | `p4_scene.js → buildBG` | تایلِ ۳ سطحی |
| مشتریِ متحرک | `p4_scene.js → drawPerson` | walk-sheet با آینه؛ حالتِ pose (جشن/دلسردی) برداری می‌ماند |
| کارمندانِ متحرک | `p4_scene.js → drawPerson` | شیتِ clean/tech |
| ذراتِ coin/star | `p4_scene.js → drawParticles` | اسپرایتِ چرخشِ سکه و جرقه |
| افکتِ سطح | `p3_sim.js → gainXP` | حلقه‌ی levelup در مرکز |
| جرقه‌ی راه‌رفتن | `p3_sim.js → bob` | ظریف و کم‌بسامد |

لودر: `src/p9_assets.js` — `fetch('assets/manifest.json')` + `Image`؛ **روی file:// و WebView بی‌ساکت به برداری برمی‌گردد** (تست‌شده، صفر خطا).

## بازتولید

```bash
python3 scripts/make_assets.py   # همه‌ی PNGها + manifest.json
bash src/build.sh                # cafnet.html
```

## APK

`apk/cafnet-empire-v1.1.0.apk` دارایی‌ها را داخلِ `assets/assets/` دارد و Activity با `setAllowFileAccessFromFileURLs(true)` ساخته شده؛ اگر WebView اجازه ندهد، لودر بی‌صدا به برداری برمی‌گردد.
