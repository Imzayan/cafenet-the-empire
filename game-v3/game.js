'use strict';
/* =====================================================================
   CAFENET: THE EMPIRE — game.js  v3.0
   بازی مدیریت کافه‌نت — HTML5 Canvas خالص، کاملاً آفلاین، بدون کتابخانه
   بخش‌ها:
     1) پیکربندی و چیدمان صحنه (LAYOUT)
     2) داده‌های اقتصادی (تعرفه، ارتقا، کارمند، دکور، ماموریت، افتخار)
     3) وضعیت بازی + ذخیره‌سازی (localStorage)
   (بقیهٔ بخش‌ها: لودر/صدا/مسیریابی/موجودیت‌ها/رندر/ورودی/UI/حلقه)
===================================================================== */

/* ================= 1) پیکربندی و چیدمان ================= */
const VERSION = '3.0.0';
const W = 1280, H = 880;            // اندازهٔ جهان (مطابق مقیاس assetها)
const WALL_H = 118;                 // ارتفاع دیوار بالا
const FLOOR_BOT = 780;              // خط پایین کف کافه
const HOUR_SEC = 9;                 // هر «ساعت» بازی چند ثانیه واقعی
const NAV_CELL = 20;                // اندازهٔ سلول مسیریابی

const DOOR  = { x: 640, y: 856 };           // در ورودی (تزئینی، در پس‌زمینه)
const SPAWN = { x: 640, y: 846 };           // نقطهٔ ورود مشتری
const COUNTER = { x: 640, y: 265 };         // پیشخوان پذیرش
const PAY_POINT = { x: 640, y: 324 };       // محل پرداخت جلوی پیشخوان

/* همهٔ موقعیت‌ها در یک آرایهٔ تنظیمات — قابل تغییر */
const LAYOUT = {
  props: [
    // دیوار بالا (در پس‌زمینه پخته می‌شود)
    { k: 'furniture/window_blinds', x: 240,  y: 6,   wall: true },
    { k: 'furniture/window_blinds', x: 1040, y: 6,   wall: true },
    // مبلمان و تجهیزات اصلی
    { k: 'furniture/bookshelf',      x: 150,  y: 255 },
    { k: 'furniture/water_cooler',   x: 88,   y: 340, prop: 'cooler' },
    { k: 'furniture/sofa_black',     x: 232,  y: 430 },
    { k: 'furniture/armchair_a',     x: 330,  y: 448 },
    { k: 'furniture/coffee_table',   x: 232,  y: 480 },
    { k: 'furniture/coffee_machine', x: 455,  y: 250, prop: 'coffee' },
    { k: 'furniture/snack_cabinet',  x: 520,  y: 252, prop: 'snack' },
    { k: 'furniture/reception_desk', x: 640,  y: 265 },
    { k: 'furniture/vending_fridge', x: 800,  y: 258, prop: 'fridge' },
    { k: 'furniture/plant_small',    x: 398,  y: 252 },
    { k: 'furniture/plant_small',    x: 930,  y: 252 },
    { k: 'furniture/plant_large',    x: 1237, y: 272 },
    { k: 'furniture/plant_tall',     x: 66,   y: 560 },
    { k: 'furniture/plant_tall',     x: 1215, y: 590 },
    // میزهای گرد نشیمن (پایین چپ)
    { k: 'furniture/round_table',    x: 170,  y: 700 },
    { k: 'furniture/stool',          x: 118,  y: 668 },
    { k: 'furniture/stool',          x: 224,  y: 668 },
    { k: 'furniture/stool',          x: 170,  y: 742 },
    { k: 'furniture/round_table',    x: 318,  y: 748 },
    { k: 'furniture/stool',          x: 268,  y: 720 },
    { k: 'furniture/stool',          x: 368,  y: 720 },
    // لانژ راست پایین
    { k: 'furniture/sofa_black',     x: 1060, y: 730 },
    { k: 'furniture/coffee_table',   x: 1060, y: 772 },
    { k: 'furniture/armchair_b',     x: 920,  y: 745 },
  ],
  /* ۱۲ اسلات ایستگاه گیمینگ — ۶ تای اول از ابتدا فعال */
  stations: [
    { x: 430, y: 445 }, { x: 570, y: 445 }, { x: 710, y: 445 },
    { x: 430, y: 600 }, { x: 570, y: 600 }, { x: 710, y: 600 },
    { x: 840, y: 445 }, { x: 975, y: 445 }, { x: 1110, y: 445 },
    { x: 840, y: 600 }, { x: 975, y: 600 }, { x: 1110, y: 600 },
  ],
  /* دو جای انتظار روی مبل */
  waitSpots: [ { x: 196, y: 468 }, { x: 268, y: 468 } ],
};

/* ================= 2) داده‌های اقتصادی ================= */
const CHAIRS = [ /* تیر صندلی: عادی → آبی → بنفش → قرمز */
  { k: 'furniture/chair_office', name: 'عادی',  mult: 1.00, cost: 0    },
  { k: 'furniture/chair_blue',   name: 'آبی',   mult: 1.15, cost: 250  },
  { k: 'furniture/chair_purple', name: 'بنفش',  mult: 1.32, cost: 700  },
  { k: 'furniture/chair_red',    name: 'قرمز',  mult: 1.55, cost: 1500 },
];
const PCS = [ /* تیر سیستم — brk = احتمال خرابی بعد از هر سشن */
  { name: 'قدیمی',  mult: 1.00, cost: 0,    brk: 0.08 },
  { name: 'متوسط',  mult: 1.30, cost: 400,  brk: 0.05 },
  { name: 'گیمینگ', mult: 1.70, cost: 1000, brk: 0.03 },
];
const TARIFFS = [ /* تعرفهٔ ساعتی هر ایستگاه — طمع vs سرعت ورود مشتری */
  { name: 'اقتصاد',    rate: 12, mod: 1.25 },
  { name: 'استاندارد', rate: 25, mod: 1.00 },
  { name: 'لوکس',      rate: 50, mod: 0.72 },
];
const STATION_COST = [ 0, 0, 0, 0, 0, 0, 1200, 1700, 2300, 3000, 3800, 4700 ];
const STATION_LVL  = [ 1, 1, 1, 1, 1, 1, 3, 5, 7, 9, 11, 13 ];

/* دکور — قابل خرید، بونوس درآمد سراسری + زیبایی */
const DECOR = [
  { id: 'sign_game_on', cat: 'signs/game_on',    name: 'تابلو «GAME PLAY»', cost: 180, bonus: 0.02, x: 352, y: 8,  wall: true },
  { id: 'sign_crown',   cat: 'signs/crown',      name: 'تابلو تاج',         cost: 240, bonus: 0.03, x: 500, y: 8,  wall: true },
  { id: 'sign_head',    cat: 'signs/headphones', name: 'تابلو هدفون',       cost: 180, bonus: 0.02, x: 928, y: 8,  wall: true },
  { id: 'blinds_mid',   cat: 'furniture/window_blinds', name: 'کرمان میانی', cost: 200, bonus: 0.02, x: 640, y: 6, wall: true },
  { id: 'plant_west',   cat: 'furniture/plant_large',   name: 'نخل بزرگ غرب', cost: 220, bonus: 0.02, x: 1195, y: 560 },
  { id: 'shelf_east',   cat: 'furniture/bookshelf',     name: 'قفسهٔ شرقی',   cost: 260, bonus: 0.03, x: 1170, y: 250 },
];
const LOGO_SIGN = { cat: 'signs/cafenet_logo', x: 640, y: 6 }; /* برند اصلی — همیشه هست */

/* کارمندها */
const STAFF_DEFS = [
  { id: 'janitor', name: 'سرایدار', sprite: 'characters/staff_m2_big', cost: 400,  lvl: 2, desc: 'زباله‌ها را خودش تمیز می‌کند.' },
  { id: 'waiter',  name: 'گارسون',  sprite: 'characters/staff_f1_big', cost: 700,  lvl: 3, desc: 'نیاز مشتری‌ها را خودکار برطرف می‌کند.' },
  { id: 'barista', name: 'باریستا', sprite: 'characters/staff_f2_big', cost: 900,  lvl: 6, desc: 'دستگاه قهوه را خودکار می‌فروشد.' },
  { id: 'tech',    name: 'تکنسین',  sprite: 'characters/staff_m1_big', cost: 1000, lvl: 5, desc: 'سیستم‌های خراب را تعمیر می‌کند.' },
];

/* فروشگاه الماسی */
const GEMSHOP = [
  { id: 'rush', name: 'تبلیغ محله',   ic: 'ui/megaphone',    cost: 3,  desc: '۶۰ ثانیه ورود مشتری ×۲.۲' },
  { id: 'bag',  name: 'کیسهٔ سکه',     ic: 'ui/chevron_gold', cost: 5,  desc: '+۴۰۰ سکهٔ فوری' },
  { id: 'fix',  name: 'تعمیر فوری',   ic: 'ui/burst_green',  cost: 2,  desc: 'همهٔ سیستم‌های خراب سالم می‌شوند' },
  { id: 'vip',  name: 'لوژ VIP',      ic: 'ui/frame_purple', cost: 20, desc: 'دائمی: +۱۰٪ درآمد + تاج پذیرش', once: true },
];
const STOCK_DEF = { /* ملزومات قابل خرید */
  drink: { name: 'نوشیدنی', pack: 10, cost: 80,  tip: 10 },
  water: { name: 'آب سرد',  pack: 20, cost: 40,  tip: 4  },
  snack: { name: 'خوراکی',  pack: 10, cost: 70,  tip: 14 },
  bean:  { name: 'دانهٔ قهوه', pack: 20, cost: 60, tip: 7 },
};

/* ماموریت‌ها — متریک نسبت به مبنای شروع ماموریت سنجیده می‌شود */
const MISSION_DEFS = [
  { id: 'serve3',   txt: '۳ مشتری را کامل سرویس کن',        m: 'served',   t: 3,   rc: 120, rg: 0 },
  { id: 'serve8',   txt: '۸ مشتری را کامل سرویس کن',        m: 'served',   t: 8,   rc: 220, rg: 1 },
  { id: 'earn250',  txt: '۲۵۰ سکه کرایه بگیر',              m: 'earned',   t: 250, rc: 180, rg: 0 },
  { id: 'earn800',  txt: '۸۰۰ سکه کرایه بگیر',              m: 'earned',   t: 800, rc: 350, rg: 2 },
  { id: 'drink4',   txt: '۴ بار نوشیدنی به مشتری بده',      m: 'drinks',   t: 4,   rc: 150, rg: 1 },
  { id: 'snack3',   txt: '۳ بار خوراکی به مشتری بده',       m: 'snacks',   t: 3,   rc: 150, rg: 1 },
  { id: 'clean4',   txt: '۴ زباله را تمیز کن',              m: 'cleaned',  t: 4,   rc: 130, rg: 1 },
  { id: 'up2',      txt: '۲ ارتقا بخر',                     m: 'upgrades', t: 2,   rc: 200, rg: 1 },
  { id: 'happy4',   txt: '۴ مشتری متوالی راضی بروند',       m: 'happyStreak', t: 4, rc: 240, rg: 2, abs: true },
  { id: 'lvl4',     txt: 'به سطح ۴ برس',                    m: 'level',    t: 4,   rc: 300, rg: 2, abs: true },
  { id: 'coins2k',  txt: '۲٬۰۰۰ سکه در صندوق داشته باش',    m: 'coins',    t: 2000, rc: 260, rg: 2, abs: true },
  { id: 'rep75',    txt: 'اعتبار کافه را به ۷۵ برسان',      m: 'rep',      t: 75,  rc: 300, rg: 3, abs: true },
];

/* افتخارات — c(وضعیت) شرط کسب */
const ACH_DEFS = [
  { id: 'first',    ic: 'ui/badge_gamepad',  txt: 'اولین مشتری',    d: 'اولین درآمد کافه‌نت',          c: s => s.stats.served >= 1,     rg: 1 },
  { id: 'serve50',  ic: 'ui/star',           txt: '۵۰ مشتری',       d: '۵۰ سرویس کامل',               c: s => s.stats.served >= 50,    rg: 2 },
  { id: 'serve250', ic: 'ui/trophy',         txt: '۲۵۰ مشتری',      d: '۲۵۰ سرویس کامل',              c: s => s.stats.served >= 250,   rg: 5 },
  { id: 'earn10k',  ic: 'ui/coin',           txt: 'درآمد ۱۰هزار',   d: '۱۰٬۰۰۰ سکه درآمد کل',         c: s => s.stats.earned >= 10000, rg: 5 },
  { id: 'earn100k', ic: 'ui/crown',          txt: 'درآمد ۱۰۰هزار',  d: '۱۰۰٬۰۰۰ سکه درآمد کل',        c: s => s.stats.earned >= 100000, rg: 15 },
  { id: 'lvl10',    ic: 'ui/star',           txt: 'سطح ۱۰',         d: 'به سطح ۱۰ برس',               c: s => s.level >= 10,           rg: 8 },
  { id: 'redchair', ic: 'ui/emblem_diamond', txt: 'صندلی قرمز',     d: 'یک ایستگاه با صندلی قرمز',    c: s => s.stations.some(x => x.owned && x.tier >= 3), rg: 4 },
  { id: 'all12',    ic: 'ui/banner_crown',   txt: 'امپراتوری',      d: 'خرید هر ۱۲ ایستگاه',          c: s => s.stations.every(x => x.owned), rg: 12 },
  { id: 'allstaff', ic: 'ui/frame_purple',   txt: 'تیم کامل',       d: 'استخدام هر ۴ کارمند',         c: s => Object.values(s.staff).every(Boolean), rg: 6 },
  { id: 'gift3',    ic: 'ui/gift',           txt: 'وفادار',         d: 'استریک ۳ روزهٔ هدیه',         c: s => s.gift.best >= 3,        rg: 3 },
];

function xpNeed(lvl) { return Math.round(60 * Math.pow(lvl, 1.4)); }

/* ================= 3) وضعیت بازی + ذخیره‌سازی ================= */
const SAVE_KEY = 'cafenet_empire_v3';

const G = { /* فقط دادهٔ ذخیره‌شونده */
  coins: 300, gems: 5, xp: 0, level: 1, rep: 50,
  stations: [],                 /* ۱۲ تا: {owned, tier(صندلی), pc, tariff, broken} */
  stock: { drink: 8, water: 10, snack: 4, bean: 6 },
  fridge: 1, coffee: false,
  staff: { janitor: false, waiter: false, barista: false, tech: false },
  decor: {},                    /* id → true */
  missions: [],                 /* {id, m0, done} */
  ach: {},                      /* id → true(دریافت‌شده) */
  gift: { last: '', streak: 0, best: 0 },
  stats: { served: 0, earned: 0, drinks: 0, snacks: 0, cleaned: 0, upgrades: 0, angry: 0, happyStreak: 0, playSec: 0 },
  settings: { sound: true },
  boost: { rushUntil: 0 },
  vip: false,
  seenIntro: false,
};

const R = { /* دادهٔ اجرایی — ذخیره نمی‌شود */
  ready: false, running: false, t: 0,
  customers: [], staffArr: [], trash: [], parts: [], floats: [],
  custAt: new Array(12).fill(null),   /* id مشتری روی هر ایستگاه */
  waitUsed: [0, 0],
  spawnT: 2.5, saveAcc: 0, hudAcc: 0,
  sel: null, popCtx: null, shopTab: 'up',
  resetArm: 0,
};

function freshStations() {
  G.stations = LAYOUT.stations.map((s, i) => ({
    owned: i < 6, tier: 0, pc: 1, tariff: 1, broken: false,
  }));
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 3, g: G }));
  } catch (e) { /* حالت خصوصی مرورگر — بی‌صدا */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.v !== 3 || !d.g) return false;
    const g = d.g;
    /* ادغام امن با پیش‌فرض‌ها (مهاجرت میدان‌های جدید) */
    Object.keys(G).forEach(k => {
      if (g[k] !== undefined) {
        if (G[k] && typeof G[k] === 'object' && !Array.isArray(G[k]) && g[k] && typeof g[k] === 'object' && !Array.isArray(g[k])) {
          Object.assign(G[k], g[k]);
        } else G[k] = g[k];
      }
    });
    if (!Array.isArray(G.stations) || G.stations.length !== 12) freshStations();
    G.stations = LAYOUT.stations.map((s, i) => {
      const o = G.stations[i] || {};
      return { owned: !!o.owned, tier: o.tier | 0, pc: Math.min(3, Math.max(1, o.pc | 0 || 1)), tariff: Math.min(2, Math.max(0, o.tariff | 0)), broken: !!o.broken };
    });
    return true;
  } catch (e) { return false; }
}
function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  location.reload();
}

/* ================= ابزارهای عمومی ================= */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
function fmt(n) { try { return Math.floor(n).toLocaleString('fa-IR'); } catch (e) { return String(Math.floor(n)); } }
function todayStr(off) {
  const d = new Date(Date.now() + (off || 0) * 864e5);
  const p = n => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

/* دسترسی به manifest تولیدشده در assets.js */
const DK = {};
function buildKey() {
  for (const cat in CA) for (const k in CA[cat]) DK[cat + '/' + k] = CA[cat][k];
}
function sprScale(key) {
  const t = SPRITE_SCALE[key];
  return t === undefined ? SPRITE_SCALE.default : t;
}
function sprSize(key) {
  const m = DK[key];
  const sc = sprScale(key);
  return { w: m.w * sc, h: m.h * sc };
}
function decorBonus() {
  let b = 0;
  for (const d of DECOR) if (G.decor[d.id]) b += d.bonus;
  return b;
}

/* =====================================================================
   4) لودر assetها   5) صدا   6) مسیریابی A*   7) موجودیت‌ها و گیم‌پلی
===================================================================== */

/* ================= 4) لودر ================= */
const IMG = {};
const CAF_IMG = { total: 0, loaded: 0, err: 0 };

function loadAssets(cb) {
  const list = [];
  for (const cat in CA) for (const k in CA[cat]) list.push([cat + '/' + k, CA[cat][k]]);
  CAF_IMG.total = list.length;
  let done = 0;
  const prog = () => {
    done++;
    CAF_IMG.loaded = done;
    const p = Math.round(done / list.length * 100);
    const bar = document.querySelector('#lbar i');
    if (bar) bar.style.width = p + '%';
    const pct = document.getElementById('lpct');
    if (pct) pct.textContent = p + '%';
    if (done >= list.length) cb();
  };
  for (const [key, m] of list) {
    const im = new Image();
    im.onload = () => { IMG[key] = im; prog(); };
    im.onerror = () => { CAF_IMG.err++; prog(); };
    im.src = m.src;
  }
}

/* ================= 5) صدا (WebAudio — سنتز محلی، بدون فایل) ================= */
let AC = null;
function ensureAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, d, type, vol, delay) {
  if (!G.settings.sound || !AC) return;
  try {
    const t = AC.currentTime + (delay || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* بی‌صدا */ }
}
const SFX = {
  tap:   () => tone(880, 0.05, 'square', 0.03),
  coin:  () => { tone(1180, 0.09, 'sine', 0.07); tone(1560, 0.12, 'sine', 0.06, 0.06); },
  buy:   () => { tone(520, 0.1, 'triangle', 0.08); tone(780, 0.14, 'triangle', 0.07, 0.08); },
  lvl:   () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, i * 0.09)),
  bad:   () => tone(150, 0.22, 'sawtooth', 0.05),
  serve: () => tone(660, 0.08, 'sine', 0.06),
  gift:  () => [784, 988, 1175].forEach((f, i) => tone(f, 0.12, 'sine', 0.08, i * 0.07)),
};

/* ================= 6) مسیریابی A* روی گرید ۲۰px ================= */
const NAV = { cw: Math.ceil(W / NAV_CELL), ch: Math.ceil(H / NAV_CELL), blk: null };

function buildNav() {
  NAV.blk = new Uint8Array(NAV.cw * NAV.ch);
  const B = (x0, y0, x1, y1) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0);
    x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    for (let cy = Math.floor(y0 / NAV_CELL); cy <= Math.floor((y1 - 1) / NAV_CELL); cy++)
      for (let cx = Math.floor(x0 / NAV_CELL); cx <= Math.floor((x1 - 1) / NAV_CELL); cx++)
        if (cx >= 0 && cy >= 0 && cx < NAV.cw && cy < NAV.ch) NAV.blk[cy * NAV.cw + cx] = 1;
  };
  B(0, 0, W, WALL_H + 16);          /* دیوار بالا */
  B(0, FLOOR_BOT + 72, W, H);       /* انتهای خیابان بسته است */
  for (const p of propList) {
    if (p.wall) continue;
    const s = sprSize(p.k);
    B(p.x - s.w * 0.4, p.y - s.h * 0.6, p.x + s.w * 0.4, p.y);
  }
  G.stations.forEach((s, i) => {    /* بدنهٔ میز ایستگاه‌های فعال */
    if (!s.owned) return;
    const sl = LAYOUT.stations[i];
    B(sl.x - 46, sl.y - 58, sl.x + 46, sl.y);
  });
}
function cellIdx(x, y) {
  const cx = Math.floor(x / NAV_CELL), cy = Math.floor(y / NAV_CELL);
  if (cx < 0 || cy < 0 || cx >= NAV.cw || cy >= NAV.ch) return -1;
  return cy * NAV.cw + cx;
}
function nearFree(i) {
  if (i < 0) return -1;
  const cx = i % NAV.cw, cy = (i / NAV.cw) | 0;
  for (let r = 1; r <= 6; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= NAV.cw || ny >= NAV.ch) continue;
        const ni = ny * NAV.cw + nx;
        if (!NAV.blk[ni]) return ni;
      }
  return -1;
}
function los(a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(d / 10));
  for (let i = 1; i < n; i++) {
    const c = cellIdx(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n);
    if (c < 0 || NAV.blk[c]) return false;
  }
  return true;
}
function smoothPath(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    for (; j > i + 1; j--) if (los(pts[i], pts[j])) break;
    out.push(pts[j]); i = j;
  }
  return out;
}
function pathFind(sx, sy, tx, ty) {
  if (!NAV.blk) return [{ x: tx, y: ty }];
  const cw = NAV.cw, chh = NAV.ch;
  let s = cellIdx(sx, sy), t = cellIdx(tx, ty);
  if (s < 0 || t < 0) return null;
  if (NAV.blk[s]) s = nearFree(s);
  if (NAV.blk[t]) t = nearFree(t);
  if (s < 0 || t < 0) return null;
  if (s === t) return [{ x: tx, y: ty }];
  const n = cw * chh;
  const g = new Float32Array(n).fill(Infinity);
  const f = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const tx0 = t % cw, ty0 = (t / cw) | 0;
  const hEst = i => Math.hypot((i % cw) - tx0, ((i / cw) | 0) - ty0);
  const open = [s];
  g[s] = 0; f[s] = hEst(s);
  let guard = 0;
  while (open.length && guard++ < 8000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === t) {
      const pts = [];
      let c = t;
      while (c !== -1) {
        pts.push({ x: (c % cw) * NAV_CELL + NAV_CELL / 2, y: ((c / cw) | 0) * NAV_CELL + NAV_CELL / 2 });
        c = came[c];
      }
      pts.reverse();
      pts.push({ x: tx, y: ty });
      return smoothPath(pts);
    }
    closed[cur] = 1;
    const cx = cur % cw, cy = (cur / cw) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cw || ny >= chh) continue;
      const ni = ny * cw + nx;
      if (NAV.blk[ni] || closed[ni]) continue;
      if (dx && dy && (NAV.blk[cy * cw + nx] || NAV.blk[ny * cw + cx])) continue; /* بدون برش گوشه */
      const ng = g[cur] + ((dx && dy) ? 1.4 : 1);
      if (ng < g[ni]) {
        g[ni] = ng; came[ni] = cur; f[ni] = ng + hEst(ni);
        if (open.indexOf(ni) === -1) open.push(ni);
      }
    }
  }
  return null;
}

/* ================= 7) موجودیت‌ها ================= */
let propList = [];

function rebuildProps() {
  propList = LAYOUT.props.filter(p => {
    if (p.prop === 'coffee') return G.coffee;
    return true;
  }).map(p => ({ k: p.k, x: p.x, y: p.y, wall: !!p.wall, prop: p.prop || null }));
  if (G.fridge >= 2) propList.push({ k: 'furniture/vending_fridge', x: 870, y: 258, wall: false, prop: 'fridge' });
  for (const d of DECOR) if (G.decor[d.id]) propList.push({ k: d.cat, x: d.x, y: d.y, wall: !!d.wall, prop: null });
  buildNav();
}

/* ---- حرکت روی مسیر ---- */
function setPath(e, tx, ty) {
  const p = pathFind(e.x, e.y, tx, ty);
  if (p && p.length) { e.path = p; e.pi = 0; }
  else { e.path = [{ x: tx, y: ty }]; e.pi = 0; } /* fallback: مستقیم */
  return !!p;
}
function stepPath(e, dt) {
  if (!e.path || e.pi >= e.path.length) return true;
  const p = e.path[e.pi];
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  const step = e.speed * dt;
  if (d <= step) { e.x = p.x; e.y = p.y; e.pi++; }
  else {
    e.x += dx / d * step; e.y += dy / d * step;
    if (Math.abs(dx) > 2) e.face = dx > 0 ? 1 : -1;
  }
  e.bob += dt * 10;
  return e.pi >= e.path.length;
}

/* ---- مشتری‌ها ---- */
let CID = 1;
function spawnCustomer() {
  const c = {
    id: CID++, kind: 1 + ((Math.random() * 8) | 0),
    x: SPAWN.x + rand(-14, 14), y: SPAWN.y,
    st: 'toCounter', path: null, pi: 0,
    sat: 100, hours: 0, tLeft: 0, need: null, needT: 0, decay: 1,
    face: 1, bob: rand(0, 6.28), speed: rand(84, 110),
    station: -1, tariff: 1, spot: -1, waitT: 0, t: 0, claim: 0,
  };
  R.customers.push(c);
  setPath(c, PAY_POINT.x + rand(-34, 34), PAY_POINT.y + rand(0, 10));
}
function freeStation() {
  const free = [];
  for (let i = 0; i < 12; i++) {
    const s = G.stations[i];
    if (s.owned && !s.broken && !R.custAt[i]) free.push(i);
  }
  return free.length ? free[(Math.random() * free.length) | 0] : -1;
}
function sitAt(c, si) {
  R.custAt[si] = c.id;
  c.station = si;
  c.tariff = G.stations[si].tariff;
  const sl = LAYOUT.stations[si];
  setPath(c, sl.x, sl.y + 18);
  c.st = 'toSeat';
}
function leave(c, angry) {
  if (c.station >= 0) { R.custAt[c.station] = null; c.station = -1; }
  if (c.spot >= 0) { R.waitUsed[c.spot] = 0; c.spot = -1; }
  if (angry) {
    G.rep = Math.max(5, G.rep - 4);
    G.stats.angry++; G.stats.happyStreak = 0;
    floater(c.x, c.y - 92, 'عصبانی رفت!', '#ff8a8a');
    SFX.bad(); refreshHUD();
  }
  c.need = null;
  setPath(c, SPAWN.x + rand(-16, 16), 844);
  c.st = 'toDoor';
}
function assignTarget(c) {
  const si = freeStation();
  if (si >= 0) { sitAt(c, si); return; }
  for (let w = 0; w < R.waitUsed.length; w++) {
    if (!R.waitUsed[w]) {
      R.waitUsed[w] = c.id; c.spot = w;
      setPath(c, LAYOUT.waitSpots[w].x, LAYOUT.waitSpots[w].y);
      c.st = 'toWait';
      return;
    }
  }
  floater(c.x, c.y - 90, 'ظرفیت تکمیل!', '#ffd0a0');
  leave(c, false);
}
function startSession(c) {
  c.st = 'play';
  c.hours = 1 + (Math.random() < 0.45 ? 1 : 0) + (Math.random() < 0.18 ? 1 : 0);
  c.tLeft = c.hours * HOUR_SEC;
  c.needT = rand(5.5, 12);
  c.need = null;
  const stn = G.stations[c.station];
  c.decay = 0.8 + c.tariff * 0.9 - (CHAIRS[stn.tier].mult - 1) * 1.6;
  floater(c.x, c.y - 96, c.hours + ' ساعت', '#9fe8b0');
}
function endSession(c) {
  const sl = LAYOUT.stations[c.station];
  setPath(c, PAY_POINT.x + rand(-30, 30), PAY_POINT.y + rand(0, 8));
  c.st = 'toPay';
}
function payAndLeave(c) {
  const stn = G.stations[c.station];
  const inc = Math.max(1, Math.round(
    TARIFFS[c.tariff].rate * c.hours *
    CHAIRS[stn.tier].mult * PCS[stn.pc].mult *
    (0.85 + c.sat / 400) * (1 + decorBonus()) * (G.vip ? 1.1 : 1)
  ));
  G.coins += inc;
  addXp(4 + c.hours * 2);
  G.stats.served++; G.stats.earned += inc;
  if (c.sat >= 70) { G.stats.happyStreak++; G.rep = Math.min(100, G.rep + 1); }
  const sl = LAYOUT.stations[c.station];
  coinBurst(sl.x, sl.y - 46, Math.min(7, 3 + (c.hours | 0)));
  floater(sl.x, sl.y - 74, '+' + fmt(inc), '#ffd76e');
  R.custAt[c.station] = null; c.station = -1;
  if (!stn.broken && Math.random() < PCS[stn.pc].brk) {
    stn.broken = true;
    toast('یک سیستم خراب شد! با تپ یا تکنسین تعمیرش کن', 'bad');
  }
  if (R.trash.length < 10 && Math.random() < 0.35) {
    R.trash.push({ x: sl.x + rand(-12, 12), y: sl.y + 34 });
  }
  SFX.coin(); refreshHUD();
  setPath(c, SPAWN.x + rand(-16, 16), 844);
  c.st = 'toDoor';
}
function serveCustomer(c, byStaff) {
  if (!c.need) return false;
  const n = c.need;
  if (n === 'drink') {
    if (G.stock.drink > 0) { G.stock.drink--; G.coins += STOCK_DEF.drink.tip; G.stats.drinks++; }
    else if (G.stock.water > 0) { G.stock.water--; G.coins += STOCK_DEF.water.tip; G.stats.drinks++; }
    else { if (!byStaff) toast('موجودی نوشیدنی خالی است! از فروشگاه بخر', 'bad'); return false; }
  } else if (n === 'snack') {
    if (G.stock.snack > 0) { G.stock.snack--; G.coins += STOCK_DEF.snack.tip; G.stats.snacks++; }
    else { if (!byStaff) toast('خوراکی تمام شده! از فروشگاه بخر', 'bad'); return false; }
  } /* tune: رایگان */
  c.sat = Math.min(100, c.sat + (n === 'tune' ? 15 : 30));
  c.need = null; c.needT = rand(8, 15);
  SFX.serve();
  floater(c.x, c.y - 96, n === 'drink' ? 'نوشیدنی' : n === 'snack' ? 'خوراکی' : 'تنظیم سیستم', '#8fd6ff');
  refreshHUD();
  return true;
}
function updateCustomers(dt) {
  const cs = R.customers;
  for (let i = cs.length - 1; i >= 0; i--) {
    const c = cs[i];
    switch (c.st) {
      case 'toCounter':
        if (stepPath(c, dt)) { c.st = 'checkin'; c.t = 0.7; }
        break;
      case 'checkin':
        c.t -= dt;
        if (c.t <= 0) assignTarget(c);
        break;
      case 'toSeat':
        if (stepPath(c, dt)) startSession(c);
        break;
      case 'toWait':
        if (stepPath(c, dt)) { c.st = 'waiting'; c.waitT = 0; }
        break;
      case 'waiting': {
        c.waitT += dt; c.sat -= 1.2 * dt;
        const si = freeStation();
        if (si >= 0) { R.waitUsed[c.spot >= 0 ? c.spot : 0] = 0; c.spot = -1; sitAt(c, si); }
        else if (c.waitT > 24 || c.sat <= 0) leave(c, false);
        break;
      }
      case 'play': {
        const stn = G.stations[c.station];
        c.tLeft -= dt * (1 + (stn.pc - 1) * 0.12);
        c.sat -= c.decay * dt;
        if (c.need) c.sat -= 2.5 * dt;
        else { c.needT -= dt; if (c.needT <= 0) c.need = pick(['drink', 'drink', 'snack', 'tune']); }
        if (c.sat <= 0) { leave(c, true); break; }
        if (c.tLeft <= 0) endSession(c);
        break;
      }
      case 'toPay':
        if (stepPath(c, dt)) { c.st = 'paying'; c.t = 0.6; }
        break;
      case 'paying':
        c.t -= dt;
        if (c.t <= 0) payAndLeave(c);
        break;
      case 'toDoor':
        if (stepPath(c, dt) || c.y > 852) cs.splice(i, 1);
        break;
    }
  }
}

/* ---- کارمندها ---- */
function hireStaff(id) {
  const def = STAFF_DEFS.find(s => s.id === id);
  if (!def || G.staff[id]) return;
  G.staff[id] = true;
  spawnStaff(id);
  G.stats.upgrades++;
}
function spawnStaff(id) {
  const def = STAFF_DEFS.find(s => s.id === id);
  R.staffArr.push({
    id: 'st_' + id, role: id, sprite: def.sprite,
    x: SPAWN.x + rand(-10, 10), y: SPAWN.y, st8: 'idle',
    path: null, pi: 0, face: 1, bob: rand(0, 6.28), speed: 78,
    state: 'idle', cool: 1, workT: 0, jobT: 0, job: null,
    sellT: 12, wanderT: 0,
  });
}
function findJob(s) {
  if (s.role === 'waiter') {
    for (const c of R.customers) {
      if (c.st === 'play' && c.need && (!c.claim || c.claim === s.id)) { c.claim = s.id; return { x: c.x, y: c.y + 6, c }; }
    }
  } else if (s.role === 'tech') {
    for (let i = 0; i < 12; i++) {
      if (G.stations[i].owned && G.stations[i].broken) {
        const sl = LAYOUT.stations[i];
        return { x: sl.x, y: sl.y + 46, fix: i };
      }
    }
  } else if (s.role === 'janitor') {
    let best = -1, bd = 1e9;
    R.trash.forEach((t, i) => {
      const d = Math.hypot(t.x - s.x, t.y - s.y);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) return { x: R.trash[best].x, y: R.trash[best].y + 8, trash: best };
  }
  return null;
}
function doStaffJob(s) {
  const j = s.job;
  if (!j) return;
  if (s.role === 'waiter' && j.c) { serveCustomer(j.c, true); if (j.c.claim === s.id) j.c.claim = 0; }
  else if (s.role === 'tech' && j.fix !== undefined) {
    G.stations[j.fix].broken = false;
    floater(LAYOUT.stations[j.fix].x, LAYOUT.stations[j.fix].y - 80, 'تعمیر شد', '#9fe8b0');
    if (R.popCtx && R.popCtx.type === 'st' && R.popCtx.id === j.fix) renderPop();
  } else if (s.role === 'janitor' && j.trash !== undefined) {
    if (R.trash[j.trash]) { R.trash.splice(j.trash, 1); G.stats.cleaned++; addXp(1); }
  }
  s.job = null;
}
function updateStaff(dt) {
  for (const s of R.staffArr) {
    if (s.state === 'go') {
      if (stepPath(s, dt)) { s.state = 'work'; s.workT = s.jobT; }
    } else if (s.state === 'work') {
      s.workT -= dt;
      if (s.workT <= 0) { doStaffJob(s); s.state = 'idle'; s.cool = 0.6; }
    } else {
      s.cool -= dt;
      if (s.cool <= 0) {
        s.cool = 0.5;
        const j = findJob(s);
        if (j) {
          s.job = j;
          s.jobT = s.role === 'tech' ? 5 : (s.role === 'janitor' ? 2.5 : 1.2);
          setPath(s, j.x, j.y);
          s.state = 'go';
        } else {
          /* باریستا: فروش خودکار قهوه کنار دستگاه */
          if (s.role === 'barista' && G.coffee) {
            s.sellT -= 0.5;
            if (s.sellT <= 0) {
              s.sellT = rand(12, 18);
              if (G.stock.bean > 0) {
                G.stock.bean--;
                const inc = Math.round(STOCK_DEF.bean.tip * (G.vip ? 1.5 : 1) * (1 + decorBonus()));
                G.coins += inc;
                coinBurst(455, 210, 2);
                floater(455, 200, '+' + fmt(inc), '#ffcf9e');
                SFX.coin(); refreshHUD();
              }
            }
          }
          /* پرسهٔ ملایم دور نقطهٔ ایست */
          s.wanderT -= 0.5;
          if (s.wanderT <= 0) {
            s.wanderT = rand(4, 9);
            const home = s.role === 'barista' ? { x: 455, y: 305 } : { x: rand(180, 1100), y: rand(360, 740) };
            setPath(s, clamp(home.x, 140, 1160), clamp(home.y, 320, 740));
          }
          if (s.path) stepPath(s, 0.5);
        }
      }
    }
  }
}

/* ---- سطح و XP ---- */
function addXp(n) {
  G.xp += n;
  let need = xpNeed(G.level);
  while (G.xp >= need) {
    G.xp -= need;
    G.level++;
    const rc = 40 * G.level;
    G.coins += rc;
    G.gems += 1 + (G.level % 2 === 0 ? 1 : 0);
    toast('سطح ' + fmt(G.level) + '! جایزه: ' + fmt(rc) + ' سکه', 'good');
    SFX.lvl();
    coinBurst(COUNTER.x, COUNTER.y - 60, 8);
    const nx = STATION_LVL.findIndex((l, i) => l === G.level && !G.stations[i].owned);
    if (nx >= 0) toast('ایستگاه جدید قابل خرید شد!', 'good');
    need = xpNeed(G.level);
  }
}

/* ---- ورود مشتری ---- */
function nextArrival() {
  const owned = G.stations.filter(s => s.owned).length;
  const rep = 0.55 + G.rep / 110;
  const own = 0.55 + owned * 0.09;
  const rush = performance.now() < G.boost.rushUntil ? 2.2 : 1;
  const lvl = 1 + G.level * 0.02;
  return Math.max(2.2, 7.5 / (rep * own * rush * lvl) * rand(0.7, 1.3));
}
function updateSpawner(dt) {
  R.spawnT -= dt;
  if (R.spawnT <= 0) {
    R.spawnT = nextArrival();
    const room = R.customers.length < 4 + G.stations.filter(s => s.owned).length;
    const anySeat = R.customers.length < 10;
    if (room && anySeat) spawnCustomer();
  }
}

/* =====================================================================
   8) رندر   9) ورودی لمسی   10) UI   11) حلقهٔ اصلی و بوت
===================================================================== */

/* ================= 8) رندر ================= */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let DPR = 1, cssW = window.innerWidth, cssH = window.innerHeight;

const cam = { x: W / 2, y: 500, z: 0.5, minZ: 0.15, maxZ: 1.6 };
function toWorld(sx, sy) { return { x: (sx - cssW / 2) / cam.z + cam.x, y: (sy - cssH / 2) / cam.z + cam.y }; }
function toScreen(wx, wy) { return { x: (wx - cam.x) * cam.z + cssW / 2, y: (wy - cam.y) * cam.z + cssH / 2 }; }
function clampCam() {
  const vw = cssW / cam.z, vh = cssH / cam.z;
  cam.x = vw >= W ? W / 2 : clamp(cam.x, vw / 2 - 60, W - vw / 2 + 60);
  cam.y = vh >= H ? H / 2 : clamp(cam.y, vh / 2 - 40, H - vh / 2 + 40);
}
function fitView() {
  const fit = Math.min(cssW / (W + 60), cssH / (H + 60));
  cam.minZ = Math.max(0.12, fit * 0.9);
  cam.maxZ = 1.6;
  cam.z = clamp(fit * 1.03, cam.minZ, 1.3);
  cam.x = W / 2; cam.y = 500;
  clampCam();
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cssW = window.innerWidth; cssH = window.innerHeight;
  cv.width = Math.max(1, Math.round(cssW * DPR));
  cv.height = Math.max(1, Math.round(cssH * DPR));
  cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
  fitView();
}

/* ---- کش پس‌زمینه (یک‌بار ساخته می‌شود) ---- */
const bgc = document.createElement('canvas');
bgc.width = W; bgc.height = H;
function sr(n) { const x = Math.sin(n * 127.1 + 13.7) * 43758.5453; return x - Math.floor(x); }

function buildBg() {
  const b = bgc.getContext('2d');
  /* دیوار بالا: پانل‌های تیره + نئون */
  b.fillStyle = '#17181f'; b.fillRect(0, 0, W, WALL_H);
  for (let x = 0; x < W; x += 64) {
    b.fillStyle = 'rgba(255,255,255,0.03)';
    b.fillRect(x, 0, 2, WALL_H);
  }
  const neon = b.createLinearGradient(0, WALL_H - 12, 0, WALL_H);
  neon.addColorStop(0, 'rgba(255,190,80,0.55)');
  neon.addColorStop(1, 'rgba(180,120,255,0.12)');
  b.fillStyle = neon; b.fillRect(0, WALL_H - 12, W, 6);
  /* کرمان‌های پایهٔ دیوار (anchor بالا-وسط) */
  const bl = IMG['furniture/window_blinds'];
  if (bl) { b.drawImage(bl, 240 - 71, 6, 142, 122); b.drawImage(bl, 1040 - 71, 6, 142, 122); }
  /* کف سنگی */
  const ts = 40;
  for (let cy = WALL_H / ts | 0; cy * ts < H; cy++) {
    for (let cx = 0; cx * ts < W; cx++) {
      const r = sr(cx * 57 + cy * 131);
      const l = 44 + ((r * 7) | 0);
      if (r > 0.94) b.fillStyle = 'rgb(' + (l + 8) + ',' + (l + 10) + ',' + (l + 22) + ')';
      else b.fillStyle = 'rgb(' + l + ',' + (l + 1) + ',' + (l + 8) + ')';
      const y0 = Math.max(cy * ts, WALL_H);
      b.fillRect(cx * ts, y0, ts, cy * ts + ts - y0);
    }
  }
  b.strokeStyle = 'rgba(0,0,0,0.28)'; b.lineWidth = 1.5;
  b.beginPath();
  for (let x = 0; x <= W; x += ts) { b.moveTo(x, WALL_H); b.lineTo(x, H); }
  for (let y = WALL_H; y <= H; y += ts) { b.moveTo(0, y); b.lineTo(W, y); }
  b.stroke();
  /* نشان طلایی وسط سالن (جلوی ورودی) */
  b.save();
  b.strokeStyle = 'rgba(255,207,94,0.16)'; b.lineWidth = 5;
  b.beginPath(); b.arc(640, 706, 62, 0, 7); b.stroke();
  b.lineWidth = 2; b.globalAlpha = 0.6;
  b.beginPath(); b.arc(640, 706, 50, 0, 7); b.stroke();
  b.globalAlpha = 1;
  b.fillStyle = 'rgba(255,207,94,0.14)';
  b.beginPath(); /* تاج ساده */
  b.moveTo(618, 722); b.lineTo(618, 700); b.lineTo(628, 710); b.lineTo(640, 694);
  b.lineTo(652, 710); b.lineTo(662, 700); b.lineTo(662, 722); b.closePath(); b.fill();
  b.restore();
  /* سایهٔ دیوار روی کف */
  const shg = b.createLinearGradient(0, WALL_H, 0, WALL_H + 30);
  shg.addColorStop(0, 'rgba(0,0,0,0.4)'); shg.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = shg; b.fillRect(0, WALL_H, W, 30);
  /* باند ورودی: اول در، بعد فرش WELCOME روی آن */
  b.fillStyle = '#202127'; b.fillRect(0, FLOOR_BOT, W, H - FLOOR_BOT);
  b.strokeStyle = 'rgba(255,255,255,0.05)';
  b.beginPath();
  for (let x = 0; x <= W; x += 34) { b.moveTo(x, FLOOR_BOT); b.lineTo(x - 26, H); }
  b.stroke();
  const door = IMG['furniture/door_wood'];
  if (door) b.drawImage(door, DOOR.x - 33, DOOR.y - 117, 66, 117);
  b.fillStyle = '#41191f'; b.fillRect(566, 806, 148, 44);
  b.strokeStyle = 'rgba(255,207,94,0.8)'; b.lineWidth = 2;
  b.strokeRect(570, 810, 140, 36);
  b.fillStyle = '#ffcf5e'; b.font = 'bold 17px Georgia, serif';
  b.textAlign = 'center'; b.textBaseline = 'middle';
  b.fillText('WELCOME', 640, 828);
  /* ویـنیت ملایم */
  const vg = b.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)');
  b.fillStyle = vg; b.fillRect(0, 0, W, H);
}

/* ---- ابزار رسم اسپرایت با anchor و SPRITE_SCALE ---- */
function drawSpr(key, x, y, flip) {
  const im = IMG[key], m = DK[key];
  if (!im || !m) return;
  const sc = sprScale(key), w = m.w * sc, h = m.h * sc;
  if (flip === -1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
    ctx.drawImage(im, -w * (1 - m.ax), -m.ay * h, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(im, x - m.ax * w, y - m.ay * h, w, h);
  }
}
function shadow(x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y - 2, w, w * 0.32, 0, 0, 6.3); ctx.fill();
}
function drawProp(p) {
  if (p.wall) return;
  const s = sprSize(p.k);
  shadow(p.x, p.y, s.w * 0.4);
  drawSpr(p.k, p.x, p.y, 1);
}
function drawChar(e, key) {
  const walking = e.path && e.pi < e.path.length;
  const yb = walking ? e.y - Math.abs(Math.sin(e.bob)) * 3 : e.y;
  shadow(e.x, e.y, 13);
  ctx.save();
  ctx.translate(e.x, yb);
  if (walking) ctx.rotate(Math.sin(e.bob * 0.5) * 0.045);
  const im = IMG[key], m = DK[key];
  if (im && m) {
    const sc = sprScale(key), w = m.w * sc, h = m.h * sc;
    if (e.face === -1) { ctx.scale(-1, 1); ctx.drawImage(im, -w * (1 - 0.5), -h, w, h); }
    else ctx.drawImage(im, -w / 2, -h, w, h);
  }
  ctx.restore();
}
function drawTrash(tr) {
  shadow(tr.x, tr.y, 7);
  ctx.fillStyle = '#9a9a92';
  ctx.beginPath(); ctx.arc(tr.x, tr.y - 5, 6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6d6d66'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(tr.x - 3, tr.y - 7); ctx.lineTo(tr.x + 2, tr.y - 4); ctx.lineTo(tr.x - 1, tr.y - 2); ctx.stroke();
}
function drawWallSigns(t) {
  let i = 0;
  const wallDraw = (x, key) => {
    const im = IMG[key], m = DK[key];
    if (!im || !m) return;
    const sc = sprScale(key), w = m.w * sc, h = m.h * sc;
    const isSign = key.indexOf('signs/') === 0;
    ctx.save();
    if (isSign) {
      ctx.globalAlpha = 0.82 + 0.18 * Math.sin(t * 2.2 + i * 1.7);
      ctx.shadowColor = 'rgba(255,190,80,0.85)';
      ctx.shadowBlur = 16;
    }
    ctx.drawImage(im, x - m.ax * w, 6 - m.ay * h, w, h);
    ctx.restore();
    i++;
  };
  wallDraw(LOGO_SIGN.x, LOGO_SIGN.cat);
  for (const d of DECOR) if (d.wall && G.decor[d.id]) wallDraw(d.x, d.cat);
}
function drawBroken(i, t) {
  const sl = LAYOUT.stations[i];
  ctx.save();
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
  drawSpr('ui/gear', sl.x, sl.y - 88);
  ctx.restore();
  ctx.fillStyle = '#ff4d5e';
  ctx.beginPath(); ctx.arc(sl.x + 14, sl.y - 96, 5, 0, 7); ctx.fill();
}
function bubble(x, y, icon) {
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.strokeStyle = 'rgba(30,30,40,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - 16, y - 15, 32, 27, 9); else ctx.rect(x - 16, y - 15, 32, 27);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); /* دم حباب */
  ctx.moveTo(x - 5, y + 11); ctx.lineTo(x + 6, y + 11); ctx.lineTo(x, y + 19); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.fill();
  icon(x, y - 1);
}
function drawCustOverlay(c, t) {
  if (c.station >= 0 && c.st === 'play') {
    const sl = LAYOUT.stations[c.station];
    /* نوار پیشرفت سشن */
    const total = c.hours * HOUR_SEC;
    const w = 46, x0 = sl.x - w / 2, y0 = sl.y - 104;
    ctx.fillStyle = 'rgba(10,12,18,0.6)';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, 7, 3.5); ctx.fill(); }
    else ctx.fillRect(x0, y0, w, 7);
    ctx.fillStyle = '#46c46c';
    ctx.fillRect(x0 + 1.5, y0 + 1.5, (w - 3) * clamp(1 - c.tLeft / total, 0, 1), 4);
    /* حباب نیاز */
    if (c.need) {
      bubble(c.x, c.y - 102, (bx, by) => {
        if (c.need === 'drink') {
          ctx.fillStyle = '#3fb0ff';
          ctx.beginPath();
          ctx.moveTo(bx, by - 8); ctx.quadraticCurveTo(bx + 7, by + 2, bx, by + 7);
          ctx.quadraticCurveTo(bx - 7, by + 2, bx, by - 8); ctx.fill();
        } else if (c.need === 'snack') {
          ctx.fillStyle = '#c98d4e';
          ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill();
          ctx.fillStyle = '#8a5a2c';
          ctx.beginPath(); ctx.arc(bx - 2, by - 2, 1.4, 0, 7); ctx.arc(bx + 3, by + 1, 1.4, 0, 7); ctx.fill();
        } else {
          drawSpr('ui/gear', bx + 8, by + 8);
        }
      });
    } else if (c.sat < 25) {
      bubble(c.x, c.y - 102, (bx, by) => {
        ctx.fillStyle = '#e5484d'; ctx.font = 'bold 17px Tahoma, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('!', bx, by);
      });
    }
  }
}
function drawFloater(f) {
  const a = clamp(1.25 - f.t, 0, 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = f.c;
  ctx.font = 'bold 15px Tahoma, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(f.txt, f.x, f.y - f.t * 30);
  ctx.globalAlpha = 1;
}
function drawParticles() {
  for (const p of R.parts) {
    if (p.t < 0) continue;
    const k = clamp(p.t / p.dur, 0, 1);
    const mx = (p.sx + p.tx) / 2, my = Math.min(p.sy, p.ty) - 70;
    const u = 1 - k;
    const x = u * u * p.sx + 2 * u * k * mx + k * k * p.tx;
    const y = u * u * p.sy + 2 * u * k * my + k * k * p.ty;
    const im = IMG['ui/coin'];
    if (im) ctx.drawImage(im, x - 11, y - 11, 22, 22);
  }
}
function render(t) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.setTransform(DPR * cam.z, 0, 0, DPR * cam.z, DPR * (cssW / 2 - cam.x * cam.z), DPR * (cssH / 2 - cam.y * cam.z));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bgc, 0, 0);
  drawWallSigns(t);
  /* لیست رسم مرتب بر اساس y (پایینِ شیء) */
  const L = [];
  for (const p of propList) if (!p.wall) L.push({ y: p.y, f: () => drawProp(p) });
  for (let i = 0; i < 12; i++) {
    if (!G.stations[i].owned) continue;
    const sl = LAYOUT.stations[i];
    const dk = i % 2 ? 'furniture/gaming_desk_b' : 'furniture/gaming_desk_a';
    L.push({ y: sl.y, f: () => drawSpr(dk, sl.x, sl.y) });
    L.push({ y: sl.y + 40, f: () => drawSpr(CHAIRS[G.stations[i].tier].k, sl.x, sl.y + 40) });
  }
  for (const c of R.customers) L.push({ y: c.y, f: () => drawChar(c, 'characters/kid' + c.kind + '_big') });
  for (const s of R.staffArr) L.push({ y: s.y, f: () => drawChar(s, s.sprite) });
  for (const tr of R.trash) L.push({ y: tr.y, f: () => drawTrash(tr) });
  L.sort((a, b) => a.y - b.y);
  for (const d of L) d.f();
  /* حلقهٔ انتخاب */
  if (R.sel && R.sel.t === 'st') {
    const sl = LAYOUT.stations[R.sel.id];
    ctx.strokeStyle = 'rgba(255,207,94,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(sl.x, sl.y + 26, 62, 18, 0, 0, 7); ctx.stroke();
  }
  for (const c of R.customers) drawCustOverlay(c, t);
  for (let i = 0; i < 12; i++) if (G.stations[i].broken && G.stations[i].owned) drawBroken(i, t);
  if (G.vip) {
    ctx.save();
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 2);
    drawSpr('ui/banner_crown', COUNTER.x + 50, COUNTER.y - 72);
    ctx.restore();
  }
  for (const f of R.floats) drawFloater(f);
  /* لایهٔ صفحه (ذرات سکه) */
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawParticles();
}

/* ================= 9) ورودی لمسی (tap / drag / pinch) ================= */
const ptrs = new Map();
let pinch0 = null;
const MOVED_MAX = 11;

function bindInput() {
  cv.addEventListener('pointerdown', e => {
    ensureAudio();
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  });
  cv.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (ptrs.size === 2 && pinch0) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 10) {
        cam.z = clamp(pinch0.z * d / pinch0.d, cam.minZ, cam.maxZ);
        const w0 = toWorld(pinch0.mx, pinch0.my);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const w1 = toWorld(mid.x, mid.y);
        cam.x += w0.x - w1.x; cam.y += w0.y - w1.y;
        clampCam();
        closePop();
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > MOVED_MAX) p.moved = true;
    if (p.moved) {
      cam.x -= dx / cam.z; cam.y -= dy / cam.z;
      clampCam();
      closePop();
    }
  });
  const up = e => {
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (p && !p.moved && ptrs.size === 0) {
      const w = toWorld(e.clientX, e.clientY);
      tapWorld(w.x, w.y);
    }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
}

function custTap(c) {
  R.sel = { t: 'cust', id: c.id };
  if (c.need) serveCustomer(c, false);
  else floater(c.x, c.y - 96, 'رضایت: ' + fmt(Math.round(clamp(c.sat, 0, 100))) + '٪', '#9fd8ff');
}
function stTap(i) {
  R.sel = { t: 'st', id: i };
  const sl = LAYOUT.stations[i];
  openPop({ type: 'st', id: i }, sl.x, sl.y - 70);
}
function propTap(p) {
  const s = sprSize(p.k);
  openPop({ type: 'prop', kind: p.prop }, p.x, p.y - s.h);
}
function cleanTrash(i) {
  R.trash.splice(i, 1);
  G.stats.cleaned++; addXp(1);
  SFX.serve();
}
function tapWorld(wx, wy) {
  SFX.tap();
  const cands = [];
  for (const c of R.customers) {
    if (Math.hypot(wx - c.x, wy - (c.y - 38)) < 32) cands.push({ y: c.y - 38, f: () => custTap(c) });
  }
  for (let i = 0; i < 12; i++) {
    const sl = LAYOUT.stations[i];
    if (Math.abs(wx - sl.x) < 62 && wy > sl.y - 104 && wy < sl.y + 52) cands.push({ y: sl.y, f: () => stTap(i) });
  }
  for (const p of propList) {
    if (!p.prop) continue;
    const s = sprSize(p.k);
    if (Math.abs(wx - p.x) < s.w * 0.55 + 6 && wy > p.y - s.h - 8 && wy < p.y + 14) cands.push({ y: p.y + 4, f: () => propTap(p) });
  }
  R.trash.forEach((tr, i) => {
    if (Math.hypot(wx - tr.x, wy - tr.y) < 20) cands.push({ y: tr.y + 6, f: () => cleanTrash(i) });
  });
  if (cands.length) {
    cands.sort((a, b) => b.y - a.y);
    cands[0].f();
  } else {
    closePop(); R.sel = null;
  }
}

/* ================= 10) UI ================= */
const popEl = document.getElementById('pop');
const dimEl = document.getElementById('dim');
const PANELS = ['pShop', 'pMission', 'pAch', 'pGift', 'pSet'];

function openPanel(id) {
  closePanels(); closePop();
  dimEl.classList.remove('hidden');
  document.getElementById(id).classList.add('open');
  SFX.tap();
}
function closePanels() {
  PANELS.forEach(p => document.getElementById(p).classList.remove('open'));
  dimEl.classList.add('hidden');
}
function coinImg() { return ' <img src="assets/ui/coin.png" style="width:14px;height:14px;vertical-align:-2px">'; }
function gemImg() { return ' <img src="assets/ui/diamond.png" style="width:14px;height:14px;vertical-align:-2px">'; }

/* ---- پاپ‌آور ---- */
function openPop(c, wx, wy) {
  R.popCtx = c; R.popAnchor = { x: wx, y: wy };
  renderPop(); placePop();
  SFX.tap();
}
function closePop() {
  R.popCtx = null;
  popEl.classList.add('hidden');
}
function renderPop() {
  if (!R.popCtx) return;
  popEl.innerHTML = popHTML(R.popCtx);
  popEl.classList.remove('hidden');
  placePop();
}
function placePop() {
  if (!R.popCtx || !R.popAnchor) return;
  const s = toScreen(R.popAnchor.x, R.popAnchor.y);
  const pw = popEl.offsetWidth || 220, ph = popEl.offsetHeight || 120;
  let x = clamp(s.x - pw / 2, 8, cssW - pw - 8);
  let y = s.y - ph - 14;
  if (y < 58) y = s.y + 20;
  y = clamp(y, 58, cssH - ph - 72);
  popEl.style.left = x + 'px';
  popEl.style.top = y + 'px';
}
function stockPop(title, k, cap, note) {
  const d = STOCK_DEF[k];
  return '<h3>' + esc(title) + '</h3>' +
    '<div class="sub">موجودی: ' + fmt(G.stock[k]) + ' از ' + fmt(cap) + '</div>' +
    '<div class="row"><button class="buy" data-act="stock" data-arg="' + k + '">خرید ' + fmt(d.pack) + ' ' + d.name + ' — ' + fmt(d.cost) + coinImg() + '</button></div>' +
    '<div class="sub">' + esc(note) + '</div>';
}
function popHTML(c) {
  if (c.type === 'st') {
    const i = c.id, s = G.stations[i];
    if (!s.owned) {
      const l = STATION_LVL[i], co = STATION_COST[i];
      return '<h3>ایستگاه ' + fmt(i + 1) + '</h3>' +
        '<div class="sub">این اسلات خالی است — با راه‌اندازی، ظرفیت کافه بیشتر می‌شود.</div>' +
        '<div class="sub">نیاز به سطح ' + fmt(l) + '</div>' +
        '<div class="row"><button class="buy" data-act="buyst" data-arg="' + i + '">خرید و راه‌اندازی — ' + fmt(co) + coinImg() + '</button></div>';
    }
    const custId = R.custAt[i];
    const cust = custId ? R.customers.find(x => x.id === custId) : null;
    const ch = CHAIRS[s.tier], nx = CHAIRS[s.tier + 1];
    const pc = PCS[s.pc - 1], npc = PCS[s.pc];
    let h = '<h3>ایستگاه ' + fmt(i + 1) + ' <small>' + (s.broken ? 'خراب!' : cust ? 'مشتری دارد' : 'آمادهٔ کار') + '</small></h3>';
    if (s.broken) {
      h += '<div class="sub">این سیستم تا تعمیر، مشتری نمی‌پذیرد.</div>' +
        '<div class="row"><button class="buy" data-act="fix" data-arg="' + i + '">تعمیر فوری — ۵۰' + coinImg() + '</button></div>';
    } else {
      h += '<div class="row"><div class="sub">تعرفهٔ ساعتی:</div><div class="tariff">';
      TARIFFS.forEach((tf, ti) => {
        h += '<button class="' + (s.tariff === ti ? 'on' : '') + '" data-act="t" data-arg="' + ti + '">' + tf.name + '<br><small>' + fmt(tf.rate) + '</small></button>';
      });
      h += '</div></div>';
      if (cust) h += '<div class="sub">رضایت مشتری: ' + fmt(Math.round(clamp(cust.sat, 0, 100))) + '٪ — تعرفهٔ ' + TARIFFS[cust.tariff].name + '</div>';
      h += '<div class="row">';
      if (nx) h += '<button class="buy" data-act="chair" data-arg="' + i + '">صندلی ' + nx.name + ' — ' + fmt(nx.cost) + coinImg() + '</button> ';
      if (npc) h += '<button class="buy" data-act="pc" data-arg="' + i + '">سیستم ' + npc.name + ' — ' + fmt(npc.cost) + coinImg() + '</button>';
      if (!nx && !npc) h += '<div class="sub">حداکثر ارتقا ✓</div>';
      h += '</div>';
    }
    h += '<div class="sub">' + ch.name + ' ×' + ch.mult + ' — سیستم ' + pc.name + ' ×' + pc.mult + '</div>';
    return h;
  }
  if (c.type === 'prop') {
    const k = c.kind;
    if (k === 'fridge') return stockPop('یخچال نوشیدنی', 'drink', 12 * G.fridge, 'سرو نوشیدنی ۱۰ سکه انعام دارد. یخچال دوم ظرفیت را دوبرابر می‌کند.');
    if (k === 'cooler') return stockPop('آبسردکن', 'water', 24, 'آب ارزان‌ترین سرو است — انعام ۴ سکه.');
    if (k === 'snack') return stockPop('کابینت اسنک', 'snack', 12, 'انعام خوراکی ۱۴ سکه.');
    if (k === 'coffee') {
      if (!G.coffee) return '<h3>دستگاه قهوه</h3><div class="sub">از فروشگاه ← امکانات بخر. با باریستا خودکار می‌فروشد.</div>';
      return stockPop('دستگاه قهوه', 'bean', 15, 'باریستا آن را خودکار می‌فروشد — هر فنجان ۷ سکه.');
    }
  }
  return '';
}
function popAct(act, arg) {
  const c = R.popCtx;
  if (!c) return;
  if (act === 't') { G.stations[c.id].tariff = +arg; SFX.tap(); saveGame(); renderPop(); if (isPanelOpen('pShop')) renderShop(); }
  else if (act === 'chair') { upChair(c.id); renderPop(); }
  else if (act === 'pc') { upPc(c.id); renderPop(); }
  else if (act === 'fix') { fixStation(c.id); renderPop(); }
  else if (act === 'buyst') { buyStation(+arg); renderPop(); }
  else if (act === 'stock') { buyStock(arg); renderPop(); }
  else if (act === 'close') closePop();
}

/* ---- اقدامات خرید ---- */
function noMoney(gem) { toast(gem ? 'الماس کافی نیست!' : 'سکه کافی نیست!', 'bad'); SFX.bad(); }
function pay(cost, gem) {
  if (gem) { if (G.gems < cost) { noMoney(true); return false; } G.gems -= cost; }
  else { if (G.coins < cost) { noMoney(false); return false; } G.coins -= cost; }
  refreshHUD();
  return true;
}
function fixStation(i) {
  if (!G.stations[i].broken) return;
  if (!pay(50)) return;
  G.stations[i].broken = false;
  toast('سیستم تعمیر شد', 'good'); SFX.buy();
}
function buyStation(i) {
  const s = G.stations[i];
  if (s.owned) return;
  if (G.level < STATION_LVL[i]) { toast('نیاز به سطح ' + fmt(STATION_LVL[i]), 'bad'); SFX.bad(); return; }
  if (!pay(STATION_COST[i])) return;
  s.owned = true;
  G.stats.upgrades++;
  rebuildProps();
  toast('ایستگاه ' + fmt(i + 1) + ' راه‌اندازی شد!', 'good');
  SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function upChair(i) {
  const s = G.stations[i];
  const nx = CHAIRS[s.tier + 1];
  if (!nx) { toast('این صندلی حداکثر ارتقا را دارد', 'good'); return; }
  if (!pay(nx.cost)) return;
  s.tier++;
  G.stats.upgrades++;
  toast('صندلی ایستگاه ' + fmt(i + 1) + ' شد: ' + nx.name, 'good');
  SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function upPc(i) {
  const s = G.stations[i];
  const nx = PCS[s.pc];
  if (!nx) { toast('این سیستم حداکثر ارتقا را دارد', 'good'); return; }
  if (!pay(nx.cost)) return;
  s.pc++;
  G.stats.upgrades++;
  toast('سیستم ایستگاه ' + fmt(i + 1) + ' شد: ' + nx.name, 'good');
  SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function capFor(k) {
  if (k === 'drink') return 12 * G.fridge;
  if (k === 'water') return 24;
  if (k === 'snack') return 12;
  if (k === 'bean') return 15;
  return 10;
}
function buyStock(k) {
  if (k === 'bean' && !G.coffee) { toast('اول دستگاه قهوه را بخر', 'bad'); return; }
  const d = STOCK_DEF[k];
  if (G.stock[k] >= capFor(k)) { toast('ظرفیت ' + d.name + ' پر است', 'bad'); return; }
  if (!pay(d.cost)) return;
  G.stock[k] = Math.min(capFor(k), G.stock[k] + d.pack);
  toast('+' + fmt(d.pack) + ' ' + d.name, 'good');
  SFX.buy(); saveGame();
  refreshHUD();
}
function buyFridge2() {
  if (G.fridge >= 2) return;
  if (G.level < 4) { toast('نیاز به سطح ۴', 'bad'); SFX.bad(); return; }
  if (!pay(800)) return;
  G.fridge = 2;
  G.stats.upgrades++;
  rebuildProps();
  toast('یخچال دوم نصب شد!', 'good'); SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function buyCoffee() {
  if (G.coffee) return;
  if (G.level < 3) { toast('نیاز به سطح ۳', 'bad'); SFX.bad(); return; }
  if (!pay(600)) return;
  G.coffee = true;
  G.stats.upgrades++;
  rebuildProps();
  toast('دستگاه قهوه فعال شد!', 'good'); SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function hireAct(id) {
  const def = STAFF_DEFS.find(s => s.id === id);
  if (G.staff[id]) return;
  if (G.level < def.lvl) { toast('نیاز به سطح ' + fmt(def.lvl), 'bad'); SFX.bad(); return; }
  if (!pay(def.cost)) return;
  hireStaff(id);
  toast(def.name + ' استخدام شد!', 'good'); SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function buyDecor(id) {
  const d = DECOR.find(x => x.id === id);
  if (!d || G.decor[id]) return;
  if (!pay(d.cost)) return;
  G.decor[id] = true;
  rebuildProps();
  toast(d.name + ' نصب شد — +' + Math.round(d.bonus * 100) + '٪ درآمد', 'good');
  SFX.buy(); saveGame();
  if (isPanelOpen('pShop')) renderShop();
}
function gemBuy(id) {
  const it = GEMSHOP.find(x => x.id === id);
  if (!it) return;
  if (it.id === 'vip' && G.vip) return;
  if (!pay(it.cost, true)) return;
  if (it.id === 'rush') { G.boost.rushUntil = performance.now() + 60000; toast('تبلیغ فعال شد — ۶۰ ثانیه موج مشتری!', 'good'); }
  else if (it.id === 'bag') { G.coins += 400; toast('+۴۰۰ سکه!', 'good'); coinBurst(COUNTER.x, COUNTER.y - 40, 6); }
  else if (it.id === 'fix') { G.stations.forEach(s => s.broken = false); toast('همهٔ سیستم‌ها سالم شدند', 'good'); }
  else if (it.id === 'vip') { G.vip = true; toast('لوژ VIP فعال شد — +۱۰٪ درآمد دائمی', 'good'); }
  SFX.gift(); saveGame(); refreshHUD();
  if (isPanelOpen('pShop')) renderShop();
}

/* ---- پنل فروشگاه ---- */
function card(img, title, sub, btnHtml) {
  return '<div class="item"><div class="ic"><img src="' + img + '" alt=""></div>' +
    '<div class="tx"><b>' + title + '</b><small>' + sub + '</small></div>' + (btnHtml || '') + '</div>';
}
function buyBtn(act, arg, label, cost, dia, disabled) {
  return '<button class="act' + (dia ? ' dia' : '') + '" data-act="' + act + '" data-arg="' + arg + '"' + (disabled ? ' disabled' : '') + '>' +
    label + '<small>' + fmt(cost) + (dia ? gemImg() : coinImg()) + '</small></button>';
}
function renderShop() {
  const b = document.getElementById('shopBody');
  document.querySelectorAll('#shopTabs button').forEach(x => x.classList.toggle('on', x.dataset.t === R.shopTab));
  let h = '';
  if (R.shopTab === 'up') {
    h += '<div class="sub" style="color:#8890b8;margin:2px 4px 8px">ایستگاه‌ها — صندلی و سیستم هر ایستگاه جدا ارتقا می‌گیرد</div>';
    for (let i = 0; i < 12; i++) {
      const s = G.stations[i];
      if (!s.owned) {
        const lock = G.level < STATION_LVL[i];
        h += card('assets/furniture/gaming_desk_a.png',
          'ایستگاه ' + fmt(i + 1),
          lock ? 'نیاز به سطح ' + fmt(STATION_LVL[i]) : 'آماده برای راه‌اندازی — درآمد جدید!',
          buyBtn('buyst', i, 'راه‌اندازی', STATION_COST[i], false, false));
      } else {
        const nx = CHAIRS[s.tier + 1], npc = PCS[s.pc];
        let btns = '';
        if (nx) btns += buyBtn('chair', i, 'صندلی ' + nx.name, nx.cost, false, false) + ' ';
        if (npc) btns += buyBtn('pc', i, 'سیستم ' + npc.name, npc.cost, false, false);
        if (!nx && !npc) btns = '<button class="act done">کامل ✓</button>';
        h += card('assets/' + CHAIRS[s.tier].k.replace('furniture/', 'furniture/') + '.png'.replace('.png', '.png'),
          'ایستگاه ' + fmt(i + 1) + ' — ' + (s.broken ? '⚠ خراب' : 'فعال'),
          'صندلی: ' + CHAIRS[s.tier].name + ' ×' + CHAIRS[s.tier].mult + ' | سیستم: ' + PCS[s.pc - 1].name + ' ×' + PCS[s.pc - 1].mult,
          btns);
      }
    }
  } else if (R.shopTab === 'fac') {
    h += card('assets/ui/diamond.png', 'موجودی ملزومات',
      'نوشیدنی ' + fmt(G.stock.drink) + '/' + fmt(capFor('drink')) + ' | آب ' + fmt(G.stock.water) + '/24 | خوراکی ' + fmt(G.stock.snack) + '/12 | قهوه ' + fmt(G.stock.bean) + '/15',
      '');
    h += card('assets/furniture/vending_fridge.png', 'خرید نوشیدنی', 'بستهٔ ۱۰تایی — انعام ۱۰ سکه', buyBtn('stock', 'drink', 'خرید', STOCK_DEF.drink.cost));
    h += card('assets/furniture/water_cooler.png', 'خرید آب سرد', 'بستهٔ ۲۰تایی — انعام ۴ سکه', buyBtn('stock', 'water', 'خرید', STOCK_DEF.water.cost));
    h += card('assets/furniture/snack_cabinet.png', 'خرید خوراکی', 'بستهٔ ۱۰تایی — انعام ۱۴ سکه', buyBtn('stock', 'snack', 'خرید', STOCK_DEF.snack.cost));
    if (G.coffee) h += card('assets/furniture/coffee_machine.png', 'خرید دانهٔ قهوه', 'بستهٔ ۲۰تایی — باریستا می‌فروشد', buyBtn('stock', 'bean', 'خرید', STOCK_DEF.bean.cost));
    if (G.fridge < 2) h += card('assets/furniture/vending_fridge.png', 'یخچال دوم', 'ظرفیت نوشیدنی ×۲ — نیاز به سطح ۴', buyBtn('fridge2', '1', 'نصب', 800));
    if (!G.coffee) h += card('assets/furniture/coffee_machine.png', 'دستگاه قهوه', 'درآمد خودکار — نیاز به سطح ۳', buyBtn('coffee', '1', 'خرید', 600));
    h += '<div class="sub" style="color:#8890b8;margin:10px 4px 8px">کارمندها — کارها را خودکار انجام می‌دهند</div>';
    for (const d of STAFF_DEFS) {
      if (G.staff[d.id]) h += card('assets/' + DK[d.sprite].src.replace('assets/', ''), d.name + ' ✓', 'در حال کار', '<button class="act done">فعال</button>');
      else h += card('assets/' + DK[d.sprite].src.replace('assets/', ''), d.name, d.desc + ' — نیاز به سطح ' + fmt(d.lvl), buyBtn('hire', d.id, 'استخدام', d.cost));
    }
  } else if (R.shopTab === 'dec') {
    h += '<div class="sub" style="color:#8890b8;margin:2px 4px 8px">دکور — زیبایی + بونوس درآمد سراسری (فعلی: +' + Math.round(decorBonus() * 100) + '٪)</div>';
    for (const d of DECOR) {
      if (G.decor[d.id]) h += card('assets/' + d.cat + '.png', d.name + ' ✓', 'نصب‌شده — +' + Math.round(d.bonus * 100) + '٪', '<button class="act done">دارد</button>');
      else h += card('assets/' + d.cat + '.png', d.name, '+' + Math.round(d.bonus * 100) + '٪ درآمد کل', buyBtn('decor', d.id, 'خرید', d.cost));
    }
  } else { /* vip — الماسی */
    h += '<div class="sub" style="color:#8890b8;margin:2px 4px 8px">الماس از: سطح‌گرفتن، افتخارات، هدیهٔ روزانه</div>';
    for (const it of GEMSHOP) {
      if (it.id === 'vip' && G.vip) { h += card('assets/' + it.ic + '.png', it.name + ' ✓', 'دائمی فعال', '<button class="act done">دارد</button>'); continue; }
      h += card('assets/' + it.ic + '.png', it.name, it.desc, buyBtn('gem', it.id, 'خرید', it.cost, true, false));
    }
  }
  b.innerHTML = h;
}
function isPanelOpen(id) { return document.getElementById(id).classList.contains('open'); }

/* ---- ماموریت‌ها ---- */
function metric(m) {
  if (m === 'level') return G.level;
  if (m === 'coins') return Math.floor(G.coins);
  if (m === 'rep') return Math.round(G.rep);
  if (m === 'happyStreak') return G.stats.happyStreak;
  return G.stats[m] || 0;
}
function ensureMissions() {
  let guard = 0;
  while (G.missions.length < 3 && guard++ < 30) {
    const act = new Set(G.missions.map(m => m.id));
    const pool = MISSION_DEFS.filter(d => !act.has(d.id));
    if (!pool.length) break;
    const def = pick(pool);
    G.missions.push({ id: def.id, m0: metric(def.m) });
  }
}
function checkMissions() {
  for (let i = G.missions.length - 1; i >= 0; i--) {
    const m = G.missions[i];
    const def = MISSION_DEFS.find(d => d.id === m.id);
    if (!def) { G.missions.splice(i, 1); continue; }
    const v = metric(def.m);
    const prog = def.abs ? v : v - m.m0;
    if (prog >= def.t) {
      G.coins += def.rc; G.gems += def.rg;
      toast('ماموریت کامل شد: ' + def.txt, 'good');
      SFX.gift();
      G.missions.splice(i, 1);
      refreshHUD();
    }
  }
  ensureMissions();
}
function renderMissions() {
  const b = document.getElementById('missionBody');
  let h = '<div class="sub" style="color:#8890b8;margin:2px 4px 10px">ماموریت‌ها خودکار شمرده می‌شوند و با اتمام، جایزه می‌گیرند.</div>';
  for (const m of G.missions) {
    const def = MISSION_DEFS.find(d => d.id === m.id);
    if (!def) continue;
    const v = metric(def.m);
    const prog = clamp(def.abs ? v : v - m.m0, 0, def.t);
    const pct = Math.round(prog / def.t * 100);
    h += '<div class="mis"><b>' + esc(def.txt) + '</b>' +
      '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="rw"><img src="assets/ui/coin.png">' + fmt(def.rc) +
      (def.rg ? ' <img src="assets/ui/diamond.png"> ' + fmt(def.rg) : '') +
      ' <span style="color:#9aa2c0"> — ' + fmt(Math.floor(prog)) + '/' + fmt(def.t) + '</span></div></div>';
  }
  b.innerHTML = h;
}

/* ---- افتخارات ---- */
function checkAchs() {
  for (const d of ACH_DEFS) {
    if (!G.ach[d.id] && d.c(G)) {
      G.ach[d.id] = 'p';
      toast('افتخار جدید: ' + d.txt + '!', 'good');
      SFX.lvl();
    }
  }
  document.getElementById('dotAch').classList.toggle('hidden', !Object.values(G.ach).includes('p'));
}
function renderAch() {
  const b = document.getElementById('achBody');
  let h = '<div class="statline" style="background:#1d2132;border:1px solid #2f3552;border-radius:12px;padding:10px;margin-bottom:10px">' +
    'مشتری‌های سرویس‌شده: <b>' + fmt(G.stats.served) + '</b> — درآمد کل: <b>' + fmt(G.stats.earned) + '</b><br>' +
    'نوشیدنی: <b>' + fmt(G.stats.drinks) + '</b> — خوراکی: <b>' + fmt(G.stats.snacks) + '</b> — نظافت: <b>' + fmt(G.stats.cleaned) + '</b><br>' +
    'مشتری عصبانی: <b>' + fmt(G.stats.angry) + '</b> — ارتقاها: <b>' + fmt(G.stats.upgrades) + '</b></div>';
  for (const d of ACH_DEFS) {
    const st = G.ach[d.id];
    const got = st === true;
    h += '<div class="ach' + (got ? ' got' : '') + '"><img src="assets/' + d.ic + '.png" alt="">' +
      '<div class="tx"><b>' + esc(d.txt) + '</b><small>' + esc(d.d) + '</small></div>';
    if (got) h += '<button class="act done">✓</button>';
    else if (st === 'p') h += '<button class="act" data-ach="' + d.id + '">دریافت ' + fmt(d.rg) + gemImg() + '</button>';
    else h += '<button class="act" disabled>—</button>';
    h += '</div>';
  }
  b.innerHTML = h;
}

/* ---- هدیهٔ روزانه ---- */
function canGift() { return G.gift.last !== todayStr(); }
function claimGift() {
  if (!canGift()) return;
  const y = todayStr(-1);
  G.gift.streak = G.gift.last === y ? G.gift.streak + 1 : 1;
  G.gift.best = Math.max(G.gift.best, G.gift.streak);
  G.gift.last = todayStr();
  const c = 80 + G.gift.streak * 70;
  const g = Math.min(5, Math.ceil(G.gift.streak / 2));
  G.coins += c; G.gems += g;
  toast('هدیهٔ روز ' + fmt(G.gift.streak) + ': ' + fmt(c) + ' سکه + ' + fmt(g) + ' الماس!', 'good');
  SFX.gift();
  coinBurst(COUNTER.x, COUNTER.y - 40, 8);
  saveGame(); refreshHUD();
  renderGift();
}
function renderGift() {
  const b = document.getElementById('giftBody');
  let h = '<div class="sub" style="color:#8890b8;margin:2px 4px 6px">هر روز بیا — استریک جایزه را پُرتر می‌کند (فعلی: روز ' + fmt(Math.max(1, G.gift.streak)) + ' از ۷)</div>';
  h += '<div class="giftgrid">';
  for (let d = 1; d <= 7; d++) {
    const on = d === ((G.gift.streak % 7) + (canGift() ? 1 : 0)) || d === G.gift.streak && !canGift();
    h += '<div class="gd' + (on ? ' on' : '') + '">روز ' + fmt(d) + '<b>' + fmt(80 + d * 70) + '</b>سکه<br>' + fmt(Math.min(5, Math.ceil(d / 2))) + ' الماس</div>';
  }
  h += '</div>';
  h += '<button id="btnClaim"' + (canGift() ? '' : ' disabled') + '>' + (canGift() ? 'دریافت هدیهٔ امروز' : 'امروز گرفته شد — فردا بیا!') + '</button>';
  b.innerHTML = h;
  const cb = document.getElementById('btnClaim');
  if (cb) cb.onclick = claimGift;
}

/* ---- تنظیمات ---- */
function renderSet() {
  const b = document.getElementById('setBody');
  b.innerHTML =
    '<div class="setrow"><div class="tx">صداها</div><button class="tgl' + (G.settings.sound ? ' on' : '') + '" id="tglSound"><i></i></button></div>' +
    '<div class="setrow"><div class="tx">نمای کامل کافه</div><button class="act" id="btnFit2" style="min-width:110px">اجرا</button></div>' +
    '<div class="setrow"><div class="tx statline">نسخه ' + VERSION + ' — کاملاً آفلاین<br>ذخیرهٔ خودکار روی همین دستگاه</div></div>' +
    '<div class="setrow danger" id="btnReset">پاک‌کردن کل پیشرفت</div>';
  document.getElementById('tglSound').onclick = () => {
    G.settings.sound = !G.settings.sound;
    saveGame(); renderSet(); SFX.tap();
  };
  document.getElementById('btnFit2').onclick = () => { fitView(); closePop(); };
  const rs = document.getElementById('btnReset');
  rs.onclick = () => {
    if (R.resetArm) { resetSave(); return; }
    R.resetArm = 1;
    rs.textContent = 'مطمئنی؟ دوباره بزن تا پاک شود';
    setTimeout(() => { R.resetArm = 0; if (isPanelOpen('pSet')) renderSet(); }, 3500);
  };
}

/* ---- نوار بالا ---- */
function refreshHUD() {
  document.getElementById('hudCoin').textContent = fmt(G.coins);
  document.getElementById('hudGem').textContent = fmt(G.gems);
  document.getElementById('hudLvl').textContent = fmt(G.level);
  document.getElementById('hudRep').style.width = clamp(G.rep, 0, 100) + '%';
  document.getElementById('dotGift').classList.toggle('hidden', !canGift());
}
let chipPulseT = 0;
function chipPulse() {
  const el = document.getElementById('chipCoin');
  el.classList.add('pulse');
  clearTimeout(chipPulseT);
  chipPulseT = setTimeout(() => el.classList.remove('pulse'), 470);
}
let lastToast = '', lastToastT = 0;
function toast(txt, cls) {
  const now = performance.now();
  if (txt === lastToast && now - lastToastT < 1500) return;
  lastToast = txt; lastToastT = now;
  const box = document.getElementById('toasts');
  while (box.children.length >= 3) box.removeChild(box.firstChild);
  const d = document.createElement('div');
  d.className = 'toast' + (cls ? ' ' + cls : '');
  d.textContent = txt;
  box.appendChild(d);
  setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2600);
}

/* ---- اتصال UI ---- */
function buildUI() {
  document.getElementById('btnShop').onclick = () => { openPanel('pShop'); renderShop(); };
  document.getElementById('btnMission').onclick = () => { openPanel('pMission'); renderMissions(); };
  document.getElementById('btnAch').onclick = () => { openPanel('pAch'); renderAch(); };
  document.getElementById('btnGift').onclick = () => { openPanel('pGift'); renderGift(); };
  document.getElementById('btnSet').onclick = () => { openPanel('pSet'); renderSet(); };
  document.querySelectorAll('[data-close]').forEach(x => x.onclick = closePanels);
  dimEl.onclick = closePanels;
  document.getElementById('fitbtn').onclick = () => { fitView(); closePop(); SFX.tap(); };
  document.getElementById('shopTabs').addEventListener('click', e => {
    const t = e.target.closest('[data-t]');
    if (t) { R.shopTab = t.dataset.t; renderShop(); SFX.tap(); }
  });
  document.getElementById('shopBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act, arg = btn.dataset.arg;
    if (act === 'buyst') buyStation(+arg);
    else if (act === 'chair') upChair(+arg);
    else if (act === 'pc') upPc(+arg);
    else if (act === 'stock') buyStock(arg);
    else if (act === 'fridge2') buyFridge2();
    else if (act === 'coffee') buyCoffee();
    else if (act === 'hire') hireAct(arg);
    else if (act === 'decor') buyDecor(arg);
    else if (act === 'gem') gemBuy(arg);
    renderShop();
  });
  popEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (btn) popAct(btn.dataset.act, btn.dataset.arg);
  });
  document.getElementById('achBody').addEventListener('click', e => {
    const btn = e.target.closest('[data-ach]');
    if (!btn) return;
    const d = ACH_DEFS.find(x => x.id === btn.dataset.ach);
    if (d && G.ach[d.id] === 'p') {
      G.ach[d.id] = true;
      G.gems += d.rg;
      toast('+' + fmt(d.rg) + ' الماس!', 'good');
      SFX.gift(); saveGame(); refreshHUD(); renderAch();
    }
  });
  document.getElementById('intro').classList.add('hidden'); /* تا پایان لود پنهان */
  document.getElementById('btnStart').onclick = () => {
    G.seenIntro = true;
    saveGame();
    document.getElementById('intro').classList.add('hidden');
    R.running = true;
    toast('به کافه‌نت خوش آمدی — اولین مشتری‌ها راه می‌افتند!', 'good');
  };
}

/* ================= 11) حلقهٔ اصلی و بوت ================= */
function coinBurst(wx, wy, n) {
  const r = document.getElementById('chipCoin').getBoundingClientRect();
  const s = toScreen(wx, wy);
  const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    R.parts.push({ sx: s.x + rand(-14, 14), sy: s.y + rand(-8, 8), tx, ty, t: -i * 0.07, dur: 0.7 + rand(0, 0.15) });
  }
}
function floater(x, y, txt, c) {
  R.floats.push({ x, y, txt, c: c || '#ffffff', t: 0 });
}
function update(dt, t) {
  R.t += dt;
  updateSpawner(dt);
  updateCustomers(dt);
  updateStaff(dt);
  for (let i = R.floats.length - 1; i >= 0; i--) {
    const f = R.floats[i];
    f.t += dt;
    if (f.t > 1.25) R.floats.splice(i, 1);
  }
  let coinDone = false;
  for (let i = R.parts.length - 1; i >= 0; i--) {
    const p = R.parts[i];
    p.t += dt;
    if (p.t > p.dur) { R.parts.splice(i, 1); coinDone = true; }
  }
  if (coinDone) chipPulse();
  R.hudAcc += dt;
  if (R.hudAcc > 0.3) {
    R.hudAcc = 0;
    refreshHUD();
    checkAchs();
    checkMissions();
    if (G.boost.rushUntil && performance.now() > G.boost.rushUntil) {
      G.boost.rushUntil = 0;
      toast('اثر تبلیغ تمام شد', 'bad');
    }
    if (isPanelOpen('pMission')) renderMissions();
  }
  R.saveAcc += dt;
  if (R.saveAcc > 8) { R.saveAcc = 0; saveGame(); }
}
let lastT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!R.ready) return;
  const t = ts / 1000;
  let dt = t - lastT;
  lastT = t;
  if (!(dt > 0) || dt > 0.06) dt = 0.016;
  if (R.running) update(dt, t);
  render(t);
}
function startGame() { /* توسط دکمهٔ مقدمه صدا زده می‌شود */ }

function boot() {
  buildKey();
  loadAssets(() => {
    buildBg();
    const had = loadGame();
    if (!had || !Array.isArray(G.stations) || G.stations.length !== 12) freshStations();
    rebuildProps();
    for (const id in G.staff) if (G.staff[id]) spawnStaff(id);
    ensureMissions();
    buildUI();
    resize();
    refreshHUD();
    document.getElementById('loader').classList.add('hidden');
    ['topbar', 'navbar', 'fitbtn'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    if (G.seenIntro) R.running = true;
    else document.getElementById('intro').classList.remove('hidden');
    R.ready = true;
    window.__BOOT_READY = true;
    if (window.CAF) window.CAF.ready = true;
  });
  requestAnimationFrame(frame);
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', saveGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('beforeunload', saveGame);
}

/* قلاب تست/اشکال‌زدایی (هدلس) */
window.CAF = {
  v: VERSION, ready: false,
  img: CAF_IMG,
  get state() {
    return {
      coins: Math.floor(G.coins), gems: G.gems, level: G.level, rep: Math.round(G.rep),
      customers: R.customers.length, staff: R.staffArr.length, trash: R.trash.length,
      stations: G.stations.map(s => ({ o: s.owned, t: s.tier, p: s.pc, tf: s.tariff, b: s.broken })),
      stats: G.stats, cam: { x: Math.round(cam.x), y: Math.round(cam.y), z: +cam.z.toFixed(3) },
      screen: { w: cssW, h: cssH, dpr: DPR },
    };
  },
  api: {
    tap(sx, sy) { const w = toWorld(sx, sy); tapWorld(w.x, w.y); },
    tapWorld(wx, wy) { tapWorld(wx, wy); },
    spawn(n) { for (let i = 0; i < (n || 1); i++) spawnCustomer(); },
    fast(sec) { const n = Math.round((sec || 1) * 30); for (let i = 0; i < n; i++) update(1 / 30, R.t + 1 / 30); },
    serveAll() { R.customers.forEach(c => { if (c.need) serveCustomer(c, false); }); },
    save() { saveGame(); },
    drop() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
    ui(id) { document.getElementById(id).click(); },
    panel(id) { openPanel(id); },
    stationSlot(i) { const sl = LAYOUT.stations[i]; return toScreen(sl.x, sl.y); },
    sessionInfo() { return R.customers.filter(c => c.st === 'play').map(c => ({ st: c.st, need: c.need, sat: Math.round(c.sat), hours: c.hours, tariff: c.tariff })); },
  },
};

boot();
