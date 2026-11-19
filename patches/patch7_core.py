# -*- coding: utf-8 -*-
# پچ ۷ — هسته: صفرِ صدا + پشتیبان + میزِ تکی + VIP(۴ میز) + pcTier + کارمندِ شبکه/مسابقات + تورنمنت + رقبا
import io
p = io.open('p2_core.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) ذخیره: پشتیبان + فیلدهای تازه ----------
rep("""const SAVE_KEY = 'cafnet_full_v2';
const SAVE_VERSION = 3;""",
"""const SAVE_KEY = 'cafnet_full_v2';
const SAVE_BAK = 'cafnet_full_v2_bak';
const SAVE_VERSION = 3;
let _saveN = 0;""")

rep("""      music: true, volS: 0.8, volM: 0.5,
    };""",
"""      music: true, volS: 0.8, volM: 0.5,
      deskOff: {},               // میزهای فروخته‌شده — فروشِ تکتکی
      rivals: null,              // وضعیتِ کاملِ رقبا
      staffXp: { tech: 0, clean: 0, mgr: 0, net: 0, emgr: 0 },
      reviews: [],               // نظراتِ مشتریان
      supplier: false,           // تخفیفِ تأمین‌کننده — خریدِ بعدی ۲۰٪
      powerSpike: false,         // برقِ گرانِ امروز
      tourPend: null,            // تورنمنتِ فردا
      ltDone: [], seenTut: false,
    };""")

rep("""  load(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if(p && p.saveVersion === SAVE_VERSION){""",
"""  load(){
    let p = null;
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      p = raw ? JSON.parse(raw) : null;
      if(!p){
        const b = localStorage.getItem(SAVE_BAK);
        p = b ? JSON.parse(b) : null;
        if(p) console.warn('cafnet: ذخیره‌ی اصلی نبود — از پشتیبان بازیابی شد');
      }
    }catch(e){
      try{ const b = localStorage.getItem(SAVE_BAK); p = b ? JSON.parse(b) : null; }catch(e2){ p = null; }
    }
    try{
      if(p && p.saveVersion === SAVE_VERSION){""")

rep("""        if('volS' in p) this.d.volS = clamp(+p.volS || 0.8, 0, 1);
        if('volM' in p) this.d.volM = clamp(+p.volM || 0.5, 0, 1);
        this.d.saveVersion = SAVE_VERSION;""",
"""        // مقدارِ صفرِ صدا باید صفر بماند — نه جایگزین با پیش‌فرض
        const vs = typeof p.volS === 'number' ? p.volS : parseFloat(p.volS);
        const vm = typeof p.volM === 'number' ? p.volM : parseFloat(p.volM);
        this.d.volS = clamp(isFinite(vs) ? vs : 0.8, 0, 1);
        this.d.volM = clamp(isFinite(vm) ? vm : 0.5, 0, 1);
        if(p.deskOff && typeof p.deskOff === 'object'){
          this.d.deskOff = {};
          for(const k in p.deskOff){ const i = +k; if(p.deskOff[k] && i >= 4 && i < 20) this.d.deskOff[i] = 1; }
        }
        if(p.rivals && typeof p.rivals === 'object') this.d.rivals = p.rivals;
        else if(p.rivalFame){
          this.d.rivals = {};
          for(const r of RIVALS) this.d.rivals[r.id] = { fame: p.rivalFame[r.id] || 40, eq: r.eq, price: r.price, cash: 4000000, strat: r.strat, alive: true, ad: 0 };
        }
        if(p.staffXp) Object.assign(this.d.staffXp, p.staffXp);
        if(Array.isArray(p.reviews)) this.d.reviews = p.reviews.slice(0, 12);
        this.d.supplier = !!p.supplier;
        this.d.powerSpike = !!p.powerSpike;
        if(p.tourPend && TOURN.find(t => t.id === p.tourPend)) this.d.tourPend = p.tourPend;
        if(Array.isArray(p.ltDone)) this.d.ltDone = p.ltDone.filter(x => typeof x === 'string');
        this.d.seenTut = !!p.seenTut;
        this.d.saveVersion = SAVE_VERSION;""")

rep("""  save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); }catch(e){} },""",
"""  save(){
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.d));
      _saveN++;
      if(_saveN % 8 === 0) localStorage.setItem(SAVE_BAK, JSON.stringify(this.d));
    }catch(e){}
  },""")

# ---------- ۲) دنیای بزرگ‌تر + سالن VIP ----------
rep("""const VW = 360, VH = 640;
const WORLD_W = 640;   // عرضِ کلِ دنیا — سالن دوم از x=400""",
"""const VW = 360, VH = 640;
const WORLD_W = 820;   // عرضِ کلِ دنیا — سالن دوم از x=400 · VIP از x=660""")

# ---------- ۳) ارتقاهای تازه + دسته‌بندی ----------
rep("""const UPGRADES = [
  { id:'sys',       name:'سیستم جدید',      icon:'🖥', max:6, prices:[1100000,2200000,3800000,6000000,9000000,13000000], eff:'یک میز و کامپیوتر بیشتر — ظرفیت مشتری' },
  { id:'router',    name:'روتر قوی‌تر',     icon:'📡', max:5, prices:[800000,1800000,3500000,6500000,11000000],  eff:'۱۵ واحد به بودجه‌ی پهنای باند' },
  { id:'seat',      name:'صندلی راحت',      icon:'💺', max:4, prices:[600000,1400000,3000000,5500000],           eff:'صبرِ مشتری‌ها ۱۰٪ بیشتر' },
  { id:'snack',     name:'منوی کافه',       icon:'☕', max:4, prices:[700000,1600000,3200000,6000000],           eff:'چایِ گران‌تر، آرام‌بخش‌تر، کتریِ سریع‌تر' },
  { id:'neon',      name:'تابلوی نئون',     icon:'✨', max:4, prices:[500000,1200000,2800000,5000000],           eff:'ورودِ مشتری ۷٪ بیشتر' },
  { id:'adsl',      name:'خط پرسرعت',       icon:'🚀', max:3, prices:[1500000,3500000,7000000],                  eff:'پیشرفتِ دانلود و گیم ۱۸٪ سریع‌تر' },
  { id:'printer',   name:'چاپگر لیزری',     icon:'🖨', max:3, prices:[900000,2000000,4000000],                   eff:'چاپ ۲۵٪ سریع‌تر' },
  { id:'ups',       name:'یو‌پی‌اس',        icon:'🔋', max:2, prices:[1200000,3000000],                          eff:'قطعیِ کوتاه‌تر' },
  { id:'antivirus', name:'آنتی‌ویروس',      icon:'🛡', max:2, prices:[1000000,2400000],                          eff:'ویروسِ کوتاه‌تر، ری‌استارتِ سریع‌تر' },
  { id:'deco',      name:'دکور و نور',      icon:'🖼', max:3, prices:[800000,2000000,4500000],                   eff:'شهرت روزانه +۲ · عصبانی‌شدن کم‌ضررتر' },
  { id:'vip',       name:'اتاق VIP',        icon:'👑', max:1, prices:[8000000],                                  eff:'مشتری‌های VIP: دوبرابرِ پول، حلقه‌ی طلایی' },
  { id:'tea2',      name:'کتریِ دوم',       icon:'🫖', max:2, prices:[1500000,4000000],                          eff:'چای هم‌زمان برای ۲ مشتری' },
  { id:'staff',     name:'کارمندِ خوش‌قدم',  icon:'🧍', max:2, prices:[2200000,5500000],                          eff:'چای و اسنک را خودش سرو می‌کند — دستِ تو آزاد می‌ماند' },
  { id:'hall',      name:'سالن دومِ گیم',    icon:'🏛', max:2, prices:[15000000,40000000],                        eff:'اتاقِ گیمِ بزرگ باز می‌شود — ۳ میزِ تازه در هر سطح' },""",
"""const UPGRADES = [
  { id:'sys',       cat:'equip', name:'سیستم جدید',      icon:'🖥', max:6, prices:[1100000,2200000,3800000,6000000,9000000,13000000], eff:'یک میز و کامپیوتر بیشتر — ظرفیت مشتری' },
  { id:'pcTier',    cat:'equip', name:'کیفیتِ سیستم‌ها',  icon:'💠', max:5, prices:[3000000,6000000,11000000,18000000,30000000],       eff:'اداری→میان‌رده→گیمینگ→حرفه‌ای→فوق‌حرفه‌ای · درآمد +۶٪ و جذبِ مشتری +۳٪ در هر سطح — روی همه‌ی میزها دیده می‌شود' },
  { id:'router',    cat:'equip', name:'روتر قوی‌تر',     icon:'📡', max:5, prices:[800000,1800000,3500000,6500000,11000000],  eff:'۱۵ واحد به بودجه‌ی پهنای باند' },
  { id:'seat',      cat:'equip', name:'صندلی راحت',      icon:'💺', max:4, prices:[600000,1400000,3000000,5500000],           eff:'صبرِ مشتری‌ها ۱۰٪ بیشتر' },
  { id:'snack',     cat:'equip', name:'منوی کافه',       icon:'☕', max:4, prices:[700000,1600000,3200000,6000000],           eff:'چایِ گران‌تر، آرام‌بخش‌تر، کتریِ سریع‌تر' },
  { id:'neon',      cat:'deco',  name:'تابلوی نئون',     icon:'✨', max:4, prices:[500000,1200000,2800000,5000000],           eff:'ورودِ مشتری ۷٪ بیشتر' },
  { id:'adsl',      cat:'equip', name:'خط پرسرعت',       icon:'🚀', max:3, prices:[1500000,3500000,7000000],                  eff:'پیشرفتِ دانلود و گیم ۱۸٪ سریع‌تر' },
  { id:'printer',   cat:'equip', name:'چاپگر لیزری',     icon:'🖨', max:3, prices:[900000,2000000,4000000],                   eff:'چاپ ۲۵٪ سریع‌تر' },
  { id:'ups',       cat:'equip', name:'یو‌پی‌اس',        icon:'🔋', max:2, prices:[1200000,3000000],                          eff:'قطعیِ کوتاه‌تر' },
  { id:'antivirus', cat:'equip', name:'آنتی‌ویروس',      icon:'🛡', max:2, prices:[1000000,2400000],                          eff:'ویروسِ کوتاه‌تر، ری‌استارتِ سریع‌تر' },
  { id:'deco',      cat:'deco',  name:'دکور و نور',      icon:'🖼', max:3, prices:[800000,2000000,4500000],                   eff:'شهرت روزانه +۲ · عصبانی‌شدن کم‌ضررتر' },
  { id:'vip',       cat:'equip', name:'اتاق VIP',        icon:'👑', max:1, prices:[8000000],                                  eff:'مشتری‌های VIP: دوبرابرِ پول، حلقه‌ی طلایی' },
  { id:'tea2',      cat:'equip', name:'کتریِ دوم',       icon:'🫖', max:2, prices:[1500000,4000000],                          eff:'چای هم‌زمان برای ۲ مشتری' },
  { id:'staff',     cat:'staff', name:'کارمندِ خوش‌قدم',  icon:'🧍', max:2, prices:[2200000,5500000],                          eff:'چای و اسنک را خودش سرو می‌کند — دستِ تو آزاد می‌ماند' },
  { id:'hall',      cat:'equip', name:'سالن دومِ گیم',    icon:'🏛', max:2, prices:[15000000,40000000],                        eff:'اتاقِ گیمِ بزرگ باز می‌شود — ۳ میزِ تازه در هر سطح' },
  { id:'vipHall',   cat:'equip', name:'سالن VIP',        icon:'💎', max:1, prices:[45000000], req:6,                 eff:'۴ میزِ لوکس با تعرفه‌ی ×۱٫۴ در بالِ اختصاصی — گیمرِ حرفه‌ای و پولدارها عاشقش‌اند' },""")

rep("""  { id:'tech',      name:'تکنسین تعمیرات',   icon:'🔧', max:3, prices:[1500000,3200000,6000000],                  eff:'هر شب تجهیزات را سرویس می‌کند و خرابی را خودش درست می‌کند · حقوق هفتگی دارد' },
  { id:'clean',     name:'مسئول نظافت',      icon:'🧹', max:2, prices:[1200000,2800000],                          eff:'عصبانی‌شدن کمتر · شهرتِ روزانه بهتر · حقوق هفتگی دارد' },
  { id:'mgr',       name:'مدیر شیفت',        icon:'📋', max:2, prices:[2500000,5200000],                          eff:'درآمد کل +۴٪ در هر سطح · حقوق هفتگی دارد' },
  { id:'wall',      name:'رنگ دیوار',        icon:'🎨', max:2, prices:[900000,2400000],                           eff:'کافه را رنگِ تازه بزن — پالتِ فضا عوض می‌شود' },
  { id:'lamp2',     name:'نورپردازی گرم',    icon:'💡', max:1, prices:[1600000],                                  eff:'لامپ‌ها و نئون‌ها گرم و پخش‌تر می‌شوند' },
  { id:'plant2',    name:'باغِ کافه',        icon:'🪴', max:1, prices:[800000],                                   eff:'گیاهان تازه در هر دو سالن' },
  { id:'poster2',   name:'گالری پوستر',      icon:'🖼', max:1, prices:[700000],                                   eff:'پوسترهای تازه روی دیوار' },
];
/* حقوق هفتگی کارمندانِ تازه */
function staffWeekly(id, l){
  if(id === 'tech')  return [0, 200000, 450000, 800000][l] || 0;
  if(id === 'clean') return [0, 150000, 350000][l] || 0;
  if(id === 'mgr')   return [0, 300000, 650000][l] || 0;
  return 0;
}""",
"""  { id:'tech',      cat:'staff', name:'تکنسین تعمیرات',   icon:'🔧', max:3, prices:[1500000,3200000,6000000],                  eff:'هر شب تجهیزات را سرویس می‌کند و خرابی را خودش درست می‌کند · حقوق هفتگی دارد' },
  { id:'clean',     cat:'staff', name:'مسئول نظافت',      icon:'🧹', max:2, prices:[1200000,2800000],                          eff:'عصبانی‌شدن کمتر · شهرتِ روزانه بهتر · حقوق هفتگی دارد' },
  { id:'mgr',       cat:'staff', name:'مدیر شیفت',        icon:'📋', max:2, prices:[2500000,5200000],                          eff:'درآمد کل +۴٪ در هر سطح · حقوق هفتگی دارد' },
  { id:'net',       cat:'staff', name:'متخصص شبکه',       icon:'🌐', max:2, prices:[3000000,7000000],                          eff:'بودجه‌ی پهنای باند +۱۲ در هر سطح · قطعی و ویروس کوتاه‌تر · حقوق هفتگی دارد' },
  { id:'emgr',      cat:'staff', name:'مسئول مسابقات',    icon:'🏆', max:2, prices:[2500000,5500000],                          eff:'درآمدِ ثبت‌نامِ تورنمنت +۲۵٪ و شهرتِ مسابقه بیشتر · حقوق هفتگی دارد' },
  { id:'wall',      cat:'deco',  name:'رنگ دیوار',        icon:'🎨', max:2, prices:[900000,2400000],                           eff:'کافه را رنگِ تازه بزن — پالتِ فضا عوض می‌شود' },
  { id:'lamp2',     cat:'deco',  name:'نورپردازی گرم',    icon:'💡', max:1, prices:[1600000],                                  eff:'لامپ‌ها و نئون‌ها گرم و پخش‌تر می‌شوند' },
  { id:'plant2',    cat:'deco',  name:'باغِ کافه',        icon:'🪴', max:1, prices:[800000],                                   eff:'گیاهان تازه در هر دو سالن' },
  { id:'poster2',   cat:'deco',  name:'گالری پوستر',      icon:'🖼', max:1, prices:[700000],                                   eff:'پوسترهای تازه روی دیوار' },
];
/* حقوق هفتگی کارمندانِ تازه — با پاداشِ تجربه */
function staffWeekly(id, l){
  const xp = (Save.d.staffXp && Save.d.staffXp[id]) || 0;
  const bon = 1 + Math.min(0.2, xp * 0.005);
  const base =
    id === 'tech'  ? [0, 200000, 450000, 800000][l] :
    id === 'clean' ? [0, 150000, 350000][l] :
    id === 'mgr'   ? [0, 300000, 650000][l] :
    id === 'net'   ? [0, 400000, 900000][l] :
    id === 'emgr'  ? [0, 350000, 800000][l] : 0;
  return Math.round((base || 0) * bon / 10000) * 10000;
}""")

# ---------- ۴) میزِ تکی: deskOn / cafeCapacity ----------
rep("""/* ظرفیتِ واقعیِ کافه — تنها منبعِ حقیقت برای همه‌ی سیستم‌ها */
const MAX_SLOTS = 16;
function cafeCapacity(){ return Math.min(MAX_SLOTS, 4 + lvl('sys') + 3 * lvl('hall')); }""",
"""/* ظرفیتِ واقعیِ کافه — تنها منبعِ حقیقت برای همه‌ی سیستم‌ها
   فروشِ میز تکتکی است: با deskOff علامت می‌خورد، نه با کم‌کردنِ سطحِ سالن */
const MAX_SLOTS = 20;
function unlockedRange(){ return Math.min(MAX_SLOTS, 4 + lvl('sys') + 3 * lvl('hall') + 4 * lvl('vipHall')); }
function deskOn(i){
  if(i < 0 || i >= MAX_SLOTS) return false;
  if(Save.d.deskOff && Save.d.deskOff[i]) return false;
  return i < unlockedRange();
}
function offCount(){
  let n = 0; const o = Save.d.deskOff || {};
  for(const k in o) if(o[k] && +k >= 4 && +k < unlockedRange()) n++;
  return n;
}
function cafeCapacity(){ return unlockedRange() - offCount(); }
function eachActiveDesk(fn){
  for(let i = 0; i < MAX_SLOTS; i++){ if(deskOn(i)) fn(i); }
}""")

# ---------- ۵) اثرهای pcTier / net / emgr ----------
rep("""function payMul(){
  const ad = activeAd();
  return fameMul() * levelMul() * legacyMul() * (1 + 0.05 * (G.week - 1)) * (1 + 0.04 * lvl('mgr')) * (ad && ad.pay ? ad.pay : 1);
}""",
"""function payMul(){
  const ad = activeAd();
  return fameMul() * levelMul() * legacyMul() * (1 + 0.05 * (G.week - 1)) * (1 + 0.04 * lvl('mgr'))
    * (1 + 0.06 * lvl('pcTier')) * (ad && ad.pay ? ad.pay : 1);
}""")
rep("""function spawnMul(){
  const ad = activeAd();
  return Math.pow(0.93, lvl('neon')) * (ad && ad.spawn ? ad.spawn : 1) * (typeof rivalPressure === 'function' ? rivalPressure() : 1);
}""",
"""function spawnMul(){
  const ad = activeAd();
  return Math.pow(0.93, lvl('neon')) * (1 + 0.03 * lvl('pcTier')) * (ad && ad.spawn ? ad.spawn : 1)
    * (typeof rivalPressure === 'function' ? rivalPressure() : 1);
}""")
rep("""function budget(){ return 100 + 15 * lvl('router'); }""",
"""function budget(){ return 100 + 15 * lvl('router') + 12 * lvl('net'); }""")
rep("""function outageDur(){ return 9 - 2 * lvl('ups'); }
function virusDur(){ return 11 - 2 * lvl('antivirus'); }""",
"""function outageDur(){ return Math.max(3, (9 - 2 * lvl('ups')) * (1 - 0.25 * lvl('net'))); }
function virusDur(){ return Math.max(4, (11 - 2 * lvl('antivirus')) * (1 - 0.2 * lvl('net'))); }""")
rep("""function powerCost(){ return 40000 + 32000 * cafeCapacity(); }""",
"""function powerCost(){ return 40000 + 32000 * cafeCapacity() + 1500 * lvl('pcTier') * cafeCapacity(); }""")

# ---------- ۶) تبلیغاتِ تازه ----------
rep("""  { id:'event',   t:'کمپین مناسبتی',   d:'۳ روز · ورود ۳۵٪ بیشتر — گران و مؤثر',      cost: 3000000, days: 3, spawn: .65 },
];""",
"""  { id:'event',   t:'کمپین مناسبتی',   d:'۳ روز · ورود ۳۵٪ بیشتر — گران و مؤثر',      cost: 3000000, days: 3, spawn: .65 },
  { id:'streamer',t:'همکاری با استریمر', d:'۳ روز · ورود ۲۲٪ بیشتر + گیمرِ حرفه‌ای جذب می‌شود', cost: 2500000, days: 3, spawn: .78, kindBias: 'esports' },
  { id:'studisc', t:'تخفیف دانشجویی',  d:'۴ روز · دانشجوها و عجول‌ها بیشتر می‌آیند',   cost: 700000,  days: 4, spawn: .85, kindBias: 'student' },
];""")

# ---------- ۷) رقبا: وضعیتِ کامل ----------
rep("""const RIVALS = [
  { id:'r1', name:'کافه‌ی بغل',     eq: 2, speed: 1.0,  price: .9,  cust: '۲۲ نفر', power: 'کم' },
  { id:'r2', name:'گیم‌لندِ پارک',  eq: 4, speed: 1.15, price: 1.05, cust: '۳۰ نفر', power: 'متوسط' },
  { id:'r3', name:'نت‌پلاسِ مرکز',  eq: 6, speed: 1.3,  price: 1.2,  cust: '۴۸ نفر', power: 'زیاد' },
];
function rivalFame(id){ return (Save.d.rivalFame && Save.d.rivalFame[id]) || 40; }""",
"""const RIVALS = [
  { id:'r1', name:'کافه‌ی بغل',     eq: 2, speed: 1.0,  price: .9,  strat: 'value',   stratT: 'قیمت‌شکن' },
  { id:'r2', name:'گیم‌لندِ پارک',  eq: 4, speed: 1.15, price: 1.05, strat: 'premium', stratT: 'تجهیزِ سنگین' },
  { id:'r3', name:'نت‌پلاسِ مرکز',  eq: 6, speed: 1.3,  price: 1.2,  strat: 'growth',  stratT: 'تبلیغاتِ همه‌جانبه' },
];
function rivalState(id){
  if(Save.d.rivals && Save.d.rivals[id]) return Save.d.rivals[id];
  const base = RIVALS.find(r => r.id === id) || RIVALS[0];
  return { fame: 40, eq: base.eq, price: base.price, cash: 4000000, strat: base.strat, alive: true, ad: 0 };
}
function rivalFame(id){ const s = rivalState(id); return s ? s.fame : 40; }""")
rep("""function rivalAvgFame(){
  let s = 0; for(const r of RIVALS) s += rivalFame(r.id);
  return s / RIVALS.length;
}
function rivalPressure(){ return clamp(1 + (rivalAvgFame() - G.fame) / 400, 0.82, 1.28); }""",
"""function rivalAvgFame(){
  let s = 0, n = 0;
  for(const r of RIVALS){ const st = rivalState(r.id); if(st.alive){ s += st.fame; n++; } }
  return n ? s / n : 30;
}
function rivalPressure(){
  const alive = RIVALS.filter(r => rivalState(r.id).alive);
  let p = clamp(1 + (rivalAvgFame() - G.fame) / 400, 0.82, 1.28);
  const avgP = alive.length ? alive.reduce((a, r) => a + rivalState(r.id).price, 0) / alive.length : 1;
  p *= clamp(1 + (1 - avgP) * 0.35, 0.85, 1.2); // رقیبِ ارزان‌تر مشتری می‌برد
  const dead = RIVALS.length - alive.length;
  p *= Math.pow(0.94, dead); // رقیبِ تعطیل‌شده مشتری‌هایش را رها می‌کند
  return p;
}""")

# ---------- ۸) تورنمنت + اهداف بلندمدت + نظرات ----------
rep("""function cafeStars(){ return clamp(Math.round(G.fame / 20), 1, 5); }""",
"""/* ---------- تورنمنت‌های گیمینگ ---------- */
const TOURN = [
  { id:'t1', name:'تورنمنتِ محلی',   cost: 800000,  prize: 1200000,  fee: 80000,  cap: 6,  req: 2, fame: 5 },
  { id:'t2', name:'تورنمنتِ استانی', cost: 2500000, prize: 4500000,  fee: 150000, cap: 10, req: 4, fame: 10 },
  { id:'t3', name:'تورنمنتِ ملی',    cost: 8000000, prize: 15000000, fee: 300000, cap: 16, req: 6, fame: 20 },
];
function tourById(id){ return TOURN.find(t => t.id === id); }
function startTournament(id){
  const t = tourById(id);
  if(!t) return false;
  if(Save.d.tourPend){ toast('یک تورنمنت از قبل برنامه‌ریزی شده', 'pink'); return false; }
  if(G.level < t.req){ toast('برای این تورنمنت به سطح ' + faNum(t.req) + ' نیاز داری', 'pink'); return false; }
  if(G.money < t.cost){ toast('هزینه‌ی برگزاری ' + fmtK(t.cost) + ' است', 'pink'); return false; }
  G.money -= t.cost; G.dayStats.spent += t.cost;
  Save.d.tourPend = id;
  persist();
  toast('🏆 ' + t.name + ' برای فردا ثبت شد — جایزه ' + fmtK(t.prize), 'amber');
  Sfx.loan();
  return true;
}
/* ---------- اهدافِ بلندمدت ---------- */
const MISSIONS_LT = [
  { id:'lt_pc2',    t:'کیفیتِ سیستم‌ها را به سطحِ گیمینگ برسان', chk: () => lvl('pcTier') >= 2, r: 2000000, icon:'🎮' },
  { id:'lt_tour1',  t:'اولین تورنمنت را برگزار کن',              chk: () => (G.runStats.tourneys || 0) >= 1, r: 1500000, icon:'🏆' },
  { id:'lt_staff4', t:'چهار کارمندِ تازه استخدام کن',             chk: () => lvl('tech') + lvl('clean') + lvl('mgr') + lvl('net') + lvl('emgr') >= 4, r: 2000000, icon:'🧍' },
  { id:'lt_fame90', t:'به شهرتِ ۹۰ درصدی برس',                   chk: () => G.fame >= 90, r: 3000000, icon:'⭐' },
  { id:'lt_vip',    t:'سالن VIP را افتتاح کن',                   chk: () => lvl('vipHall') >= 1, r: 5000000, icon:'👑' },
  { id:'lt_pc5',    t:'تجهیزات را فوق‌حرفه‌ای کن',                chk: () => lvl('pcTier') >= 5, r: 4000000, icon:'💎' },
];
function checkLT(){
  for(const m of MISSIONS_LT){
    if(Save.d.ltDone.includes(m.id)) continue;
    let ok = false;
    try{ ok = m.chk(); }catch(e){}
    if(ok){
      G.money += m.r; G.dayStats.earned += m.r;
      gainXP(80);
      Save.d.ltDone.push(m.id);
      toast('🎯 هدفِ بلندمدت: ' + m.t + ' — ' + fmtK(m.r), 'amber');
      Sfx.mission();
    }
  }
}
/* ---------- نظراتِ مشتریان ---------- */
const REVIEW_TXT = {
  5: ['بهترین کافه‌نتِ شهر! همین‌جا فیکس می‌شوم.', 'سرعت و چایی‌اش افسانه‌ای بود.', 'کافه‌ی رویایی — به همه معرفی‌اش می‌کنم.'],
  4: ['خوب بود، دوباره می‌آیم.', 'اینترنتش عالی بود، کمی شلوغ.', 'میان‌برِ روزهایم شد.'],
  3: ['قابلِ قبول بود.', 'نه بد نه عالی.', 'وسطِ راه گیر آوردم این‌جا.'],
  2: ['کمی کند بود امشب.', 'انتظارِ بیشتری داشتم.', 'قیمتش به آن کیفیت نمی‌ارزد.'],
  1: ['حیفِ وقت و پول! دیگر نمی‌آیم.', 'همه‌چیز کند و گران بود.', 'اصلاً راضی نبودم.'],
};
function addReview(stars, kindId){
  const s = clamp(Math.round(stars), 1, 5);
  Save.d.reviews.unshift({ s, k: kindId, w: G.week, txt: pick(REVIEW_TXT[s]) });
  if(Save.d.reviews.length > 12) Save.d.reviews.pop();
}
function reviewAvg(){
  if(!Save.d.reviews.length) return 0;
  return Save.d.reviews.reduce((a, r) => a + r.s, 0) / Save.d.reviews.length;
}
/* ---------- ارزشِ تجهیزات ---------- */
function equipValue(){
  let v = 0;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const h = sysHp(i) / 100;
    if(i >= 16) v += 11250000 * h;
    else if(i >= 10){ const hl = lvl('hall'); if(hl >= 1) v += (hl >= 2 ? 13300000 : 5000000) * h; }
    else { const t = lvl('sys'); if(t >= 1) v += [1100000,2200000,3800000,6000000,9000000,13000000][t-1] * h; }
  }
  return Math.round(v);
}
/* مرحله‌ی بصریِ کافه — ۰ قدیمی تا ۴ لوکس */
function envStage(){
  let s = 0;
  if(G.level >= 3 || lvl('deco') >= 1) s = 1;
  if(lvl('pcTier') >= 2 || lvl('hall') >= 1) s = Math.max(s, 2);
  if(lvl('pcTier') >= 4 || lvl('hall') >= 2) s = Math.max(s, 3);
  if(lvl('vipHall') >= 1 || Save.d.crowned) s = 4;
  return s;
}
function cafeStars(){ return clamp(Math.round(G.fame / 20), 1, 5); }""")

io.open('p2_core.js', 'w', encoding='utf-8').write(p)
print('patch7 core OK')
