<script>
/* ============ فازِ ۶-ب — رندرِ فروشگاهِ واقعی، تبلیغِ جایزه‌دار، VIP ============
 * قیمت‌ها فقط از SDK مایکت می‌آیند؛ بدونِ پل → پیامِ صادقانه و دکمه‌های غیرفعال.
 */
function shopPriceOf(sku) {
  const ps = (MONEY.state.products || []);
  const p = ps.find(x => x.sku === sku);
  return p ? p.price : null;
}
function shopTitleOf(sku) {
  const ps = (MONEY.state.products || []);
  const p = ps.find(x => x.sku === sku);
  return p ? (p.title || '') : '';
}

/* ---------- فروشگاهِ واقعی (قیمتِ SDK) ---------- */
function renderCoinShop() {
  const el = document.getElementById('prShopBox');
  if (!el) return;
  const SKUS = ['gold_pack_1', 'gold_pack_2', 'gold_pack_3', 'diamond_pack_1', 'diamond_pack_2', 'starter_bundle', 'remove_ads'];
  if (!MONEY.isBridge()) {
    el.innerHTML = '<div class="prTitle">🛒 فروشگاهِ واقعی</div>'
      + '<div class="ps">خریدِ درون‌برنامه‌ای فقط در نسخهٔ نصب‌شده از مایکت فعال است. اینجا همه‌چیزِ بازیِ آفلاین — پوسته‌ها، تزئینات و بتل‌پسِ رایگان — همان‌طور که بوده کار می‌کند.</div>'
      + '<div class="ps" style="opacity:.75">۱۰ سکه با روزِ بی‌نقص و دستاوردها هم قابلِ جمع‌شدن است — پرداخت برای پیشرفتِ عادی هرگز اجباری نیست.</div>';
    return;
  }
  const ps = MONEY.state.products;
  const loading = !ps;
  el.innerHTML = '<div class="prTitle">🛒 فروشگاهِ واقعی — قیمت از مایکت</div>'
    + (loading
        ? '<div class="ps">⏳ در حالِ دریافتِ قیمتِ واقعی از مایکت…</div>'
        : (ps.length
          ? SKUS.filter(s => ps.find(x => x.sku === s)).map(s => {
              const p = ps.find(x => x.sku === s);
              const ico = s.indexOf('gold') === 0 ? '🪙' : (s.indexOf('diamond') === 0 ? '💎' : (s === 'starter_bundle' ? '🎁' : '🚫'));
              return '<div class="coinRow"><div class="uico">' + ico + '</div>'
                + '<div class="ubody"><div class="uname">' + (p.title || s) + '</div>'
                + '<div class="ueff">' + (p.desc || '') + '</div></div>'
                + '<button class="ubuy" data-sku="' + s + '">' + (p.price || '—') + '</button></div>';
            }).join('')
          : '<div class="ps">⚠ فهرستِ محصولات از مایکت دریافت نشد — اتصال را بررسی کن و دوباره باز کن</div>'))
    + '<div class="mbtns" style="margin-top:8px"><button class="nbtn ghost" id="prRestore">بازیابیِ خریدهای قبلی</button></div>';
  if (!loading) {
    el.querySelectorAll('button[data-sku]').forEach(b => {
      b.onclick = () => { Sfx.tickS(); MONEY.buy(b.dataset.sku); };
    });
  }
  const rb = el.querySelector('#prRestore');
  if (rb) rb.onclick = () => { Sfx.tickS(); MONEY.restore(); };
}

/* ---------- تبلیغِ جایزه‌دار — فقط Rewarded با اجازهٔ بازیکن ---------- */
function renderAdsBox() {
  const host = document.getElementById('premium');
  if (!host) return;
  let el = document.getElementById('prAdsBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'prAdsBox';
    const pass = document.getElementById('prPassBox');
    if (pass && pass.parentNode) pass.parentNode.insertBefore(el, pass);
    else host.appendChild(el);
  }
  if (!MONEY.isBridge()) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = '';
  const left = MONEY.state.adsLeft;
  const leftTxt = (left !== null && typeof left !== 'undefined')
    ? ' — فرصتِ باقی‌ماندهٔ امروز: ' + faNum(left)
    : '';
  const PLACEMENTS = [
    { id: 'double_income', ico: '🎬', name: 'دوبرابرِ درآمدِ دیروز', d: (Save.d.lastIncome > 0 ? 'جایزه تا سقفِ ۴۰۰ سکه بر اساسِ درآمدِ ' + fmtK(Save.d.lastIncome) : 'اول یک روز کامل را بازی کن') },
    { id: 'repair',         ico: '🎬', name: 'تعمیرِ رایگانِ یک دستگاه', d: (Save.d.freeRepairs ? 'ووچرِ فعلی: ' + faNum(Save.d.freeRepairs) : 'ووچر در تعمیرِ بعدی به‌کار می‌رود') },
    { id: 'gold_drop',      ico: '🎬', name: 'سکهٔ هدیه', d: '+۵ سکه — تا ۵ بار در روز' },
    { id: 'xp_bonus',       ico: '🎬', name: 'XPِ اضافه', d: '+۵۰ XP برای سطح و بتل‌پس' },
  ];
  el.innerHTML = '<div class="prTitle">🎬 پاداشِ تماشای تبلیغ' + leftTxt + '</div>'
    + '<div class="ps">تبلیغ فقط با انتخابِ خودت پخش می‌شود؛ اگر تا آخر کامل نگاه نکنی جایزه‌ای صادر نمی‌شود. سقفِ سرور: ۵ پاداش در روز با فاصلهٔ ۵ دقیقه.</div>'
    + PLACEMENTS.map(p =>
        '<div class="coinRow"><div class="uico">' + p.ico + '</div>'
        + '<div class="ubody"><div class="uname">' + p.name + '</div><div class="ueff">' + p.d + '</div></div>'
        + '<button class="ubuy" data-pl="' + p.id + '">پاداش</button></div>').join('');
  el.querySelectorAll('button[data-pl]').forEach(b => {
    b.onclick = () => {
      const p = PLACEMENTS.find(x => x.id === b.dataset.pl);
      MONEY.watchAd(p.id, p.name);
    };
  });
}

/* ---------- VIP و وضعیتِ ابری ---------- */
function renderVipBox() {
  const host = document.getElementById('premium');
  if (!host) return;
  let el = document.getElementById('prVipBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'prVipBox';
    const pass = document.getElementById('prPassBox');
    if (pass && pass.parentNode) pass.parentNode.insertBefore(el, pass);
    else host.appendChild(el);
  }
  if (!MONEY.isBridge()) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = '';
  const vipOn = MONEY.vipActive();
  const exp = Save.d.cloud && Save.d.cloud.vip && Save.d.cloud.vip.expiresAt;
  const expTxt = vipOn && exp ? ' — تا ' + new Date(exp).toLocaleDateString('fa-IR') : '';
  const diamonds = faNum(Save.d.diamonds || 0);
  const rads = MONEY.removeAdsActive();
  el.innerHTML = '<div class="prTitle">👑 VIP و الماس</div>'
    + '<div class="ps">الماسِ حساب: ' + diamonds + ' 💎 · VIP: ' + (vipOn ? 'فعال' + expTxt : 'غیرفعال')
    + ' · حذفِ تبلیغاتِ غیرجایزه‌دار: ' + (rads ? 'فعال ✓' : '—') + '</div>'
    + '<div class="ps">مزایای VIP: جایزهٔ روزانه، مأموریت‌های ویژه، XPِ اضافه، تیرهای پرمیومِ بتل‌پس و حذفِ تبلیغاتِ غیرجایزه‌دار.</div>'
    + '<div class="mbtns" style="margin-top:8px">'
    + '<button class="nbtn" id="prBuyVip">عضویتِ ماهانه — ' + (shopPriceOf('vip_monthly') || 'قیمت از مایکت') + '</button>'
    + '<button class="nbtn ghost" id="prBuyNoAds">حذفِ تبلیغات — ' + (shopPriceOf('remove_ads') || 'قیمت از مایکت') + '</button>'
    + '</div>'
    + (MONEY.state.serverOk === false ? '<div class="ps" style="color:#ff8">⚠ سرور در دسترس نیست — وضعیتِ ابری آخرین بار همگام شده؛ خریدها پس از اتصال بازیابی می‌شوند.</div>' : '');
  const bv = el.querySelector('#prBuyVip');
  const bn = el.querySelector('#prBuyNoAds');
  if (bv) bv.onclick = () => { Sfx.tickS(); MONEY.buy('vip_monthly'); };
  if (bn) bn.onclick = () => { Sfx.tickS(); MONEY.buy('remove_ads'); };
}

/* نکته: باز شدنِ پنلِ پرمیوم در p5_ui.openPremium است — قیمت‌ها و وضعیتِ ابری همان‌جا تازه می‌شوند */
</script>
