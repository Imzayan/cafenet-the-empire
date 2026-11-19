<script>
'use strict';
/* ============================================================
   کافه‌نت — هسته: ابزارها · ذخیره · صدا · داده‌ها · وضعیت
   ============================================================ */

/* ================= ابزارها ================= */
const $ = id => document.getElementById(id);
const FA = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
function faNum(n){
  if(n === undefined || n === null || isNaN(n)) return '۰';
  const neg = n < 0; const s = Math.round(Math.abs(n)).toString();
  let out = '';
  for(let i = s.length - 1; i >= 0; i--) out = FA[+s[i]] + out;
  return (neg ? '−' : '') + out;
}
function faF1(v){
  const s = v.toFixed(1).split('.');
  return faNum(+s[0]) + '٫' + FA[+s[1]];
}
function fmtK(n){
  if(n >= 1e6){ const v = Math.round(n / 1e5) / 10; return faF1(v).replace('٫۰','') + 'M'; }
  return faNum(Math.round(n / 1e3)) + 'K';
}
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
window.__clampGuard = 1;
const lerp = (a,b,t) => a + (b-a)*t;
const rnd = (a,b) => a + Math.random()*(b-a);
const rndi = (a,b) => Math.floor(rnd(a,b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const round5 = v => Math.round(v / 5) * 5;
function mix(c1, c2, t){ return [0,1,2].map(i => Math.round(lerp(c1[i], c2[i], t))); }
const rgb = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
function vibrate(ms){ try{ if(Save.d.sound && navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

/* ================= ذخیره (نسخه‌دار) ================= */
const SAVE_KEY = 'cafnet_full_v2';
const SAVE_BAK = 'cafnet_full_v2_bak';
const SAVE_VERSION = 3;
let _saveN = 0;
const Save = {
  d: null,
  defaults(){
    return {
      saveVersion: SAVE_VERSION, week: 1, day: 1, money: 0, fame: 40, xp: 0,
      legacy: 0,              // میراثِ انباشته: 0.06 × هفته‌های پرداخت‌شده
      up: {},                 // ارتقاها: {id: level}
      ach: [],                // دستاورد باز‌شده
      missions: ['dl3', 'tea4', 'combo3'],
      mDone: [],              // ماموریت‌های تازگیِ کامل‌شده (برای چرخش)
      sound: true, seenHow: false,
      coins: 0, skin: 'classic', turbo: false, powned: [], crowned: false,
      stats: { served: 0, angry: 0, teas: 0, snacks: 0, bribes: 0, fines: 0, maxCombo: 0, bestDay: 0, bestStreak: 0, weeksPaid: 0, weeks: 0, lans: 0, catPats: 0, revenue: 0, regulars: 0, teaRev: 0, printRev: 0, netPaid: 0, powerPaid: 0, salariesPaid: 0, rentTotal: 0, repairPaid: 0, interestPaid: 0, materialsPaid: 0, loansTaken: 0 },
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
      deskOff: {},               // میزهای فروخته‌شده — فروشِ تکتکی
      rivals: null,              // وضعیتِ کاملِ رقبا
      staffXp: { tech: 0, clean: 0, mgr: 0, net: 0, emgr: 0 },
      reviews: [],               // نظراتِ مشتریان
      supplier: false,           // تخفیفِ تأمین‌کننده — خریدِ بعدی ۲۰٪
      powerSpike: false,         // برقِ گرانِ امروز
      tourPend: null,            // تورنمنتِ فردا
      ltDone: [], seenTut: false,
      story: { ch: 0, seen: [], flags: {}, ally: { rival: 0 } }, // فازِ ۳ — روایت
      crew: [],                                                  // فازِ ۳ — تیمِ فردی
      parts: null,               // فازِ ۳-ب — {cpu,gpu,ram,mon} برای هر میز
      pass: null,                // فازِ ۴ — بتل‌پسِ فصلی {season,xp,tier,claimed}
      branch: null,              // فازِ ۳-ب — شعبه‌ی دوم {owned,lvl,mgr,last}
    };
  },
  load(){
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
      const legacyV12 = p && typeof p === 'object' && (p.saveVersion === 2 || (!p.saveVersion && ('money' in p || 'up' in p || 'rivalFame' in p)));
      if(p && (p.saveVersion === SAVE_VERSION || legacyV12)){
        // مهاجرتِ v1/v2 → ۳ با همین ادغامِ کامل و امن
        this.d = this.defaults();
        // ادغامِ امنِ یک‌سطحی + تو در تو
        for(const k of ['week','day','money','fame','xp','legacy','sound','seenHow','coins','skin','turbo','crowned']) if(k in p) this.d[k] = p[k];
        if('_level' in p) this.d._level = Math.max(1, Math.min(10, +p._level || 1)); // سطحِ بازیکن بعد از «ادامه» ریست نشود
        if(p.up) Object.assign(this.d.up, p.up);
        if(Array.isArray(p.ach)) this.d.ach = p.ach.filter(x => typeof x === 'string');
        if(Array.isArray(p.missions)) this.d.missions = p.missions.slice(0,3);
        if(Array.isArray(p.mDone)) this.d.mDone = p.mDone.slice(-10);
        if(Array.isArray(p.powned)) this.d.powned = p.powned.filter(x => typeof x === 'string');
        if(p.stats) Object.assign(this.d.stats, p.stats);
        if(p.bank) Object.assign(this.d.bank, p.bank);
        if(p.rivalFame) Object.assign(this.d.rivalFame, p.rivalFame);
        if(p.staff2) Object.assign(this.d.staff2, p.staff2);
        if(p.story && typeof p.story === 'object'){
          this.d.story = {
            ch: clamp(Math.floor(+p.story.ch || 0), 0, 10),
            seen: Array.isArray(p.story.seen) ? p.story.seen.filter(s => s && typeof s === 'object' && typeof s.i === 'number').slice(0, 12) : [],
            flags: (p.story.flags && typeof p.story.flags === 'object') ? p.story.flags : {},
            ally: { rival: clamp(Math.floor((p.story.ally && +p.story.ally.rival) || 0), -3, 3) },
          };
        }
        if(Array.isArray(p.crew)) this.d.crew = p.crew.filter(c => c && typeof c.role === 'string' && typeof c.name === 'string').slice(0, 6);
        if(Array.isArray(p.parts) && p.parts.length === MAX_SLOTS) this.d.parts = p.parts.map(o => o && typeof o === 'object' ? { cpu: clamp(+o.cpu || 1, 1, 5), gpu: clamp(+o.gpu || 1, 1, 5), ram: clamp(+o.ram || 1, 1, 5), mon: clamp(+o.mon || 1, 1, 5) } : { cpu: 1, gpu: 1, ram: 1, mon: 1 });
        if(p.branch && typeof p.branch === 'object') this.d.branch = { owned: !!p.branch.owned, lvl: clamp(Math.floor(+p.branch.lvl || 0), 0, 3), mgr: typeof p.branch.mgr === 'string' ? p.branch.mgr : null, last: Math.max(0, +p.branch.last || 0) };
        if(p.pass && typeof p.pass === 'object') this.d.pass = { season: clamp(Math.floor(+p.pass.season) || 1, 1, 999), xp: Math.max(0, Math.floor(+p.pass.xp) || 0), tier: clamp(Math.floor(+p.pass.tier) || 0, 0, 20), claimed: Array.isArray(p.pass.claimed) ? p.pass.claimed.filter(n => n >= 1 && n <= 20).slice(0, 20) : [], prem: !!p.pass.prem };
        if(p.dec) Object.assign(this.d.dec, p.dec);
        if(p.loyal) Object.assign(this.d.loyal, p.loyal);
        if(Array.isArray(p.missionsW)) this.d.missionsW = p.missionsW.slice(0,1);
        if(Array.isArray(p.mWDone)) this.d.mWDone = p.mWDone.slice(-12);
        if(Array.isArray(p.weekHist)) this.d.weekHist = p.weekHist.slice(-10);
        if(Array.isArray(p.hp)) this.d.hp = p.hp.slice(0, MAX_SLOTS).map(x => clamp(+x || 0, 0, 100)); // ۲۰ میز — قبلاً ۱۷..۱۹ ریست می‌شدند
        if(p.ads && p.ads.id && p.ads.left > 0) this.d.ads = { id: String(p.ads.id), left: Math.floor(p.ads.left) };
        if('music' in p) this.d.music = !!p.music;
        // مقدارِ صفرِ صدا باید صفر بماند — نه جایگزین با پیش‌فرض
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
        this.d.saveVersion = SAVE_VERSION;
      } else this.d = this.defaults();
    }catch(e){ this.d = this.defaults(); }
  },
  save(){
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.d));
      _saveN++;
      if(_saveN % 8 === 0) localStorage.setItem(SAVE_BAK, JSON.stringify(this.d));
    }catch(e){}
  },
  wipe(){ this.d = this.defaults(); this.save(); },
};
Save.d = Save.defaults(); // قبل از هر استفاده‌ی ماژولی

/* ================= صدا (WebAudio، بدون فایل) ================= */
const Sfx = {
  ctx: null, sfxG: null, musG: null, musT: null, musI: 0,
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
  },
  arrive(){ this.tone(640, .06, 'sine', .045); },
  tickS(){ this.tone(1180, .02, 'square', .02); },
  pay(){ this.tone(880, .08, 'triangle', .07); this.tone(1318, .1, 'triangle', .06, .06); },
  combo(n){ this.tone(900 + n*130, .09, 'triangle', .06); },
  angry(){ this.tone(150, .3, 'sawtooth', .08, 0, 70); },
  alarm(){ this.tone(560, .1, 'square', .055); this.tone(430, .12, 'square', .055, .14); },
  quest(){ this.tone(220, .3, 'sine', .05); this.tone(330, .3, 'sine', .04, .12); },
  mission(){ this.tone(659, .09, 'triangle', .07); this.tone(880, .1, 'triangle', .07, .09); this.tone(1046, .12, 'triangle', .06, .18); },
  tea(){ this.tone(520, .1, 'sine', .05); this.tone(780, .08, 'sine', .04, .08); },
  boot(){ this.tone(340, .1, 'square', .045); this.tone(510, .1, 'square', .045, .09); },
  buy(){ this.tone(660, .07, 'triangle', .07); this.tone(990, .1, 'triangle', .07, .07); this.tone(1320, .12, 'triangle', .06, .14); },
  levelup(){ const s=[523,659,784,1046]; s.forEach((f,i)=>this.tone(f,.12,'triangle',.07,i*.09)); },
  rentPaid(){ const s=[392,523,659,784]; s.forEach((f,i)=>this.tone(f,.16,'triangle',.08,i*.12)); },
  win(){ const s=[523,659,784,1046,1318]; s.forEach((f,i)=>this.tone(f,.16,'triangle',.08,i*.12)); },
  lose(){ const s=[392,330,262,196]; s.forEach((f,i)=>this.tone(f,.22,'sine',.08,i*.16)); },
  sponsor(){ this.tone(700, .1, 'triangle', .06); this.tone(1050, .12, 'triangle', .06, .1); },
  type(){ this.tone(rnd(2400, 3400), .015, 'square', .012); },
  mouse(){ this.tone(1900, .02, 'square', .014); },
  print(){ this.tone(310, .05, 'sawtooth', .02); },
  error(){ this.tone(210, .16, 'sawtooth', .06, 0, 120); },
  happy(){ this.tone(784, .07, 'sine', .05); this.tone(988, .09, 'sine', .05, .07); },
  warn(){ this.tone(330, .14, 'square', .05); this.tone(262, .18, 'square', .05, .16); },
  coin(){ this.tone(1567, .05, 'sine', .04); },
  loan(){ this.tone(392, .12, 'triangle', .06); this.tone(523, .14, 'triangle', .06, .1); this.tone(659, .18, 'triangle', .05, .2); },
};

/* ================= ثابت‌ها ================= */
const VW = 360, VH = 640;
const WORLD_W = 820;   // عرضِ کلِ دنیا — سالن دوم از x=400 · VIP از x=660
const DAY_LEN = 90, DAYS = 7;
const D_TIMES = [12, 45, 78];       // سه دوراهیِ هر روز

/* تیپ‌های مشتری */
const KINDS = {
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
const KIND_KEYS = ['dl','game','chat','print','student','hurry','poor','grumpy','rich','trouble','esports'];
const PRINT_RATE = 1 / 14;

/* مکالمه‌ها — کوتاه و زنده */
const SNACK_LINES = ['اسنک با دمنوشِ سرد!','پرفترینِ کافه','همین که بده','دست‌پختِ خودت؟'];
const SOLO = ['پیینگ چنده؟','یاهووو!','چت روم پریده','دانلود نصفه موند…','اینترنت قطعه؟','اسمس نرفت','اوکیه، سریعه!','دیر شد، باشه','افسای!','شکرِ چایی کم بود'];
const PAIRS = [['خبر شدی؟','همینه!'],['فردا میای؟','حتما'],['اینو دیدی؟','خندیدم'],['چی داری؟','همون قبلی'],['دوباره؟','آره بابا']];
const TEA_LINES = ['بفرما، گرم گرم','چای دم‌کشیده','هیپ مکمل است'];
const CLOTHES = ['#3e6b6b','#7a4a3a','#55603a','#6b4a6b','#4a5a7a','#7a6a3a','#4a6b55','#804040','#3a5a4a','#6b3a3a'];
const NAMES = ['آرش','سینا','نیما','پویا','رها','ترانه','میلاد','کاوه','شایان','درسا','بهنام','پارسا','مهدی','آریا','سانیا','فرزاد','کیان','مهسا','بردیا','شیوا','یاسین','نوید','الهام','سامان','روژان','هیوا','کتایون','بابک','نازنین','فرهاد','پریا','دانیال','گلناز','هومن','سپهر','مینا'];
const HAIRS = ['#1a1a1a','#3a2a1a','#5a3a1a','#2a2a3a','#1a2a1a','#4a4a4a','#151515'];
const SKINS = ['#f2d4b4','#e0b080','#c08a58','#8a5a3a'];
const HAIRSTYLES = ['buzz','spiky','bun','long','curly','cap'];
/* جدولِ انیمیشن — متادیتای پوزها (فازِ ۲) */
const ANIMS = {
  walk:       { dur: 0 },    // پیوسته
  idle:       { dur: 3.0 },
  sit:        { dur: 1.0 },
  typing:     { dur: 1.0 },
  drink:      { dur: 2.2 },
  celebrate:  { dur: 1.6 },
  angry:      { dur: 1.0 },
  disappoint: { dur: 1.0 },
  talk:       { dur: 1.2 },
};

/* عنوان‌های کافه بر اساس سطح */
function titleFor(lv){
  if(lv >= 10) return 'افسانه‌ی کافه‌نت';
  if(lv >= 9)  return 'اسطوره‌ی محله';
  if(lv >= 7)  return 'طلایی';
  if(lv >= 5)  return 'ترِندِ شهر';
  if(lv >= 3)  return 'معروفِ شهر';
  if(lv >= 2)  return 'سرِ کوچه';
  return 'کافه‌ی محله';
}
function xpNext(lv){ return Math.round(150 * Math.pow(1.35, lv - 1)); }

/* ارتقاها */
const UPGRADES = [
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
  { id:'tea2',      cat:'equip', name:'کتریِ دوم',       icon:'🍵', max:2, prices:[1500000,4000000],                          eff:'چای هم‌زمان برای ۲ مشتری' },
  { id:'headset',   cat:'equip', name:'هدفونِ گیمینگ',    icon:'🎧', max:2, prices:[900000,2100000],                           eff:'گیمرها و حرفه‌ای‌ها ۳۰٪ بیشتر جذب می‌شوند در هر سطح' },
  { id:'cooling',   cat:'equip', name:'خنک‌کننده‌ی مرکزی', icon:'❄', max:2, prices:[1400000,3200000],                          eff:'فرسایشِ شبانه‌ی تجهیزات −۱۵٪ در هر سطح — تعمیرِ کمتر، عمرِ بیشتر' },
  { id:'console',   cat:'equip', name:'گوشه‌ی کنسول',     icon:'🎮', max:1, prices:[18000000], req:5,                          eff:'۲ ایستگاهِ کنسول با تلویزیونِ بزرگ و مبل — تعرفه ×۱٫۲ · گیمرها و پولدارها' },
  { id:'staff',     cat:'staff', name:'کارمندِ خوش‌قدم',  icon:'🧍', max:2, prices:[2200000,5500000],                          eff:'چای و اسنک را خودش سرو می‌کند — دستِ تو آزاد می‌ماند' },
  { id:'hall',      cat:'equip', name:'سالن دومِ گیم',    icon:'🏛', max:2, prices:[15000000,40000000],                        eff:'اتاقِ گیمِ بزرگ باز می‌شود — ۳ میزِ تازه در هر سطح' },
  { id:'vipHall',   cat:'equip', name:'سالن VIP',        icon:'💎', max:1, prices:[45000000], req:6,                 eff:'۴ میزِ لوکس با تعرفه‌ی ×۱٫۴ در بالِ اختصاصی — گیمرِ حرفه‌ای و پولدارها عاشقش‌اند' },
  { id:'tech',      cat:'staff', name:'تکنسین تعمیرات',   icon:'🔧', max:3, prices:[1500000,3200000,6000000],                  eff:'هر شب تجهیزات را سرویس می‌کند و خرابی را خودش درست می‌کند · حقوق هفتگی دارد' },
  { id:'clean',     cat:'staff', name:'مسئول نظافت',      icon:'🧹', max:2, prices:[1200000,2800000],                          eff:'عصبانی‌شدن کمتر · شهرتِ روزانه بهتر · حقوق هفتگی دارد' },
  { id:'mgr',       cat:'staff', name:'مدیر شیفت',        icon:'📋', max:2, prices:[2500000,5200000],                          eff:'درآمد کل +۴٪ در هر سطح · حقوق هفتگی دارد' },
  { id:'net',       cat:'staff', name:'متخصص شبکه',       icon:'🌐', max:2, prices:[3000000,7000000],                          eff:'بودجه‌ی پهنای باند +۱۲ در هر سطح · قطعی و ویروس کوتاه‌تر · حقوق هفتگی دارد' },
  { id:'emgr',      cat:'staff', name:'مسئول مسابقات',    icon:'🏆', max:2, prices:[2500000,5500000],                          eff:'درآمدِ ثبت‌نامِ تورنمنت +۲۵٪ و شهرتِ مسابقه بیشتر · حقوق هفتگی دارد' },
  { id:'wall',      cat:'deco',  name:'رنگ دیوار',        icon:'🎨', max:2, prices:[900000,2400000],                           eff:'کافه را رنگِ تازه بزن — پالتِ فضا عوض می‌شود' },
  { id:'lamp2',     cat:'deco',  name:'نورپردازی گرم',    icon:'💡', max:1, prices:[1600000],                                  eff:'لامپ‌ها و نئون‌ها گرم و پخش‌تر می‌شوند' },
  { id:'plant2',    cat:'deco',  name:'باغِ کافه',        icon:'🌿', max:1, prices:[800000],                                   eff:'گیاهان تازه در هر دو سالن' },
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
}
const lvl = id => Save.d.up[id] || 0;

/* ماموریت‌ها */
const MISSIONS = [
  { id:'dl3',    t:'۳ مشتری دانلود راضی کن',   k:'dlServed',     goal:3, r:120000, icon:'⬇️' },
  { id:'tea4',   t:'۴ چای سرو کن',             k:'teas',         goal:4, r:90000,  icon:'☕' },
  { id:'print2', t:'۲ پرینت تحویل بده',        k:'prints',       goal:2, r:100000, icon:'🖨' },
  { id:'serve8', t:'۸ مشتری راضی در یک روز',   k:'served',       goal:8, r:180000, icon:'😊', daily:true },
  { id:'calm',   t:'روزی بدون مشتریِ عصبانی',  k:'dayNoAngry',   goal:1, r:220000, icon:'🕊', daily:true },
  { id:'combo3', t:'کامبو ×۳ بساز',            k:'maxCombo',     goal:3, r:150000, icon:'🔥' },
  { id:'clean',  t:'بازرس را بدون رشوه رد کن', k:'cleanInspect', goal:1, r:150000, icon:'🧐' },
  { id:'snack3', t:'۳ اسنک سرو کن',           k:'snacks',       goal:3, r:150000, icon:'🥤' },
  { id:'vip1',   t:'یک VIP راضی کن',           k:'vipServed',    goal:1, r:200000, icon:'👑', req:'vip' },
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
];
const MISSION_BY_ID = {}; MISSIONS.forEach(m => MISSION_BY_ID[m.id] = m);

/* دستاورد — باز شدنش شهرتِ دائمی می‌دهد */
const ACH = [
  { id:'w1',       t:'اولین اجاره',              need: s => s.weeksPaid >= 1, fame:5 },
  { id:'m1',       t:'میلیونِ یک‌روزه',           need: s => s.bestDay >= 1000000, fame:5 },
  { id:'streak10', t:'۱۰ راضیِ پشت‌سرهم',         need: s => s.bestStreak >= 10, fame:5 },
  { id:'upall',    t:'همه‌چیز حداقل یک‌لول',      need: () => UPGRADES.every(u => lvl(u.id) >= 1), fame:8 },
  { id:'lv5',      t:'سطح ۵ کافه',               need: () => G.level >= 5, fame:10 },
  { id:'s500',     t:'۵۰۰ مشتریِ راضی',           need: s => s.served >= 500, fame:12 },
  { id:'w5',       t:'پنج اجاره‌ی پیاپی',         need: s => s.weeksPaid >= 5, fame:15 },
  { id:'crown',    t:'تاجِ کافه‌نت',              need: () => lvl('sys') >= 6 && lvl('router') >= 5, fame:20 },
  { id:'boss',     t:'شکستِ گیم‌لندِ پارک',        need: () => typeof beatRival === 'function' && beatRival('r2'), fame:12 },
  { id:'hall2',  t:'افتتاحِ سالن دومِ گیم',      need: () => lvl('hall') >= 1,        fame: 4 },
  { id:'vipH',   t:'افتتاحِ سالنِ VIP',          need: () => lvl('vipHall') >= 1,     fame: 6 },
  { id:'desk20', t:'۲۰ میزِ فعالِ هم‌زمان',       need: () => cafeCapacity() >= 20,    fame: 6 },
  { id:'tour1',  t:'برگزاریِ اولین تورنمنتِ موفق', need: s => (s.tourneys || 0) >= 1,   fame: 5 },
  { id:'rich1',    t:'اولین مشتریِ پولدار',        need: s => s.regulars >= 1 || (typeof G !== 'undefined' && G.richServed), fame:6 },
];

/* ================= وضعیت ================= */
const G = {
  scene: 'menu',            // menu | day | over
  day: 1, week: 1, money: 0, fame: 40, xp: 0, level: 1,
  t: 0, spawnT: 1.6, slots: 4,
  systems: [],              // {kind, need, patience, patMax, progress, alloc, disp, prevAlloc, virus, virusT, rebootT, seatT, vip}
  people: [],               // همه‌ی آدم‌های روی صحنه (مشتری/مهمانِ محیط/صف)
  queue: [],                // مشتری‌های در انتظارِ میز
  particles: [], floaters: [], leaving: [],
  cat: { x: -24, dir: 1, on: false, t: 9, stop: 0, bub: null },
  staff: { t: 8, bub: null },
  lanDay: false, wkNoAngry: true,
  moneyDisp: 0, tapFx: null,
  budget: 100, evSched: [], evIdx: 0, evKinds: [], activeEvent: null, evT: 0,
  dIdx: 0, risk: 0, combo: 0, streak: 0,
  teaCd: 0, teaQueued: [],
  printerJob: -1,
  shake: 0, flash: null,
  dayStats: { earned: 0, served: 0, angry: 0, teas: 0, tipEarned: 0, prints: 0, maxCombo: 0, dlServed: 0, vipServed: 0, spent: 0, power: 0, salary: 0, snacks: 0 },
  missionProg: {},
  paused: false, userPaused: false, frozen: true,
  drag: null, ts: 1,
  cam: { x: 0, target: 0 }, pan: null,
  doorGlow: 0,
};

/* مشتق‌ها */
function budget(){ return 100 + 15 * lvl('router') + 12 * lvl('net'); }
function patMul(){ return (1 + 0.10 * lvl('seat') + 0.01 * (G.level - 1)) * 0.92; }
function fameMul(){ return 0.85 + G.fame / 100 * 0.3; }
function levelMul(){ return 1 + 0.02 * (G.level - 1); }
function legacyPct(){ return 0.06 * ((Save.d.stats && Save.d.stats.weeksPaid) || 0); }
function legacyMul(){ return 1 + legacyPct(); }
function payMul(){
  const ad = activeAd();
  return fameMul() * levelMul() * legacyMul() * (1 + 0.05 * (G.week - 1)) * (1 + 0.04 * lvl('mgr'))
    * (1 + 0.06 * lvl('pcTier')) * (ad && ad.pay ? ad.pay : 1);
}
function spawnMul(){
  const ad = activeAd();
  return Math.pow(0.93, lvl('neon')) * (1 + 0.03 * lvl('pcTier')) * (ad && ad.spawn ? ad.spawn : 1)
    * (typeof rivalPressure === 'function' ? rivalPressure() : 1);
}
function progMul(){ return (1 + 0.18 * lvl('adsl')) * (Save.d.turbo ? 1.25 : 1); }
function printMul(){ return 1 + 0.25 * lvl('printer'); }
function outageDur(){ return Math.max(3, (9 - 2 * lvl('ups')) * (1 - 0.25 * lvl('net'))); }
function virusDur(){ return Math.max(4, (11 - 2 * lvl('antivirus')) * (1 - 0.2 * lvl('net'))); }
function rebootDur(){ return 1.6 - 0.35 * lvl('antivirus'); }
function teaCdMax(){ return Math.max(6, 13 - lvl('snack')); }
function teaTip(){ return 10000 + 6000 * lvl('snack'); }
/* ظرفیتِ واقعیِ کافه — تنها منبعِ حقیقت برای همه‌ی سیستم‌ها
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
}
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
  { id:'streamer',t:'همکاری با استریمر', d:'۳ روز · ورود ۲۲٪ بیشتر + گیمرِ حرفه‌ای جذب می‌شود', cost: 2500000, days: 3, spawn: .78, kindBias: 'esports' },
  { id:'studisc', t:'تخفیف دانشجویی',  d:'۴ روز · دانشجوها و عجول‌ها بیشتر می‌آیند',   cost: 700000,  days: 4, spawn: .85, kindBias: 'student' },
];
function activeAd(){ return (Save.d.ads && ADS.find(a => a.id === Save.d.ads.id)) || null; }
/* ---------- رقبای محله ---------- */
const RIVALS = [
  { id:'r1', name:'کافه‌ی بغل',     eq: 2, speed: 1.0,  price: .9,  strat: 'value',   stratT: 'قیمت‌شکن' },
  { id:'r2', name:'گیم‌لندِ پارک',  eq: 4, speed: 1.15, price: 1.05, strat: 'premium', stratT: 'تجهیزِ سنگین' },
  { id:'r3', name:'نت‌پلاسِ مرکز',  eq: 6, speed: 1.3,  price: 1.2,  strat: 'growth',  stratT: 'تبلیغاتِ همه‌جانبه' },
];
function rivalState(id){
  if(!Save.d.rivals) Save.d.rivals = {};
  if(!Save.d.rivals[id]){
    const base = RIVALS.find(r => r.id === id) || RIVALS[0];
    Save.d.rivals[id] = { fame: ({ r1: 34, r2: 52, r3: 74 })[id] || 40, eq: base.eq, price: base.price, cash: 4000000, strat: base.strat, alive: true, ad: 0 };
  }
  return Save.d.rivals[id];
}
function rivalFame(id){ const s = rivalState(id); return s ? s.fame : 40; }
function rivalAvgFame(){
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
}
function beatRival(id){ return G.fame > rivalFame(id); }
function staffSalary(){ return lvl('staff') === 2 ? 350000 : lvl('staff') === 1 ? 150000 : 0; }
function powerCost(){ return 40000 + 32000 * cafeCapacity() + 1500 * lvl('pcTier') * cafeCapacity(); }
function internetCost(){ return 80000 + 15000 * lvl('router'); }
function materialsCost(){ return (G.weekMat || 0); }
function satisfactionPct(){ return clamp(Math.round(38 + G.fame * 0.62), 0, 100); }
function sysHp(i){ const a = Save.d.hp; return (a && a[i] !== undefined) ? a[i] : 100; }
function hpMul(i){ const h = sysHp(i); return h >= 70 ? 1 : h >= 40 ? 0.85 : 0.62; }
function repairCost(i){ return Math.round((50000 + (100 - sysHp(i)) * 4200) / 5000) * 5000; }
function loyalChance(){
  const ad = activeAd();
  return Math.min(0.35, 0.06 + (Save.d.loyal.good || 0) / 400 + (ad && ad.loyal ? ad.loyal : 0) + 0.02 * G.level);
}
/* ---------- تورنمنت‌های گیمینگ ---------- */
const TOURN = [
  { id:'t1', name:'تورنمنتِ محلی',   cost: 800000,  prize: 1200000,  fee: 80000,  cap: 6,  req: 2, fame: 5 },
  { id:'t2', name:'تورنمنتِ استانی', cost: 2500000, prize: 4500000,  fee: 150000, cap: 10, req: 4, fame: 10 },
  { id:'t3', name:'تورنمنتِ ملی',    cost: 8000000, prize: 15000000, fee: 300000, cap: 16, req: 6, fame: 20 },
  { id:'t4', name:'تورنمنتِ بین‌المللی', cost: 20000000, prize: 38000000, fee: 500000, cap: 20, req: 8, fame: 35 },
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
function addReview(stars, kindId, name){
  const s = clamp(Math.round(stars), 1, 5);
  Save.d.reviews.unshift({ s, k: kindId, w: G.week, txt: pick(REVIEW_TXT[s]), n: name || undefined });
  if(Save.d.reviews.length > 12) Save.d.reviews.pop();
}
const STAGES = [
  { n: 1, t: 'کافه‌ی اینترنتیِ کوچک' },
  { n: 2, t: 'کافه‌ی گیمِ درحالِ رشد' },
  { n: 3, t: 'مرکزِ گیمینگِ حرفه‌ای' },
  { n: 4, t: 'مرکزِ ای‌اسپورتسِ پرمیوم' },
  { n: 5, t: 'امپراتوریِ گیمینگ' },
];
function stageInfo(){
  const pc = lvl('pcTier'), sy = lvl('sys'), h = lvl('hall'), v = lvl('vipHall');
  const tw = G.runStats && (G.runStats.tourneys || 0), lv = G.level || 1;
  if(v && pc >= 4 && (tw >= 3 || lv >= 9)) return STAGES[4];
  if(v) return STAGES[3];
  if(pc >= 3 && sy >= 5 && h >= 1) return STAGES[2];
  if(pc >= 2 || sy >= 4 || h >= 1) return STAGES[1];
  return STAGES[0];
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
function cafeStars(){ return clamp(Math.round(G.fame / 20), 1, 5); }
function cafeRank(){
  if(Save.d.crowned) return 1;
  return Math.max(2, 99 - Math.round(G.fame) - 2 * ((Save.d.stats && Save.d.stats.weeksPaid) || 0) - 2 * G.level);
}

/* ================= راهِ تاج — هدفِ نهایی ================= */
const CROWN = [
  { id:'lv10',   t:'رسیدن به سطح ۱۰ — «افسانه‌ی کافه‌نت»', p: () => G.level / 10 },
  { id:'fame',   t:'شهرتِ کامل — ۵ ستاره (۱۰۰٪)',          p: () => G.fame / 100 },
  { id:'hall',   t:'سالنِ دومِ کامل — ۱۶ میزِ فعال',        p: () => (lvl('sys') / 6 + lvl('hall') / 2) / 2 },
  { id:'lan30',  t:'۳۰ لَن‌پارتیِ موفق',                    p: () => (G.runStats.lans || 0) / 30 },
  { id:'rev100', t:'درآمدِ کلِ ۱۰۰ میلیون تومان',           p: () => (G.runStats.revenue || 0) / 100000000 },
  { id:'serve1k',t:'۱٬۰۰۰ مشتریِ راضی',                     p: () => (G.runStats.served || 0) / 1000 },
  { id:'rent12', t:'پرداختِ ۱۲ اجاره‌ی هفتگی',              p: () => (G.runStats.weeksPaid || 0) / 12 },
];
function crownPct(){
  let s = 0;
  for(const c of CROWN) s += clamp(c.p(), 0, 1);
  return s / CROWN.length;
}
function crownDone(){ return CROWN.every(c => clamp(c.p(), 0, 1) >= 1); }
function crownNext(){
  let worst = null, wp = 1;
  for(const c of CROWN){ const v = clamp(c.p(), 0, 1); if(v < wp){ wp = v; worst = c; } }
  return worst ? worst.t : '';
}
function addCoins(n, why){
  Save.d.coins = (Save.d.coins || 0) + n;
  if(why){ toast('🪙 +' + faNum(n) + ' سکه — ' + why, 'amber'); Sfx.buy(); }
}

/* ================= توست ================= */
function toast(txt, kind){
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.textContent = txt;
  box.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 2200);
  setTimeout(() => { el.remove(); }, 2700);
  while(box.children.length > 3) box.firstChild.remove();
}

/* ================= ذخیره‌ی وضعیت جاری در پروفایل ================= */
function persist(){
  Save.d.week = G.week; Save.d.day = G.day; Save.d.money = G.money;
  Save.d.fame = G.fame; Save.d.xp = G.xp;
  Save.d.stats = Object.assign({}, G.runStats || Save.d.stats);
  Save.d._level = G.level;
  Save.save();
}
G.runStats = Save.d.stats;
</script>
