<script>
/* ============ آپدیتِ خودکار (فازِ UPD) ============
 * روی APK/file://: در هر بازشدن، update.json را از ریپو می‌خواند؛ اگر نسخه‌ای تازه‌تر
 * منتشر شده باشد، cafnet.html را می‌گیرد، در localStorage ذخیره می‌کند و بارِ بعدیِ
 * بازکردنِ بازی از boot.html نسخه‌ی تازه اجرا می‌شود — بدونِ نصبِ APKِ جدید.
 * روی http(s) (نسخه‌ی هاست‌شده) غیرفعال است چون فایلِ هاست‌شده همیشه تازه است.
 * ذخیره‌ی بازی دست‌نخورده می‌ماند (همان origin و همان localStorage).
 */
const UPD = {
  VER: '1.7.1',
  URL: 'https://raw.githubusercontent.com/Imzayan/cafenet-the-empire/main/update.json',

  cmp(a, b) {
    const A = String(a).split('.').map(Number), B = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { const d = (A[i] || 0) - (B[i] || 0); if (d) return d; }
    return 0;
  },

  check() {
    try {
      // پاکسازیِ bundleِ کهنه‌تر از کدِ در حالِ اجرا
      const bv = localStorage.getItem('cafnet_bundle_ver');
      if (bv && this.cmp(bv, this.VER) < 0) {
        localStorage.removeItem('cafnet_bundle');
        localStorage.removeItem('cafnet_bundle_ver');
      }
      if (!location.protocol.startsWith('file:')) return;  // نسخه‌ی هاست‌شده خودش تازه است
      if (!navigator.onLine) return;
      const t = localStorage.getItem('cafnet_upd_test');   // فقط برای تستِ محلی
      setTimeout(() => this._run(t || this.URL), 6000);
    } catch (e) {}
  },

  _run(url) {
    if (typeof fetch !== 'function') return; // WebViewهای خیلی قدیمی
    fetch(url + '?t=' + Date.now())
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(m => {
        if (!m || !m.version || !m.url) return;
        if (this.cmp(m.version, this.VER) <= 0) return; // همین نسخه یا قدیمی‌تر
        if (localStorage.getItem('cafnet_updating')) return;
        localStorage.setItem('cafnet_updating', '1');
        fetch(m.url + '?t=' + Date.now())
          .then(r => { if (!r.ok) throw 0; return r.text(); })
          .then(html => {
            localStorage.removeItem('cafnet_updating');
            if (html.length < 100000 || html.indexOf('</html>') < 0) return;
            /* سلامتِ محتوا: نسخه‌ی امبدشده در خودِ فایل باید تازه‌تر از نسخه‌ی در حالِ اجرا باشد —
               جلوگیری از rawِ stale (برچسبِ تازه + کدِ قدیمی = قفلِ ابدی روی نسخه‌ی کهنه) */
            const mv = (html.match(/VER:\s*'([0-9]+\.[0-9]+\.[0-9]+)'/) || [])[1];
            if (!mv || this.cmp(mv, this.VER) <= 0) return; // فایلِ ناهماهنگ — دفعه‌ی بعد دوباره تلاش می‌شود
            localStorage.setItem('cafnet_bundle', html);
            localStorage.setItem('cafnet_bundle_ver', mv);
            try { toast('✅ به‌روزرسانیِ ' + m.version + ' دانلود شد — دفعه‌ی بعد که باز کنی فعال است', 'green'); } catch (e) {}
          })
          .catch(() => { try { localStorage.removeItem('cafnet_updating'); } catch (e) {} });
      })
      .catch(() => { try { localStorage.removeItem('cafnet_updating'); } catch (e) {} });
  },
};
window.addEventListener('load', () => { try { UPD.check(); } catch (e) {} });
</script>
