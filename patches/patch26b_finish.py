# -*- coding: utf-8 -*-
# patch26b — ادامه: build-cmt + p10 + update.json + smali + yml
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %r' % (tag, old[:80])
    return t.replace(old, new, 1)

p = rd('src/build.sh')
p = p.replace(' p7_online.js', '')
if '۸ ماژول' in p:
    p = p.replace('# ساختِ cafnet.html از ۸ ماژول', '# ساختِ cafnet.html — آنلاین در v1.3.0 حذف شد')
assert 'p7_online' not in p, 'p7 still in build'
wr('src/build.sh', p); print('build.sh OK')

p = rd('src/p10_update.js')
p = rep(p, "  VER: '1.2.0',", "  VER: '1.3.0',", 'ver')
p = rep(p, "  _run(url) {\n    fetch(url + '?t=' + Date.now())",
        "  _run(url) {\n    if (typeof fetch !== 'function') return; // WebViewهای خیلی قدیمی\n    fetch(url + '?t=' + Date.now())", 'fetch-guard')
wr('src/p10_update.js', p); print('p10 OK')

p = rd('update.json')
p = rep(p, '"version": "1.2.0"', '"version": "1.3.0"', 'ujson')
p = rep(p, '"notes": "رفعِ باگ‌های QA + آپدیتِ خودکارِ داخلِ بازی + دارایی‌های امبد"',
          '"notes": "حذفِ بخش آنلاین (بازی کاملاً آفلاین) + فیکسِ صفحهٔ سیاه روی WebViewهای قدیمی + سخت‌سازیِ بوت"', 'ujson-notes')
wr('update.json', p); print('update.json OK')

p = rd('apk/proj/smali/com/cafenet/empire/MainActivity.smali')
p = rep(p, "    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V\n",
        """    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setUseWideViewPort(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setLoadWithOverviewMode(Z)V
""", 'viewport')
wr('apk/proj/smali/com/cafenet/empire/MainActivity.smali', p); print('smali OK')

p = rd('apk/proj/apktool.yml')
p = p.replace("versionCode: '4'", "versionCode: '5'").replace('versionName: 1.2.1', 'versionName: 1.3.0')
assert "versionCode: '5'" in p and 'versionName: 1.3.0' in p
wr('apk/proj/apktool.yml', p); print('yml OK')
print('patch26b done')
