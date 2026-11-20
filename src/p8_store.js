<script>
/* ============ فازِ ۴ — فروشگاه و پیشرفت ============
 * بتل‌پسِ فصلی با مسیرِ رایگانِ محلی (همیشه آفلاین کار می‌کند) + همگام‌سازیِ ابریِ اختیاری.
 * خریدِ درون‌برنامه‌ای به لایهٔ واقعیِ MONEY منتقل شد (p11) — provider آزمایشیِ قبلی
 * طبق دستورِ مالک به‌طور کامل حذف شد؛ بدونِ پل و تأییدِ سرور هیچ مقداری صادر نمی‌شود.
 */
/* ---------- بتل‌پسِ فصلی ---------- */
const PASS_TIER_XP = 500, PASS_TIERS = 20;
const PASS_REWARDS = [
  { coins: 2 }, { money: 300000 }, { fame: 2 }, { coins: 2 }, { money: 400000 },
  { fame: 3 }, { coins: 3 }, { money: 500000 }, { fame: 3 }, { skin: 'cyber' },
  { coins: 3 }, { money: 600000 }, { fame: 4 }, { coins: 4 }, { money: 700000 },
  { fame: 4 }, { coins: 4 }, { money: 800000 }, { fame: 5 }, { skin: 'royal', coins: 5 },
];
function passRewardTxt(R) {
  if (R.coins && R.skin) return 'پوسته‌ی سلطنتی + ' + faNum(R.coins) + ' سکه';
  if (R.skin) return 'پوسته‌ی ' + (R.skin === 'cyber' ? 'سایبری' : 'سلطنتی');
  if (R.coins) return faNum(R.coins) + ' سکه';
  if (R.money) return fmtK(R.money) + ' پولِ نقد';
  if (R.fame) return '+' + faNum(R.fame) + ' شهرت';
  return '؟';
}
function passState() {
  if (!Save.d.pass || typeof Save.d.pass !== 'object') Save.d.pass = { season: 1, xp: 0, tier: 0, claimed: [] };
  const P = Save.d.pass;
  P.season = clamp(Math.floor(+P.season) || 1, 1, 999);
  P.xp = Math.max(0, Math.floor(+P.xp) || 0);
  P.tier = clamp(Math.floor(+P.tier) || 0, 0, PASS_TIERS);
  if (!Array.isArray(P.claimed)) P.claimed = [];
  return P;
}
function passSeason() { return Math.floor((G.week - 1) / 4) + 1; } // هر ۴ هفته، یک فصل
function passAdvance() { /* در پایانِ روز صدا زده می‌شود */
  const P = passState();
  const s = passSeason();
  if (s > P.season) {
    P.season = s; P.xp = 0; P.tier = 0; P.claimed = [];
    toast('🗓 فصلِ ' + faNum(s) + ' بتل‌پس آغاز شد — جدولِ جوایزِ تازه در فروشگاهِ پرمیوم', 'cyan');
  }
  const dx = 40 + 4 * (G.dayStats.served || 0);
  P.xp += dx;
  /* فازِ ۶ — همگام‌سازیِ اختیاریِ XP با سرور (بدونِ پل = بدونِ اتصال، بی‌صدا رد می‌شود) */
  if (typeof MONEY !== 'undefined' && MONEY.isBridge() && MONEY.isServerOk()) MONEY.syncPass(dx);
  const nt = Math.min(PASS_TIERS, Math.floor(P.xp / PASS_TIER_XP));
  if (nt > P.tier) {
    P.tier = nt;
    Sfx.levelup();
    toast('🏅 بتل‌پسِ فصلِ ' + faNum(P.season) + ': تیرِ ' + faNum(nt) + ' — جایزه‌ات را در پرمیوم بگیر', 'amber');
  }
  persist();
}
function claimPass(i) {
  i = clamp(Math.floor(+i) || 1, 1, PASS_TIERS); // فیکسِ QA: تیرِ ۰/ناعدا کرش می‌کرد
  const P = passState();
  if (i > P.tier) { toast('اول این تیر را با XPِ روزها پر کن', 'red'); return; }
  if (P.claimed.includes(i)) return;
  const R = PASS_REWARDS[i - 1];
  if (!R) return; // فیکسِ QA: جایزه‌ی تعریف‌نشده — بدونِ کرش
  P.claimed.push(i);
  if (R.coins) Save.d.coins += R.coins;
  if (R.money) { G.money += R.money; G.dayStats.earned += R.money; }
  if (R.fame) G.fame = clamp(G.fame + R.fame, 0, 100);
  if (R.skin && !Save.d.powned.includes('skin_' + R.skin)) {
    Save.d.powned.push('skin_' + R.skin);
    Save.d.skin = R.skin;
    if (typeof applySkin === 'function') applySkin();
  }
  Sfx.buy();
  toast('🏅 تیرِ ' + faNum(i) + ': ' + passRewardTxt(R), 'amber');
  /* فازِ ۶ — ادعای ابریِ همان تیر (سرور اعتبارِ پرمیوم/تیر را می‌سنجد؛ خطا بی‌صدا) */
  if (typeof MONEY !== 'undefined' && MONEY.isBridge()) MONEY.claimPassCloud(i);
  persist();
  renderPremium();
}

/* ---------- رندرِ جدولِ بتل‌پس ---------- */
function renderPass() {
  const el = document.getElementById('prPassBox');
  if (!el) return;
  const P = passState();
  const inTier = P.xp - P.tier * PASS_TIER_XP;
  el.innerHTML = '<div class="prTitle">🏅 بتل‌پسِ فصلِ ' + faNum(P.season) + '</div>'
    + '<div class="ps">XPِ بتل‌پس از پایانِ هر روز می‌آید (۴۰ + ۴ به‌ازای هر مشتریِ راضی). هر ۵۰۰ XP یک تیر؛ هر ۴ هفته فصلِ تازه.</div>'
    + '<div class="passBar"><i style="width:' + Math.round(100 * inTier / PASS_TIER_XP) + '%"></i></div>'
    + '<div class="ps">تیرِ ' + faNum(P.tier) + ' از ' + faNum(PASS_TIERS) + ' — تا تیرِ بعد: ' + faNum(PASS_TIER_XP - inTier) + ' XP</div>'
    + '<div class="tierGrid">' + PASS_REWARDS.map((R, i) => {
        const t = i + 1, got = P.claimed.includes(t);
        const cls = got ? 'claimed' : (t <= P.tier ? 'ready' : 'locked');
        return '<button class="tier ' + cls + '" data-t="' + t + '" title="' + passRewardTxt(R) + '">'
          + faNum(t) + '<small>' + (got ? '✓' : (R.skin ? '🎨' : (R.coins ? '🪙' : (R.money ? '💵' : '⭐')))) + '</small></button>';
      }).join('') + '</div>';
  el.querySelectorAll('.tier.ready').forEach(b => {
    b.onclick = () => { Sfx.tickS(); claimPass(+b.dataset.t); };
  });
}
</script>
