# راهنمای بسته‌بندی در Android Studio — CAFENET: The Empire v3.0

بازی با **WebView اندروید** اجرا می‌شود؛ کل پروژه در `assets/` برنامه قرار می‌گیرد و با `loadUrl("file:///android_asset/index.html")` باز می‌شود. هیچ کتابخانه یا اینترنتی لازم نیست.

> اگر نمی‌خواهی Android Studio را باز کنی: فایل آمادهٔ **`cafenet-empire-v3.0.0.apk`** همین حالا قابل نصب است (نسخهٔ امضاشده با همان کلید نسخه‌های قبلی).

## گام ۱ — ساخت پروژه

1. Android Studio → **New Project** → **Empty Views Activity**
2. نام: `Cafenet Empire` — Package: `com.cafenet.empire`
3. زبان: **Java** (یا Kotlin) — Minimum SDK: **API 21 (Lollipop)**

## گام ۲ — کپی بازی

پوشهٔ کامل بازی را در `app/src/main/assets/` کپی کن؛ نتیجه باید این‌شکلی باشد:

```
app/src/main/assets/
├── index.html
├── game.js
├── assets.js
├── css/style.css
└── assets/
    ├── characters/  (20 PNG)
    ├── furniture/   (24 PNG)
    ├── signs/       (4 PNG)
    └── ui/          (20 PNG)
```

## گام ۳ — MainActivity

```java
public class MainActivity extends Activity {
    private WebView wv;
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        wv = new WebView(this);
        setContentView(wv);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);              // الزامی — موتور بازی
        s.setDomStorageEnabled(true);              // الزامی — ذخیرهٔ localStorage
        s.setAllowFileAccess(true);                // خواندن فایل‌های محلی
        s.setAllowFileAccessFromFileURLs(true);    // ساخت اندروید ۱۱+
        s.setMediaPlaybackRequiresUserGesture(false);
        wv.setWebChromeClient(new WebChromeClient());
        wv.setWebViewClient(new WebViewClient());
        wv.loadUrl("file:///android_asset/index.html");
    }
    @Override public void onBackPressed() { }        // بازی پس‌زمینه را خودش مدیریت می‌کند
    @Override protected void onPause() { super.onPause(); wv.onPause(); }
    @Override protected void onResume() { super.onResume(); wv.onResume(); }
}
```

## گام ۴ — AndroidManifest.xml

```xml
<application
    android:hardwareAccelerated="true"
    android:label="کافه‌نت: امپراتوری"
    android:icon="@mipmap/ic_launcher">
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:configChanges="orientation|screenSize|keyboardHidden"
        android:screenOrientation="fullSensor">
        <intent-filter>
            <action android:name="android.intent.action.MAIN"/>
            <category android:name="android.intent.category.LAUNCHER"/>
        </intent-filter>
    </activity>
</application>
```

- **بدون مجوز INTERNET** — بازی ۱۰۰٪ آفلاین است؛ هرچه اضافه شود فقط هشدار کاربر می‌خرد.
- `configChanges` الزامی است تا هنگام چرخش گوشی اکتیویتی از نو ساخته نشود (وگرنه بازی ری‌استارت می‌شود).
- `fullSensor` یعنی هم پرتره هم لنداسکیپ — بازی هر دو را ساپورت می‌کند.

## گام ۵ — اجرا و امضا

- **تست:** دکمهٔ Run (نصب debug).
- **انتشار:** `Build → Generate Signed Bundle/APK → APK` با keystore خودت؛ یا نسخهٔ آماده:

```bash
# با خط فرمان (apktool خطِ ساختِ همین پروژه):
java -jar apktool.jar b proj -o unsigned.apk
zipalign -f 4 unsigned.apk aligned.apk
java -jar lib/apksigner.jar sign --ks cafnet-release.keystore \
     --ks-key-alias cafnet --ks-pass pass:XXXX --out signed.apk aligned.apk
apksigner verify --print-certs signed.apk
```

## نکات مهم

| نکته | چرا |
|---|---|
| `domStorageEnabled(true)` | بدون آن `localStorage` کار نمی‌کند و پیشرفت ذخیره نمی‌شود |
| `hardwareAccelerated(true)` | روان‌بودن Canvas روی گوشی ضعیف |
| بدون `fetch()` در کد | روی `file://` بعضی WebViewها fetch محلی را می‌بندند؛ بازی فقط از `Image()` استفاده می‌کند |
| `imageSmoothingEnabled=false` | در کد ست شده — پیکسل‌آرت شارپ می‌ماند |
| ذخیرهٔ خودکار | هر ۸ ثانیه + هنگام خروج؛ کلید: `cafenet_empire_v3` |
