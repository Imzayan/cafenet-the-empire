# -*- coding: utf-8 -*-
# پچ ۱ — هسته: Save v3 + مشتری‌های تازه + اقتصاد/بانک/رقبا/تبلیغات/کارمندان/دکور + موسیقی
import io
p = io.open('p2_core.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:70]
    p = p.replace(old, new, n)

# ---------- ۱) نسخه‌ی ذخیره v3 + فیلدهای تازه ----------
rep("const SAVE_KEY = 'cafnet_full_v2';\nconst SAVE_VERSION = 2;",
    "const SAVE_KEY = 'cafnet_full_v2';\nconst SAVE_VERSION = 3;")

rep("""      stats: { served: 0, angry: 0, teas: 0, snacks: 0, bribes: 0, fines: 0, maxCombo: 0, bestDay: 0, bestStreak: 0, weeksPaid: 0, weeks: 0, lans: 0, catPats: 0, revenue: 0 },
    };""",
"""      stats: { served: 0, angry: 0, teas: 0, snacks: 0, bribes: 0, fines: 0, maxCombo: 0, bestDay: 0, bestStreak: 0, weeksPaid: 0, weeks: 0, lans: 0, catPats: 0, revenue: 0, regulars: 0, teaRev: 0, printRev: 0, netPaid: 0, powerPaid: 0, salariesPaid: 0, rentTotal: 0, repairPaid: 0, interestPaid: 0, materialsPaid: 0, loansTaken: 0 },
      bank: { debt: 0, apr: 0.09, parts: 0, partsLeft: 0, loanId: null, late: 0 },
      rivalFame: { r1: 34, r2: 52, r3: 74 },
      ads: null,                 // تبلیغ فعال {id, left}
      staff2: { tech: 0, clean: 0, mgr: 0 },
      dec: { wall: 0, lamp: 0, plant: 0 },
      hp: null,                  // آرایه‌ی ۱۶ سلامتِ تجهیزات
      loyal: { good: 0, bad: 0 },
      missionsW: [], mWDone: [], // ماموریت هفتگی جاری/تمام‌شده
      weekHist: [],              // سود خالصِ هفته‌ها
      music: true, volS: 0.8, volM: 0.5,
    };""")

# ادغامِ فیلدهای تازه در load (سازگار با ذخیره‌ی قدیمی v2)
rep("""      if(p.stats) Object.assign(this.d.stats, p.stats);
      } else this.d = this.defaults();""",
"""      if(p.stats) Object.assign(this.d.stats, p.stats);
        if(p.bank) Object.assign(this.d.bank, p.bank);
        if(p.rivalFame) Object.assign(this.d.rivalFame, p.rivalFame);
        if(p.staff2) Object.assign(this.d.staff2, p.staff2);
        if(p.dec) Object.assign(this.d.dec, p.dec);
        if(p.loyal) Object.assign(this.d.loyal, p.loyal);
        if(Array.isArray(p.missionsW)) this.d.missionsW = p.missionsW.slice(0,1);
        if(Array.isArray(p.mWDone)) this.d.mWDone = p.mWDone.slice(-12);
        if(Array.isArray(p.weekHist)) this.d.weekHist = p.weekHist.slice(-10);
        if(Array.isArray(p.hp)) this.d.hp = p.hp.slice(0,16).map(x => clamp(+x || 0, 0, 100));
        if(p.ads && p.ads.id && p.ads.left > 0) this.d.ads = { id: String(p.ads.id), left: Math.floor(p.ads.left) };
        if('music' in p) this.d.music = !!p.music;
        if('volS' in p) this.d.volS = clamp(+p.volS || 0.8, 0, 1);
        if('volM' in p) this.d.volM = clamp(+p.volM || 0.5, 0, 1);
        this.d.saveVersion = SAVE_VERSION;
      } else if(p && p.saveVersion === 2){
        // مهاجرتِ نسخه‌ی ۲ → ۳ با همین ادغام
        this.d = this.defaults();
        for(const k of ['week','day','money','fame','xp','legacy','sound','seenHow','coins','skin','turbo','crowned']) if(k in p) this.d[k] = p[k];
        if(p.up) Object.assign(this.d.up, p.up);
        if(Array.isArray(p.ach)) this.d.ach = p.ach.filter(x => typeof x === 'string');
        if(Array.isArray(p.missions)) this.d.missions = p.missions.slice(0,3);
        if(Array.isArray(p.mDone)) this.d.mDone = p.mDone.slice(-10);
        if(Array.isArray(p.powned)) this.d.powned = p.powned.filter(x => typeof x === 'string');
        if(p.stats) Object.assign(this.d.stats, p.stats);
        this.d.saveVersion = SAVE_VERSION;
      } else this.d = this.defaults();""")

rep("""  save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); }catch(e){} },
  wipe(){ this.d = this.defaults(); this.save(); }""",
"""  save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); }catch(e){} },
  wipe(){ this.d = this.defaults(); this.save(); },
};""")

# clamp قبل از Save استفاده می‌شود — در همین فایل بالا تعریفش را جلو ببر
rep("""const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));""",
"""const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
window.__clampGuard = 1;""")

# ---------- ۲) صدا: موسیقی پس‌زمینه + ولوم جداگانه ----------
rep("""  init(){ if(this.ctx) return; try{ const A = window.AudioContext || window.webkitAudioContext; if(A) this.ctx = new A(); }catch(e){} },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }catch(e){} },
  tone(f, dur, type, vol, delay, slide){
    if(!Save.d.sound || !this.ctx) return;
    try{
      const t0 = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.03);
    }catch(e){}
  },""",
"""  ctx: null, sfxG: null, musG: null, musT: null, musI: 0,
  init(){
    if(this.ctx) return;
    try{
      const A = window.AudioContext || window.webkitAudioContext;
      if(!A) return;
      this.ctx = new A();
      this.sfxG = this.ctx.createGain(); this.sfxG.gain.value = Save.d.volS !== undefined ? Save.d.volS : 0.8;
      this.musG = this.ctx.createGain(); this.musG.gain.value = Save.d.volM !== undefined ? Save.d.volM * 0.55 : 0.28;
      this.sfxG.connect(this.ctx.destination); this.musG.connect(this.ctx.destination);
    }catch(e){}
  },
  resume(){
    try{
      if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.startMusic();
    }catch(e){}
  },
  setVolS(v){ Save.d.volS = clamp(v, 0, 1); if(this.sfxG) this.sfxG.gain.value = Save.d.volS; Save.save(); },
  setVolM(v){ Save.d.volM = clamp(v, 0, 1); if(this.musG) this.musG.gain.value = Save.d.volM * 0.55; Save.save(); },
  startMusic(){
    if(!this.ctx || this.musT || !Save.d.music || !Save.d.sound) return;
    const CHORDS = [
      [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9],
    ];
    this.musI = 0;
    const step = () => {
      if(!Save.d.music || !Save.d.sound){ this.stopMusic(); return; }
      try{
        const t0 = this.ctx.currentTime;
        const ch = CHORDS[this.musI % CHORDS.length]; this.musI++;
        for(let i = 0; i < 3; i++){
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(ch[i], t0);
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(0.016, t0 + 1.1);
          g.gain.linearRampToValueAtTime(0, t0 + 4.4);
          o.connect(g); g.connect(this.musG);
          o.start(t0); o.stop(t0 + 4.5);
        }
        const arp = ch[(this.musI * 7) % 3] * 2;
        const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
        o2.type = 'triangle'; o2.frequency.setValueAtTime(arp, t0 + 1.9);
        g2.gain.setValueAtTime(0, t0 + 1.9);
        g2.gain.linearRampToValueAtTime(0.008, t0 + 2.1);
        g2.gain.linearRampToValueAtTime(0, t0 + 3.3);
        o2.connect(g2); g2.connect(this.musG);
        o2.start(t0 + 1.9); o2.stop(t0 + 3.4);
      }catch(e){}
    };
    step();
    this.musT = setInterval(step, 4500);
  },
  stopMusic(){ if(this.musT){ clearInterval(this.musT); this.musT = null; } },
  tone(f, dur, type, vol, delay, slide){
    if(!Save.d.sound || !this.ctx) return;
    try{
      const t0 = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g); g.connect(this.sfxG || this.ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.03);
    }catch(e){}
  },""")

rep("""  sponsor(){ this.tone(700, .1, 'triangle', .06); this.tone(1050, .12, 'triangle', .06, .1); },
};""",
"""  sponsor(){ this.tone(700, .1, 'triangle', .06); this.tone(1050, .12, 'triangle', .06, .1); },
  type(){ this.tone(rnd(2400, 3400), .015, 'square', .012); },
  mouse(){ this.tone(1900, .02, 'square', .014); },
  print(){ this.tone(310, .05, 'sawtooth', .02); },
  error(){ this.tone(210, .16, 'sawtooth', .06, 0, 120); },
  happy(){ this.tone(784, .07, 'sine', .05); this.tone(988, .09, 'sine', .05, .07); },
  warn(){ this.tone(330, .14, 'square', .05); this.tone(262, .18, 'square', .05, .16); },
  coin(){ this.tone(1567, .05, 'sine', .04); },
  loan(){ this.tone(392, .12, 'triangle', .06); this.tone(523, .14, 'triangle', .06, .1); this.tone(659, .18, 'triangle', .05, .2); },
};""")

# ---------- ۳) ثابت‌ها: KINDS تازه ----------
rep("""const KINDS = {
  dl:    { pay: 44000, needMin: 28, needMax: 38, dur: 13, patMin: 20, patMax: 24, color: [76,255,158], w: 30 },
  game:  { pay: 34000, needMin: 14, needMax: 20, dur: 10, patMin: 13, patMax: 16, color: [255,95,162], w: 24 },
  chat:  { pay: 18000, needMin: 5,  needMax: 5,  dur: 8,  patMin: 24, patMax: 28, color: [89,194,255], w: 22 },
  print: { pay: 27000, needMin: 0,  needMax: 0,  dur: 14, patMin: 20, patMax: 24, color: [242,193,78], w: 16 },
};
const KIND_KEYS = ['dl','game','chat','print'];""",
"""const KINDS = {
  dl:      { pay: 44000, needMin: 28, needMax: 38, dur: 13, patMin: 20, patMax: 24, color: [76,255,158], w: 22, icon:'dl',     vis:'dl' },
  game:    { pay: 34000, needMin: 14, needMax: 20, dur: 10, patMin: 13, patMax: 16, color: [255,95,162], w: 18, icon:'game',   vis:'game' },
  chat:    { pay: 18000, needMin: 5,  needMax: 5,  dur: 8,  patMin: 24, patMax: 28, color: [89,194,255], w: 16, icon:'chat',   vis:'chat' },
  print:   { pay: 27000, needMin: 0,  needMax: 0,  dur: 14, patMin: 20, patMax: 24, color: [242,193,78], w: 12, icon:'print',  vis:'print' },
  student: { pay: 26000, needMin: 8,  needMax: 14, dur: 20, patMin: 26, patMax: 34, color: [171,222,255], w: 10, icon:'chat',  vis:'chat', printChance: .3, t:'دانشجو' },
  hurry:   { pay: 30000, needMin: 5,  needMax: 9,  dur: 6,  patMin: 7,  patMax: 10, color: [255,170,90], w: 8,  icon:'dl',    vis:'dl',  fastBonus: 60000, t:'عجول' },
  poor:    { pay: 14000, needMin: 4,  needMax: 6,  dur: 9,  patMin: 30, patMax: 40, color: [148,168,188], w: 8,  icon:'chat',  vis:'chat', payMulC: .55, t:'کم‌درآمد' },
  grumpy:  { pay: 36000, needMin: 10, needMax: 16, dur: 10, patMin: 10, patMax: 13, color: [214,106,106], w: 6,  icon:'game',  vis:'game', drainMul: 1.35, angryFame: 12, t:'بدقلق' },
  rich:    { pay: 80000, needMin: 12, needMax: 18, dur: 11, patMin: 18, patMax: 24, color: [255,227,140], w: 5,  icon:'game',  vis:'game', payMulC: 1.8, tipMul: 1.6, t:'پولدار' },
  trouble: { pay: 24000, needMin: 6,  needMax: 10, dur: 9,  patMin: 16, patMax: 22, color: [188,130,220], w: 4,  icon:'dl',    vis:'dl',  virusChance: .35, t:'دردسرساز' },
  esports: { pay: 110000, needMin: 40, needMax: 58, dur: 16, patMin: 26, patMax: 34, color: [120,255,200], w: 3, icon:'game', vis:'game', fameOn: 4, t:'گیمر حرفه‌ای' },
};
const KIND_KEYS = ['dl','game','chat','print','student','hurry','poor','grumpy','rich','trouble','esports'];""")

# ---------- ۴) ارتقاهای تازه: کارمندان + دکور ----------
rep("""  { id:'hall',      name:'سالن دومِ گیم',    icon:'🏛', max:2, prices:[15000000,40000000],                        eff:'اتاقِ گیمِ بزرگ باز می‌شود — ۳ میزِ تازه در هر سطح' },
];""",
"""  { id:'hall',      name:'سالن دومِ گیم',    icon:'🏛', max:2, prices:[15000000,40000000],                        eff:'اتاقِ گیمِ بزرگ باز می‌شود — ۳ میزِ تازه در هر سطح' },
  { id:'tech',      name:'تکنسین تعمیرات',   icon:'🔧', max:3, prices:[1500000,3200000,6000000],                  eff:'هر شب تجهیزات را سرویس می‌کند و خرابی را خودش درست می‌کند · حقوق هفتگی دارد' },
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
}""")

# ---------- ۵) بانک / تبلیغات / رقبا / ظرفیت مرکزی / اجاره‌ی متعادل ----------
rep("""function rentFor(w){ return Math.round(2000000 * Math.pow(1.45, w - 1) / 10000) * 10000; }""",
"""/* ظرفیتِ واقعیِ کافه — تنها منبعِ حقیقت برای همه‌ی سیستم‌ها */
const MAX_SLOTS = 16;
function cafeCapacity(){ return Math.min(MAX_SLOTS, 4 + lvl('sys') + 3 * lvl('hall')); }
/* اجاره‌ی متعادل: رشدِ آرام + خطی — هفته‌ی اول سبک، هفته‌های بالا چالشِ منصفانه */
function rentFor(w){
  const v = 1800000 + 500000 * (w - 1) + 350000 * Math.pow(Math.max(0, w - 1), 1.12);
  return Math.round(v / 10000) * 10000;
}
/* ---------- بانک ---------- */
const LOANS = [
  { id:'l1', name:'وامِ کوچک',   amt: 2000000,  n: 4, rate: 0.08, req: 0 },
  { id:'l2', name:'وامِ توسعه',  amt: 6000000,  n: 6, rate: 0.10, req: 3 },
  { id:'l3', name:'وامِ بزرگ',   amt: 15000000, n: 8, rate: 0.12, req: 5 },
];
function loanById(id){ return LOANS.find(l => l.id === id); }
function installmentOf(ln){ return Math.round(ln.amt * (1 + ln.rate) / ln.n / 10000) * 10000; }
/* ---------- تبلیغات ---------- */
const ADS = [
  { id:'flyer',   t:'آگهی محله‌ای',    d:'۳ روز · ورودِ مشتری ۱۵٪ بیشتر',            cost: 400000,  days: 3, spawn: .85 },
  { id:'online',  t:'تبلیغ اینترنتی',  d:'۴ روز · ورود ۲۸٪ بیشتر + شهرتِ روزانه',    cost: 1200000, days: 4, spawn: .72, fame: 1 },
  { id:'discount',t:'تخفیف افتتاحیه',  d:'۲ روز · ورود ۲۰٪ بیشتر، پول ۱۰٪ کمتر',     cost: 800000,  days: 2, spawn: .80, pay: .9 },
  { id:'subcard', t:'کارت اشتراک',     d:'۶ روز · مشتریِ وفادار بیشتر می‌آید',        cost: 2000000, days: 6, loyal: .18 },
  { id:'event',   t:'کمپین مناسبتی',   d:'۳ روز · ورود ۳۵٪ بیشتر — گران و مؤثر',      cost: 3000000, days: 3, spawn: .65 },
];
function activeAd(){ return (Save.d.ads && ADS.find(a => a.id === Save.d.ads.id)) || null; }
/* ---------- رقبای محله ---------- */
const RIVALS = [
  { id:'r1', name:'کافه‌ی بغل',     eq: 2, speed: 1.0,  price: .9,  cust: '۲۲ نفر', power: 'کم' },
  { id:'r2', name:'گیم‌لندِ پارک',  eq: 4, speed: 1.15, price: 1.05, cust: '۳۰ نفر', power: 'متوسط' },
  { id:'r3', name:'نت‌پلاسِ مرکز',  eq: 6, speed: 1.3,  price: 1.2,  cust: '۴۸ نفر', power: 'زیاد' },
];
function rivalFame(id){ return (Save.d.rivalFame && Save.d.rivalFame[id]) || 40; }
function rivalAvgFame(){
  let s = 0; for(const r of RIVALS) s += rivalFame(r.id);
  return s / RIVALS.length;
}
function rivalPressure(){ return clamp(1 + (rivalAvgFame() - G.fame) / 400, 0.82, 1.28); }
function beatRival(id){ return G.fame > rivalFame(id); }""")

# ---------- ۶) مشتق‌های تازه‌وار ----------
rep("""function spawnMul(){ return Math.pow(0.93, lvl('neon')); }""",
"""function spawnMul(){
  const ad = activeAd();
  return Math.pow(0.93, lvl('neon')) * (ad && ad.spawn ? ad.spawn : 1) * (typeof rivalPressure === 'function' ? rivalPressure() : 1);
}""")
rep("""function payMul(){ return fameMul() * levelMul() * legacyMul() * (1 + 0.05 * (G.week - 1)); }""",
"""function payMul(){
  const ad = activeAd();
  return fameMul() * levelMul() * legacyMul() * (1 + 0.05 * (G.week - 1)) * (1 + 0.04 * lvl('mgr')) * (ad && ad.pay ? ad.pay : 1);
}""")
rep("""function powerCost(){ return 40000 + 32000 * G.slots; }""",
"""function powerCost(){ return 40000 + 32000 * cafeCapacity(); }
function internetCost(){ return 80000 + 15000 * lvl('router'); }
function materialsCost(){ return (G.weekMat || 0); }
function satisfactionPct(){ return clamp(Math.round(38 + G.fame * 0.62), 0, 100); }
function sysHp(i){ const a = Save.d.hp; return (a && a[i] !== undefined) ? a[i] : 100; }
function hpMul(i){ const h = sysHp(i); return h >= 70 ? 1 : h >= 40 ? 0.85 : 0.62; }
function repairCost(i){ return Math.round((50000 + (100 - sysHp(i)) * 4200) / 5000) * 5000; }
function loyalChance(){
  const ad = activeAd();
  return Math.min(0.35, 0.06 + (Save.d.loyal.good || 0) / 400 + (ad && ad.loyal ? ad.loyal : 0) + 0.02 * G.level);
}""")

# ---------- ۷) ماموریت‌های تازه ----------
rep("""  { id:'vip1',   t:'یک VIP راضی کن',           k:'vipServed',    goal:1, r:200000, icon:'👑', req:'vip' },
];""",
"""  { id:'vip1',   t:'یک VIP راضی کن',           k:'vipServed',    goal:1, r:200000, icon:'👑', req:'vip' },
  { id:'earn6',  t:'۶۰۰ هزار درآمد در یک روز', k:'earnedGoal',   goal:1, r:160000, icon:'💰', daily:true },
  { id:'serve15',t:'۱۵ مشتری راضی در یک روز',  k:'served',       goal:15, r:260000, icon:'😊', daily:true },
];
/* ماموریت‌های هفتگی — هنگامِ پرداختِ اجاره داوری می‌شوند */
const MISSIONS_W = [
  { id:'wkEarn',  t:'درآمدِ هفته از ۸ میلیون گذشت',  k:'weekEarn',  goal: 8000000,  r: 900000,  icon:'📈' },
  { id:'wkHappy', t:'رضایتِ هفته بالای ۸۰٪',          k:'weekSat',   goal: 80,       r: 700000,  icon:'😊' },
  { id:'wkRival', t:'شهرتت از «گیم‌لندِ پارک» گذشت',  k:'weekRival', goal: 1,        r: 1200000, icon:'⚔', comp: 'r2' },
  { id:'wkHire',  t:'دو کارمندِ تازه استخدام کن',     k:'weekStaff', goal: 2,        r: 800000,  icon:'🧍' },
  { id:'wkServed',t:'۴۰ مشتریِ راضی در هفته',         k:'weekServed',goal: 40,       r: 1000000, icon:'🧑‍💻' },
];""")

# ---------- ۸) دستاورد تازه ----------
rep("""  { id:'crown',    t:'تاجِ کافه‌نت',              need: () => lvl('sys') >= 6 && lvl('router') >= 5, fame:20 },
];""",
"""  { id:'crown',    t:'تاجِ کافه‌نت',              need: () => lvl('sys') >= 6 && lvl('router') >= 5, fame:20 },
  { id:'boss',     t:'شکستِ گیم‌لندِ پارک',        need: () => typeof beatRival === 'function' && beatRival('r2'), fame:12 },
  { id:'rich1',    t:'اولین مشتریِ پولدار',        need: s => s.regulars >= 1 || (typeof G !== 'undefined' && G.richServed), fame:6 },
];""")

io.open('p2_core.js', 'w', encoding='utf-8').write(p)
print('patch1 core OK')
