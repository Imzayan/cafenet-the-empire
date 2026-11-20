# -*- coding: utf-8 -*-
# patch26 — v1.3.0: حذفِ کاملِ بخش آنلاین + ریشه‌کنیِ صفحهٔ سیاه + سخت‌سازیِ بوت
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag, count=1):
    assert old in t, 'MISSING[%s]: %r' % (tag, old[:80])
    return t.replace(old, new, count)

# ================= p1_head.html =================
p = rd('src/p1_head.html')

# ۱) inset: → صریح (ریشهٔ صفحهٔ سیاه: inset به Chrome 87+ نیاز دارد)
p = rep(p, '#cv{position:absolute;inset:0;width:100%;height:100%}',
          '#cv{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%}', 'cv')
p = rep(p, '.ov{position:absolute;inset:0;',
          '.ov{position:absolute;top:0;right:0;bottom:0;left:0;', 'ov')
p = rep(p, '#menu .aur{position:absolute;inset:-15%;',
          '#menu .aur{position:absolute;top:-15%;right:-15%;bottom:-15%;left:-15%;', 'aur')
p = rep(p, ".crownRing::after{content:'';position:absolute;inset:5px;",
          ".crownRing::after{content:'';position:absolute;top:5px;right:5px;bottom:5px;left:5px;", 'crown')
p = rep(p, '#banner{position:absolute;inset:0;',
          '#banner{position:absolute;top:0;right:0;bottom:0;left:0;', 'banner')

# ۲) clamp → فونتِ سازگار (clamp به Chrome 79+ نیاز دارد)
p = rep(p, '.logo{font-size:clamp(44px,15vw,64px);font-weight:900;',
          '.logo{font-size:44px;font-weight:900;', 'logo')
p = rep(p, '@keyframes neon{',
          '@media(min-width:480px){.logo{font-size:64px}}\n@keyframes neon{', 'logo-media')

# ۳) حذفِ دکمهٔ آنلاین
p = rep(p, '          <button class="nbtn ghost" id="btnOnline">☁ آنلاین</button>\n', '', 'btn-online')

# ۴) حذفِ پنلِ آنلاین
p = rep(p, """  <!-- فازِ ۵ — آنلاینِ اختیاری -->
  <div id="onlineOv" class="ov" hidden>
    <div class="card" style="max-width:380px">
      <div class="pt">☁ آنلاین</div>
      <div class="ps">اختیاری و جدای از بازیِ آفلاین — حساب، ذخیره‌ی ابری و جدولِ امتیازات. سرور: <span id="onlAddr" style="direction:ltr"></span></div>
      <div id="onlBody" style="margin:10px 0;max-height:56vh;overflow:auto"></div>
      <div class="mbtns"><button class="nbtn ghost" id="onlClose">بستن</button></div>
    </div>
  </div>

""", '', 'online-ov')

# ۵) حذفِ CSS آنلاین
p = rep(p, '  .onlBox{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:10px}\n', '', 'onl-css')

# ۶) نشانِ حیات + پوششِ خطای مرئی (به‌جای صفحهٔ سیاه، پیامِ خطا دیده می‌شود)
p = rep(p, '<script>\n/* فازِ ۶ — PWA',
        """<script>
window.__BOOT_ALIVE = true;
window.onerror = function(msg, ln) {
  try {
    var e = document.getElementById('bootErr');
    if (!e) {
      e = document.createElement('div');
      e.id = 'bootErr';
      e.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#4a0d14;color:#ffd9dd;font:13px monospace,sans-serif;padding:8px 12px;direction:rtl;white-space:pre-wrap';
      document.documentElement.appendChild(e);
    }
    e.textContent = '⚠ خطا در اجرا: ' + msg + ' (خط ' + ln + ')';
  } catch (x) {}
};
/* فازِ ۶ — PWA""", 'alive-err')
wr('src/p1_head.html', p); print('p1_head OK')

# ================= p5_ui.js — حذفِ هندلرهای آنلاین =================
p = rd('src/p5_ui.js')
p = rep(p, "  $('btnOnline').onclick = () => { Sfx.tickS(); $('onlAddr').textContent = (typeof ONL !== 'undefined') ? ONL.api.replace(/^https?:\\/\\//, '') : 'localhost'; openOnline(); };\n", '', 'btnonline-h')
p = rep(p, "  $('onlClose').onclick = () => { Sfx.tickS(); hideFade('onlineOv'); };\n", '', 'onlclose-h')
wr('src/p5_ui.js', p); print('p5_ui OK')

# ================= build.sh — حذفِ p7_online =================
p = rd('src/build.sh')
p = rep(p, ' p7_online.js', '', 'build-online')
p = rep(p, '# ساختِ cafnet.html از ۱۱ ماژول', '# ساختِ cafnet.html از ۱۰ ماژول (آنلاین در v1.3.0 حذف شد)', 'build-cmt')
wr('src/build.sh', p); print('build.sh OK')

# ================= p10_update.js — نسخهٔ 1.3.0 + گاردِ fetch =================
p = rd('src/p10_update.js')
p = rep(p, "  VER: '1.2.0',", "  VER: '1.3.0',", 'ver')
p = rep(p, "  _run(url) {\n    fetch(url + '?t=' + Date.now())",
        "  _run(url) {\n    if (typeof fetch !== 'function') return; // WebViewهای خیلی قدیمی\n    fetch(url + '?t=' + Date.now())", 'fetch-guard')
wr('src/p10_update.js', p); print('p10 OK')

# ================= update.json =================
p = rd('update.json')
p = rep(p, '"version": "1.2.0"', '"version": "1.3.0"', 'ujson')
p = rep(p, '"notes": "رفعِ باگ‌های QA + آپدیتِ خودکارِ داخلِ بازی + دارایی‌های امبد"',
          '"notes": "حذفِ بخش آنلاین (بازی کاملاً آفلاین) + فیکسِ صفحهٔ سیاه روی WebViewهای قدیمی + سخت‌سازیِ بوت"', 'ujson-notes')
wr('update.json', p); print('update.json OK')

# ================= MainActivity — viewport =================
p = rd('apk/proj/smali/com/cafenet/empire/MainActivity.smali')
p = rep(p, "    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V\n",
        """    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setUseWideViewPort(Z)V

    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setLoadWithOverviewMode(Z)V
""", 'viewport')
wr('apk/proj/smali/com/cafenet/empire/MainActivity.smali', p); print('smali OK')

# ================= apktool.yml — versionCode 5 / 1.3.0 =================
p = rd('apk/proj/apktool.yml')
p = p.replace("versionCode: '4'", "versionCode: '5'").replace('versionName: 1.2.1', 'versionName: 1.3.0')
assert "versionCode: '5'" in p and 'versionName: 1.3.0' in p
wr('apk/proj/apktool.yml', p); print('yml OK')
print('patch26 done')
