<script>
/* ============ فازِ ۶ — مونتیزیشنِ واقعی (مایکت + تپسل + Backend) ============
 * قواعد:
 *  ۱) هیچ خریدِ جعلی: بدونِ پلِ اندروید و بدونِ تأییدِ سرور، هیچ مقداری صادر نمی‌شود.
 *  ۲) قیمت‌ها فقط از SDK مایکت — هیچ قیمتِ ثابتی در HTML وجود ندارد.
 *  ۳) تبلیغ فقط Rewarded و فقط با درخواستِ بازیکن؛ جایزه فقط از پاسخِ سرور.
 *  ۴) آفلاین: بازی کامل ادامه دارد؛ بخشِ پرداخت پیامِ صادقانه می‌دهد.
 * این ماژول جایگزینِ provider آزمایشیِ قبلی می‌شود (حذفِ کامل بر اساسِ brief).
 */
const MONEY = (function () {
  let br = null;          // پلِ اندروید — با rebind هم قابلِ اتصال است
  let has = false;
  let seq = 0;
  const pend = Object.create(null);
  const TIMEOUT = 90000;
  /* ثبتِ پاسخِ پل — requestId یکتا؛ callback تکراری بی‌اثر */
  if (typeof window !== 'undefined') {
    window.__cnBridge = {
      cb(id, j) {
        const p = pend[id];
        if (!p) return;
        clearTimeout(p.t);
        delete pend[id];
        try { p.res(j); } catch (e) {}
      },
    };
  }
  function bridgeOn(nb) {
    br = nb;
    has = true;
    refreshInfo();
    refreshProducts();
  }
  if (typeof window !== 'undefined' && window.CafNet && typeof window.CafNet.purchaseProduct === 'function') {
    bridgeOn(window.CafNet);
  }
  function call(fn, args) {
    args = args || [];
    return new Promise((res) => {
      if (!has) return res({ ok: false, err: 'no_bridge' });
      const id = 'r' + (++seq) + '_' + Date.now();
      pend[id] = { res: res, t: setTimeout(() => { delete pend[id]; res({ ok: false, err: 'timeout' }); }, TIMEOUT) };
      try { br[fn].apply(br, args.concat([id])); }
      catch (e) { delete pend[id]; res({ ok: false, err: 'bridge_error' }); }
    });
  }

  const st = {
    info: null,          // getPlatformInfo
    products: null,      // فهرستِ SDK (قیمتِ واقعی)
    wallet: null,        // {wallet:{gold,diamonds}, vip, entitlements}
    adsLeft: null,       // claimsLeftToday
    serverOk: null,      // آخرین وضعیتِ اتصالِ سرور
  };

  async function refreshInfo() {
    if (!has) return;
    try { st.info = JSON.parse(br.getPlatformInfo()); } catch (e) { st.info = null; }
  }
  async function refreshProducts() {
    if (!has) { st.products = null; return; }
    const r = await call('getProducts');
    st.products = (r && r.ok && Array.isArray(r.products)) ? r.products : null;
    return st.products;
  }
  async function refreshWallet() {
    const r = await call('getWallet');
    if (r && r.ok) {
      st.wallet = { wallet: r.wallet || {}, vip: r.vip || { active: false }, entitlements: r.entitlements || {} };
      st.serverOk = true;
      if (r.wallet) {
        Save.d.cloud = { wallet: r.wallet, vip: r.vip || { active: false }, removeAds: !!(r.entitlements && r.entitlements.removeAds), ts: Date.now() };
        Save.d.diamonds = Math.max(0, Math.floor(+r.wallet.diamonds) || 0);
        persist();
      }
    } else {
      st.serverOk = false;
    }
    return st.wallet;
  }

  /* اعمالِ grantِ فقط-سرور — مقدارها هرگز از JS ساخته نمی‌شوند */
  function applyGrant(g) {
    if (!g || typeof g !== 'object') return;
    let did = [];
    if (g.gold > 0) { Save.d.coins += Math.floor(g.gold); did.push('+' + faNum(Math.floor(g.gold)) + ' سکه'); }
    if (g.diamonds > 0) { Save.d.diamonds += Math.floor(g.diamonds); did.push('+' + faNum(Math.floor(g.diamonds)) + ' الماس'); }
    if (g.xp > 0) {
      if (typeof addXp === 'function') addXp(Math.floor(g.xp));
      else G.xp = (G.xp || 0) + Math.floor(g.xp);
      did.push('+' + faNum(Math.floor(g.xp)) + ' XP');
    }
    if (g.voucher === 'repair_free') { Save.d.freeRepairs = (Save.d.freeRepairs || 0) + 1; did.push('تعمیرِ رایگانِ یک دستگاه'); }
    if (g.skin && !Save.d.powned.includes('skin_' + g.skin)) {
      Save.d.powned.push('skin_' + g.skin);
      Save.d.skin = g.skin;
      if (typeof applySkin === 'function') applySkin();
      did.push('پوستهٔ ' + (g.skin === 'royal' ? 'سلطنتی' : 'سایبری'));
    }
    if (did.length) {
      Sfx.buy();
      toast('🎁 ' + did.join(' · '), 'amber');
    }
    persist();
  }

  /* ---------- خریدِ واقعی ---------- */
  async function buy(sku) {
    if (!has) { toast('⚠ خریدِ درون‌برنامه‌ای فقط در نسخهٔ نصب‌شده از مایکت فعال است', 'red'); return { ok: false }; }
    toast('⏳ در حالِ اتصال به مایکت…');
    const r = await call('purchaseProduct', [sku]);
    if (r && r.ok) {
      applyGrant(r.grant);
      if (r.wallet) {
        /* سازگاریِ WebViewهای قدیمی: بدونِ optional chaining */
        var _oldW = st.wallet || {};
        st.wallet = { wallet: r.wallet, vip: r.vip || _oldW.vip || { active: false }, entitlements: _oldW.entitlements || {} };
        Save.d.diamonds = Math.max(0, Math.floor(+r.wallet.diamonds) || 0);
        persist();
      }
      if (r.removeAds) { st.wallet = st.wallet || { entitlements: {} }; st.wallet.entitlements.removeAds = true; }
      if (r.vip && r.vip.active !== undefined) { st.wallet = st.wallet || {}; st.wallet.vip = r.vip; }
      toast('✅ خرید موفق — ثبتِ امن در حساب', 'green');
      renderPremium(); renderCoinShop(); renderVipBox();
      return { ok: true };
    }
    if (r && r.err === 'canceled') toast('خرید لغو شد', 'amber');
    else if (r && r.err === 'pending') toast('⏳ ' + (r.msg || 'پرداخت در انتظارِ تأیید'), 'cyan');
    else if (r && r.err === 'server_unreachable') toast('📡 ' + (r.msg || 'خرید ثبت شد؛ پس از اتصال، جایزه‌ات را می‌گیری'), 'cyan');
    else toast('⚠ ' + ((r && r.msg) || 'پرداخت تأیید نشد'), 'red');
    return { ok: false };
  }

  /* ---------- بازیابیِ خریدها ---------- */
  async function restore() {
    if (!has) { toast('⚠ فقط در نسخهٔ نصب‌شده از مایکت', 'red'); return; }
    toast('⏳ بازیابیِ خریدها…');
    const r = await call('restorePurchases');
    if (r && r.ok) {
      (r.purchases || []).forEach((p) => { if (p.grant) applyGrant(p.grant); });
      await refreshWallet();
      toast('✅ بازیابی انجام شد', 'green');
    } else toast('⚠ ' + ((r && r.msg) || 'بازیابی ناموفق — اتصال را بررسی کن'), 'red');
    renderPremium();
  }

  /* ---------- تبلیغِ جایزه‌دار ---------- */
  async function watchAd(placement, label) {
    if (!has) { toast('⚠ تبلیغات فقط در نسخهٔ نصب‌شده از مایکت فعال است', 'red'); return; }
    if (st.adsLeft !== null && st.adsLeft <= 0) { toast('سقفِ امروز پُر شد — فردا بیا', 'amber'); return; }
    toast('⏳ در حالِ آماده‌سازیِ تبلیغ — ' + label, 'cyan');
    const r = await call('showRewardedAd', [placement]);
    if (r && r.ok) {
      st.adsLeft = (typeof r.claimsLeftToday === 'number') ? r.claimsLeftToday : null;
      if (r.wallet) { Save.d.cloud = Save.d.cloud || {}; Save.d.cloud.wallet = r.wallet; Save.d.diamonds = Math.max(0, Math.floor(+r.wallet.diamonds) || 0); persist(); }
      applyGrant(r.grant);
      toast('🎬 پاداشِ تبلیغ ثبت شد — ' + (st.adsLeft !== null ? faNum(st.adsLeft) + ' فرصتِ دیگرِ امروز' : ''), 'green');
    } else if (r && r.err === 'daily_cap') toast('سقفِ امروز پُر شد — فردا بیا', 'amber');
    else if (r && r.err === 'cooldown_left') toast('کمی صبر کن و دوباره امتحان کن', 'amber');
    else if (r && r.err === 'no_fill') toast('الان تبلیغی آماده نیست — کمی بعد دوباره', 'amber');
    else toast('⚠ ' + ((r && r.msg) || 'پاداش تأیید نشد'), 'red');
    renderAdsBox();
  }

  /* ---------- بتل‌پسِ ابری (Premium) — اعتبار فقط سمتِ سرور ---------- */
  async function syncPass(xpDelta) {
    const r = await call('syncBattlePass', [String(Math.max(0, Math.min(2000, Math.floor(xpDelta) || 0)))]);
    st.serverOk = !!(r && r.ok);
    return r;
  }
  async function claimPassCloud(tier) {
    if (!has) return null;
    const r = await call('claimBattlePass', [String(tier)]);
    if (r && r.ok) { applyGrant(r.grant); return r; }
    if (r && r.err === 'premium_required') toast('این تیرِ پرمیوم است — اشتراکِ بتل‌پس لازم است', 'cyan');
    return null;
  }

  function isBridge() { return has; }
  /* اتصالِ دوبارهٔ پل — برای هارنسِ تست و پل‌هایی که دیر متصل می‌شوند */
  function rebind() {
    const nb = (typeof window !== 'undefined' && window.CafNet) ? window.CafNet : null;
    if (nb && typeof nb.purchaseProduct === 'function' && !has) bridgeOn(nb);
    return isBridge();
  }
  function isServerOk() { return st.serverOk === true; }
  function vipActive() {
    const v = st.wallet && st.wallet.vip;
    if (v && v.active) return true;
    const c = Save.d.cloud && Save.d.cloud.vip;
    return !!(c && c.active);
  }
  function removeAdsActive() {
    const e = st.wallet && st.wallet.entitlements;
    if (e && e.removeAds) return true;
    return !!(Save.d.cloud && Save.d.cloud.removeAds);
  }

  return {
    isBridge: isBridge, rebind: rebind, isServerOk: isServerOk, vipActive: vipActive, removeAdsActive: removeAdsActive,
    refreshInfo: refreshInfo, refreshProducts: refreshProducts, refreshWallet: refreshWallet,
    buy: buy, restore: restore, watchAd: watchAd, applyGrant: applyGrant,
    syncPass: syncPass, claimPassCloud: claimPassCloud,
    state: st,
  };
})();

/* ---------- خودآزماییِ پل — بدونِ هیچ خریدِ جعلی ---------- */
function iapSelfTest() {
  const out = [];
  out.push(['پلِ اندروید', MONEY.isBridge()]);
  out.push(['پیامِ صادقانه بدونِ پل', !MONEY.isBridge()]);
  const pass = out.every((x) => x[1]);
  toast(pass ? '✓ خودآزمایی: پل فعال و provider واقعی — [MYKET/REAL]'
             : 'ⓘ خودآزمایی: بدونِ پل — فروشگاهِ واقعی خاموش و پیامِ صادقانه فعال — [OFFLINE]',
        pass ? 'green' : 'cyan');
  renderPremium();
}
</script>
