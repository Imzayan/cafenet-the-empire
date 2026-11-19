<script>
/* ============ فازِ ۵ — لایه‌ی آنلاینِ اختیاری ============
 * کاملاً افزودنی: بازیِ آفلاین بدونِ این بخش هم کامل است.
 * سرور: server/server.js (همان‌مبدأ در استقرار؛ localhost در اجرایِ محلی)
 */
const ONL = {
  tok: localStorage.getItem('cn_tok') || null,
  user: localStorage.getItem('cn_user') || null,
  api: null,
  busy: false,
};
(function () {
  const o = location.origin;
  ONL.api = (o && o.indexOf('http') === 0) ? o : 'http://localhost:8088';
})();

function onlApi(path, opts) {
  opts = opts || {};
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (ONL.tok) headers['X-Token'] = ONL.tok;
  return fetch(ONL.api + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(r => r.json().catch(() => ({ ok: false, err: 'پاسخِ نامعتبرِ سرور' })));
}
function onlSet(u, tok) {
  ONL.user = u; ONL.tok = tok;
  if (u) { localStorage.setItem('cn_user', u); localStorage.setItem('cn_tok', tok); }
  else { localStorage.removeItem('cn_user'); localStorage.removeItem('cn_tok'); }
}
/* ارسالِ امتیاز به لیدربورد — سرور اعتبار می‌سنجد؛ خودِ بازی هیچ ربطی به این ندارد */
function sendScore() {
  if (!ONL.tok || ONL.busy) return;
  onlApi('/api/score', { method: 'POST', body: { money: G.money, level: G.level, days: G.day, fame: G.fame } })
    .then(r => { if (r && r.ok && r.ranked) toast('☁ رتبه‌ی ' + faNum(r.rank) + ' در جدولِ امتیازات', 'cyan'); })
    .catch(() => {});
}

/* ---------- پنلِ آنلاین ---------- */
function onlStatus() {
  return ONL.user
    ? 'متصل به‌عنوان <b style="color:var(--cyan,#59c2ff)">' + ONL.user + '</b>'
    : 'مهمانِ آفلاین — برای ذخیره‌ی ابری و جدولِ امتیازات وارد شو';
}
function openOnline() {
  const el = $('onlBody');
  el.innerHTML = '<div class="ps">' + onlStatus() + '</div>';
  /* حساب */
  const acc = document.createElement('div');
  acc.className = 'onlBox';
  acc.innerHTML = '<div class="pt" style="font-size:14px">👤 حساب</div>'
    + '<input class="inp" id="onlUser" placeholder="نامِ کاربری (۳–۱۶ نویسه)" maxlength="16" autocomplete="username">'
    + '<input class="inp" id="onlPass" type="password" placeholder="گذرواژه (حداقل ۶ نویسه)" autocomplete="current-password">'
    + '<div class="mbtns" style="margin-top:8px">'
    + '<button class="nbtn" id="onlLogin">ورود</button>'
    + '<button class="nbtn ghost" id="onlReg">ثبت‌نام</button>'
    + (ONL.user ? '<button class="nbtn ghost" id="onlOut">خروج</button>' : '')
    + '</div>';
  el.appendChild(acc);
  /* ابر */
  const cl = document.createElement('div');
  cl.className = 'onlBox';
  cl.innerHTML = '<div class="pt" style="font-size:14px">☁ ذخیره‌ی ابری</div>'
    + '<div class="ps" id="onlCloud">—</div>'
    + '<div class="mbtns" style="margin-top:8px">'
    + '<button class="nbtn ghost" id="onlUp">↑ بارگذاریِ ذخیره</button>'
    + '<button class="nbtn ghost" id="onlDown">↓ بازیابیِ ذخیره</button>'
    + '</div>';
  el.appendChild(cl);
  /* جدول */
  const lb = document.createElement('div');
  lb.className = 'onlBox';
  lb.innerHTML = '<div class="pt" style="font-size:14px">🏆 جدولِ امتیازات</div>'
    + '<div id="onlLb"><div class="ps">در حالِ دریافت…</div></div>';
  el.appendChild(lb);
  /* رفتارها */
  const doAuth = reg => {
    const u = $('onlUser').value.trim(), p = $('onlPass').value;
    if (ONL.busy) return;
    ONL.busy = true;
    onlApi(reg ? '/api/register' : '/api/login', { method: 'POST', body: { user: u, pass: p } })
      .then(r => {
        ONL.busy = false;
        if (r && r.ok) {
          onlSet(r.user, r.token);
          toast('☁ ' + (reg ? 'حساب ساخته شد' : 'خوش آمدی') + ' — ' + r.user, 'cyan');
          openOnline();
        } else toast('⚠ ' + (r && r.err ? r.err : 'خطای نامشخص'), 'red');
      })
      .catch(() => { ONL.busy = false; toast('⚠ سرور در دسترس نیست', 'red'); });
  };
  $('onlLogin').onclick = () => { Sfx.tickS(); doAuth(false); };
  $('onlReg').onclick = () => { Sfx.tickS(); doAuth(true); };
  if ($('onlOut')) $('onlOut').onclick = () => { Sfx.tickS(); onlSet(null, null); toast('از حساب خارج شدی', 'amber'); openOnline(); };
  $('onlUp').onclick = () => {
    Sfx.tickS();
    if (!ONL.tok) { toast('اول وارد شو', 'red'); return; }
    onlApi('/api/save', { method: 'POST', body: { data: Save.d, day: G.day, money: G.money } })
      .then(r => { if (r && r.ok) { toast('☁ ذخیره در ابر ثبت شد', 'cyan'); localStorage.setItem('cn_lastPush', String(r.ts)); refreshCloud(); } else toast('⚠ ' + (r && r.err || 'خطا'), 'red'); })
      .catch(() => toast('⚠ سرور در دسترس نیست', 'red'));
  };
  $('onlDown').onclick = () => {
    Sfx.tickS();
    if (!ONL.tok) { toast('اول وارد شو', 'red'); return; }
    onlApi('/api/save')
      .then(r => {
        if (r && r.ok && r.data) {
          Save.d = r.data; Save.load();
          G.slots = typeof cafeCapacity === 'function' ? cafeCapacity() : G.slots;
          persist();
          toast('☁ ذخیره‌ی ابری بازیابی شد — روزِ ' + faNum(r.day || 1), 'cyan');
          hideFade('onlineOv');
          if (typeof refreshDecor === 'function') refreshDecor();
        } else toast(r && r.data === null ? 'در ابر ذخیره‌ای نیست — اول بارگذاری کن' : '⚠ ' + (r && r.err || 'خطا'), 'red');
      })
      .catch(() => toast('⚠ سرور در دسترس نیست', 'red'));
  };
  refreshCloud();
  /* لیدربورد */
  onlApi('/api/leaderboard')
    .then(r => {
      const box = $('onlLb');
      if (!r || !r.ok) { box.innerHTML = '<div class="ps">⚠ جدول در دسترس نیست</div>'; return; }
      if (!r.rows.length) { box.innerHTML = '<div class="ps">هنوز کسی رتبه ندارد — اولین امپراتور باش! (شرط: یک هفته دوام)</div>'; return; }
      box.innerHTML = '<div class="lbHead"><span>#</span><b>بازیکن</b><i>پول</i><i>روز</i></div>' + r.rows.map(row =>
        '<div class="lbRow' + (row.user === ONL.user ? ' me' : '') + '"><span>' + faNum(row.rank) + '</span><b>' + row.user
        + '</b><i>' + fmtK(row.money) + '</i><i>روزِ ' + faNum(row.days) + '</i></div>').join('');
    })
    .catch(() => { $('onlLb').innerHTML = '<div class="ps">⚠ سرور در دسترس نیست</div>'; });
  $('onlineOv').hidden = false;
}
function refreshCloud() {
  const el = $('onlCloud');
  if (!el) return;
  if (!ONL.tok) { el.textContent = 'برای هم‌گام‌سازی وارد حساب شو.'; return; }
  const pushed = localStorage.getItem('cn_lastPush');
  el.textContent = pushed ? 'آخرین بارگذاریِ ابر: ' + new Date(+pushed).toLocaleString('fa-IR') : 'هنوز از این دستگاه بارگذاری نشده.';
}
</script>
