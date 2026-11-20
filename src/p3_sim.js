<script>
/* ============================================================
   کافه‌نت — شبیه‌سازی: مردم · میزها · چای · رویدادها · دوراهی‌ها
   ماموریت · دستاورد · سطح · روز/هفته · شکست و میراث
   ============================================================ */

/* ================= چیدمانِ میزها ================= */
function deskPos(i){
  if(i >= 16){ const j = i - 16; return { x: 700 + 80 * (j % 2), y: 168 + 124 * Math.floor(j / 2) }; }
  if(i >= 10){ const j = i - 10; return { x: 404 + 64 * (j % 3), y: 168 + 124 * Math.floor(j / 3) }; }
  const row = Math.floor(i / 5), col = i % 5;
  return { x: 44 + 62 * col, y: 168 + 124 * row };
}
const CONSOLE_POS = [{ x: 636, y: 240 }, { x: 636, y: 356 }]; // گوشه‌ی کنسول — بین سالن۲ و VIP
const DOOR = { x: 338, y: 112 };
const QUEUE_SPOTS = [{x:318,y:140},{x:318,y:172},{x:318,y:204}];
const WALK_V = 58;

/* ================= ساخت روز ================= */
function newGame(keep){
  if(!keep) Save.wipe();
  else {
    Save.d.money = 0; Save.d.week = 1; Save.d.day = 1;
  }
  Save.save();
  G.week = Save.d.week; G.day = Save.d.day;
  G.money = Save.d.money; G.fame = Save.d.fame; G.xp = Save.d.xp;
  G.level = keep ? Math.max(1, Math.min(10, Save.d._level || 1)) : 1;
  Save.d._level = G.level;
  G.runStats = Save.d.stats;
  startDay();
}
function startDay(){
  hideFade('menu');
  $('summary').hidden = true; $('weekend').hidden = true;
  hideFade('gameover'); $('shop').hidden = true; $('quests').hidden = true;
  $('cornerL').hidden = false;
  G.moneyDisp = G.money;
  G.scene = 'day';
  G.t = 0; G.spawnT = 1.4;
  G.slots = cafeCapacity();
  G.systems = [];
  for(let i = 0; i < MAX_SLOTS; i++){
    G.systems.push({ kind:null, need:0, patience:0, patMax:1, progress:0, alloc:0, disp:0,
      prevAlloc:0, virus:false, virusT:0, rebootT:0, seatT:0, vip:false, cust:null });
  }
  G.people = []; G.queue = []; G.particles = []; G.leaving = [];
  G.console = [{ c: null }, { c: null }];
  if(lvl('clean')){
    const cm = crewFor('clean') || {};
    G.people.push({ type:'clean', x: 80, y: 505, dir: 1, bt: rnd(1,3), ph: rnd(0, TAU), shirt: cm.shirt || pick(CLOTHES), hair: cm.hair || pick(HAIRS), skin: cm.skin, hairStyle: cm.hairStyle, hMul: 0.94, bub: null });
  }
  if(lvl('tech')){
    const cm = crewFor('tech') || {};
    G.people.push({ type:'tech', x: 700, y: 398, dir: -1, bt: rnd(1,3), ph: rnd(0, TAU), shirt: cm.shirt || pick(CLOTHES), hair: cm.hair || pick(HAIRS), skin: cm.skin, hairStyle: cm.hairStyle, hMul: 0.98, bub: null, fixT: 0 });
  }
  G.budget = budget(); G.evIdx = 0; G.dIdx = 0; G.activeEvent = null;
  G.combo = 0; G.streak = 0; G.risk = 0; G.teaCd = 0;
  G.printerJob = -1; G.paused = false; G.userPaused = false; G.frozen = true;
  G.drag = null;
  G.dayStats = { earned:0, served:0, angry:0, teas:0, tipEarned:0, prints:0, maxCombo:0, dlServed:0, vipServed:0, spent:0,
    power:0, salary:0, internet:0, materials:0, printRev:0, servedBreak:0 };
  G.missionProg = {};
  G.weekStats = G.weekStats || { earn:0, served:0, angry:0 };
  G.kindForce = null;
  Save.d.powerSpike = false;
  // روزِ تورنمنت؟
  if(Save.d.tourPend){
    G.tournament = tourById(Save.d.tourPend);
    Save.d.tourPend = null;
    G.tourP = 0;
    const T0 = G.tournament;
    if(T0) setTimeout(() => { toast('🏆 ' + T0.name + ' شروع شد — هر گیمرِ راضی = ثبت‌نامِ ' + fmtK(T0.fee), 'amber'); }, 1800);
  } else G.tournament = null;
  // سلامتِ تجهیزات — آرایه‌ی پایدار
  if(!Array.isArray(Save.d.hp) || Save.d.hp.length !== MAX_SLOTS){
    Save.d.hp = []; for(let i = 0; i < MAX_SLOTS; i++) Save.d.hp.push(100);
  }
  // برنامه‌ی اتفاقات: هفته‌های بالاتر، تنبolic بیشتر
  if(G.week >= 6) G.evSched = [20, 44, 64, 80];
  else if(G.week >= 3) G.evSched = [22, 48, 72];
  else G.evSched = [24, 52, 76];
  const pool = G.week >= 3
    ? ['outage','virus','rush','fest','tour','celeb','inspect','partner','invest','breakdown','supplier','powerSpike','netfault']
    : ['outage','virus','rush','fest','breakdown','supplier'];
  G.evKinds = [];
  for(let i = 0; i < G.evSched.length; i++){
    let k = pool[Math.floor(Math.random() * pool.length)];
    if(G.week >= 2 && Math.random() < 0.18) k = 'sponsor';
    if(i === 0) k = pool[Math.floor(Math.random() * Math.min(4, pool.length))]; // اولِ روز ملایم‌تر
    G.evKinds.push(k);
  }
  buildAmbient();
  showBanner();
}
function showBanner(){
  $('bKicker').textContent = 'هفته ' + faNum(G.week) + ' · اجاره: ' + fmtK(rentFor(G.week)) + ' تومان';
  $('bDay').textContent = 'روز ' + faNum(G.day);
  const stg = stageInfo();
  $('bSub').textContent = 'مرحله‌ی ' + faNum(stg.n) + ': ' + stg.t + ' · ' + titleFor(G.level) + ' · سطح ' + faNum(G.level) + ' · میراث +' + faF1((Save.d.legacy||0)*100) + '٪' + (G.lanDay ? ' · 🎮 لَن‌پارتیِ امشب' : '');
  if(G.lanDay) setTimeout(() => { toast('🎮 امشب لَن‌پارتی است — همه گیمرند، پرداخت ×۱٫۵', 'pink'); }, 1500);
  const b = $('banner'); b.hidden = false;
  const bar = b.querySelector('i');
  bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
  requestAnimationFrame(() => { bar.style.transition = 'transform 1.25s linear'; bar.style.transform = 'scaleX(1)'; });
  setTimeout(() => { b.hidden = true; G.frozen = false; }, 1400);
  Sfx.boot();
}

/* ================= آدم‌ها ================= */
let uid = 1;
function buildAmbient(){
  // متصدی پشت کانتر — پیش‌بند آبی
  G.people.push({ type:'bar', x: 48, y: 86, bob: rnd(0, TAU), shirt: '#59c2ff', hair: pick(HAIRS) });
  // دو نفرِ سرِ نیمکت — با هم گپ می‌زنند
  G.people.push({ type:'amb', x: 232, y: 106, bob: rnd(0, TAU), bt: rnd(2,5), turn: 0, shirt: pick(CLOTHES), hair: pick(HAIRS) });
  G.people.push({ type:'amb', x: 254, y: 106, bob: rnd(0, TAU), bt: rnd(2,5), turn: 1, shirt: pick(CLOTHES), hair: pick(HAIRS) });
  // قلیان‌سوارِ گوشه — خودش دود می‌دهد
  G.people.push({ type:'amb', x: 300, y: 108, bob: rnd(0, TAU), bt: rnd(4,9), turn: 0, shirt: pick(CLOTHES), hair: pick(HAIRS), smoker: true });
    /* شبِ استراحتِ تیم + بررسیِ فصلِ بعدیِ داستان */
    if(Save.d.crew && Save.d.crew.length) for(const cm of Save.d.crew) cm.fatigue = clamp(cm.fatigue - 8, 0, 100);
    if(typeof checkStory === 'function') checkStory();
}
function pickKind(){
  if(G.kindForce){ const ks = KIND_KEYS.filter(k => G.kindForce.includes(k)); if(ks.length) return pick(ks); }
  const ad = activeAd();
  const bias = ad && ad.kindBias;
  const tourBias = G.tournament && ['game','esports'];
  let sum = 0;
  for(const k of KIND_KEYS){
    let w = KINDS[k].w;
    if(bias && (k === bias || (bias === 'student' && (k === 'student' || k === 'hurry')))) w *= 3;
    if(bias === 'esports' && k === 'esports') w *= 3;
    if(tourBias && tourBias.includes(k)) w *= 3;
    if((k === 'game' || k === 'esports') && lvl('headset')) w *= 1 + 0.3 * lvl('headset');
    sum += w;
  }
  let r = Math.random() * sum;
  for(const k of KIND_KEYS){
    let w = KINDS[k].w;
    if(bias && (k === bias || (bias === 'student' && (k === 'student' || k === 'hurry')))) w *= 3;
    if(bias === 'esports' && k === 'esports') w *= 3;
    if(tourBias && tourBias.includes(k)) w *= 3;
    if((k === 'game' || k === 'esports') && lvl('headset')) w *= 1 + 0.3 * lvl('headset');
    r -= w;
    if(r <= 0){ G.nextKind = k; return k; }
  }
  G.nextKind = 'dl';
  return 'dl';
}
function spawnCustomer(){
  const kind = pickKind(), K = KINDS[kind];
  const weekScale = Math.min(0.45, 0.035 * (G.week - 1));
  const c = {
    type:'cust', id: uid++, kind,
    need: kind === 'chat' ? 5 : Math.round(rndi(K.needMin, K.needMax) * (1 + weekScale)),
    patience: rnd(K.patMin, K.patMax) * patMul(),
    progress: 0, state: 'walk', desk: -1,
    x: DOOR.x, y: DOOR.y, path: [], pathI: 0,
    bubble: null, bt: rnd(7, 16), bob: rnd(0, TAU), stepT: 0, sitT: 0,
    shirt: pick(CLOTHES), hair: pick(HAIRS),
    name: pick(NAMES),
    visN: 0,
    skin: pick(SKINS), hairStyle: pick(HAIRSTYLES),
    hMul: kind === 'teen' ? 0.85 : (kind === 'rich' || kind === 'esports') ? 1.05 : 0.92 + Math.random() * 0.16,
    wMul: kind === 'teen' ? 0.9 : (kind === 'tourist' || kind === 'rich') ? 1.12 : 0.95 + Math.random() * 0.15,
    acc: (kind === 'work' || (kind === 'student' && Math.random() < 0.5)) ? 'glasses' : null,
    headset: kind === 'game' || kind === 'esports',
    anim: null, animT: 0,
    vip: lvl('vip') >= 1 && Math.random() < 0.1,
    snackWish: lvl('snack') >= 1 && Math.random() < 0.35,
    lan: G.lanDay,
  };
  // شخصیت‌های تازه
  const K2 = KINDS[kind];
  c.regular = Math.random() < loyalChance();
  if(c.regular){ c.patience *= 1.2; c.visN = 2 + Math.floor(Math.random() * 6); } // سابقه‌ی مراجعه‌های قبلی
  if(K2.printChance && Math.random() < K2.printChance && lvl('printer') >= 1){
    c.kind = 'print'; c.need = 0;
  }
  if(K2.virusChance){ c.troubleMaker = true; }
  c.patMax = c.patience;
  if(c.vip){ c.patience *= 1.25; c.patMax = c.patience; setTimeout(() => { if(G.scene === 'day') toast('💎 VIPِ امشب: ' + c.name + ' — پولِ دوبرابر!', 'amber'); }, 900); }
  if(c.lan && c.kind !== 'print') c.need = Math.max(5, Math.round(c.need * 1.25));
  if(Math.random() < 0.25 && routeConsole(c)){ G.people.push(c); G.doorGlow = 1; Sfx.arrive(); return; }
  const free = freeDesk(c.kind);
  if(free >= 0){ seatCustomer(c, free); }
  else if(G.queue.length < 3){
    c.queued = true;
    c.path = [{ x: QUEUE_SPOTS[G.queue.length].x, y: QUEUE_SPOTS[G.queue.length].y }];
    G.queue.push(c);
  } else { G.flash = { color:'255,95,162', a: 0.1 }; return; } // ظرفیت پر — می‌رود
  G.people.push(c);
  G.doorGlow = 1;
  Sfx.arrive();
}
/* ================= گوشه‌ی کنسول ================= */
function routeConsole(c){
  if(!lvl('console') || !G.console) return false;
  if(c.kind !== 'game' && c.kind !== 'esports' && c.kind !== 'rich') return false;
  const idx = G.console.findIndex(s => !s.c);
  if(idx < 0) return false;
  G.console[idx].c = c;
  c.consoleIdx = idx;
  c.onArrive = 'console';
  c.desk = -1;
  const P = CONSOLE_POS[idx];
  c.path = [{ x: P.x - 20, y: 128 }, { x: P.x - 20, y: P.y - 34 }];
  c.pathI = 0;
  c.consNeed = Math.max(3, Math.round(c.need * 1.1));
  return true;
}
function startConsPlay(c){
  c.state = 'consPlay';
  c.sitT = 0.45;
  c.progress = 0;
}
function freeConsole(c){
  if(!G.console || c.consoleIdx === undefined || c.consoleIdx < 0) return;
  const st = G.console[c.consoleIdx];
  if(st && st.c === c) st.c = null;
}
function completeConsole(c){
  const K = KINDS[c.kind];
  let pay = K.pay * payMul() * (1 + 0.15 * (G.combo + lvl('mgr'))) * 1.2;
  if(c.vip) pay *= 2;
  if(c.regular) pay *= 1.25;
  pay = Math.round(pay / 500) * 500;
  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  const ds = G.dayStats;
  ds.earned += pay; G.weekStats.earn += pay;
  ds.served++; G.runStats.served++;
  ds.consoleRev = (ds.consoleRev || 0) + pay;
  G.runStats.consoleRev = (G.runStats.consoleRev || 0) + pay;
  if(G.tournament && (c.kind === 'game' || c.kind === 'esports') && G.tourP < G.tournament.cap){
    G.tourP++;
    const fee = Math.round(G.tournament.fee * (1 + 0.25 * lvl('emgr')) / 5000) * 5000;
    G.money += fee; ds.earned += fee; G.weekStats.earn += fee;
    floater(c.x, c.y - 62, '+ثبت‌نام ' + fmtK(fee), hexk('p'));
  }
  G.combo = Math.min(5, G.combo + 1);
  G.streak++;
  ds.maxCombo = Math.max(ds.maxCombo || 0, G.combo);
  G.runStats.maxCombo = Math.max(G.runStats.maxCombo, G.combo);
  gainXP(4);
  freeConsole(c);
  if((s.kind === 'esports' || s.kind === 'game' || s.kind === 'teen') && Math.random() < 0.55){ c.anim = 'celebrate'; c.animT = 1.3; }
  customerDone(c, true);
  checkAch();
}
function consoleBail(c){
  freeConsole(c);
  const ds = G.dayStats;
  ds.angry++; G.runStats.angry++; G.weekStats.angry++;
  G.combo = 0; G.streak = 0;
  G.fame = clamp(G.fame - 4, 0, 100);
  G.shake = 0.5; Sfx.angry();
  customerDone(c, false);
}
function freeDesk(fk){
  // پولدار و گیمرِ حرفه‌ای میزهای VIP را ترجیح می‌دهند
  const k = fk || G.nextKind || '';
  const K = KINDS[k];
  if(K && (K.payMulC || K.fameOn)){
    for(let i = 16; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  if((k === 'game' || k === 'esports') && (lvl('pcTier') >= 2 || gpuHallReady())){
    for(let i = 10; i < 16; i++) if(deskOn(i) && !G.systems[i].cust) return i; // گیمر: سالنِ گیم قبل از سالنِ اصلی
  }
  if(k === 'student' || k === 'poor'){
    for(let i = 0; i < 10; i++) if(deskOn(i) && !G.systems[i].cust) return i; // اقتصادی‌ها از میزهای VIP می‌گذرند
    for(let i = 10; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  for(let i = 0; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  return -1;
}
function seatCustomer(c, i){
  const s = G.systems[i];
  c.desk = i; c.state = 'sit';
  const p = deskPos(i);
  c.x = p.x; c.y = p.y - 20;
  c.sitT = 0.45;
  if(i >= 10) G.cam.target = clamp(p.x - 170, 0, WORLD_W - VW);
  s.kind = c.kind; s.need = c.need; s.patience = c.patience; s.patMax = c.patMax;
    if(s.kind === 'game' || s.kind === 'esports'){ const gm = gpuPat(i); s.patience *= gm; s.patMax *= gm; }
  s.progress = 0; s.virus = false; s.virusT = 0; s.rebootT = 0; s.seatT = G.t; s.vip = c.vip;
  s.bootT = 0.45; s.vipDesk = i >= 16;
  s.cust = c.id; s.person = c;
  c.queued = false; c.path = []; c.pathI = 0;
  if(c.kind === 'print'){ s.alloc = 0; s.disp = 0; }
  else s.alloc = Math.min(s.alloc, freeBudgetExcluding(i));
  G.queue = G.queue.filter(q => q !== c);
  if(G.printerJob < 0 && c.kind === 'print') G.printerJob = i;
  // دردسرساز: ممکن است همان اول ویروسِ پخش کند
  if(c.troubleMaker && Math.random() < (KINDS.trouble.virusChance || 0.3) && lvl('antivirus') < 2){
    const targets = [];
    for(let j = 0; j < MAX_SLOTS; j++){ if(!deskOn(j)) continue; const o = G.systems[j]; if(o.kind && o.kind !== 'print' && !o.virus) targets.push(j); }
    if(targets.length){
      const j = pick(targets), os = G.systems[j];
      if(Math.random() < ramRes(j)){
        os.prevAlloc = os.alloc; os.virus = true; os.virusT = virusDur(); os.alloc = 20;
        if(!G.activeEvent){ G.activeEvent = 'virus'; G.evT = virusDur(); }
        rescaleAllocs();
        toast('⚠ یک مشتریِ دردسرساز ویروس پخش کرد!', 'pink');
      } else toast('🛡 رمِ سطح‌بالا ویروس را خنثی کرد!', 'cyan');
    }
  }
  Sfx.tickS();
}
function freeBudgetExcluding(skip){
  let others = 0;
  G.systems.forEach((s, i) => { if(i !== skip) others += s.alloc; });
  return Math.max(0, G.budget - others);
}
function walkUpdate(c, dt){
  if(!c.path || c.pathI >= c.path.length) return true;
  const t = c.path[c.pathI];
  const dx = t.x - c.x, dy = t.y - c.y, d = Math.hypot(dx, dy);
  const step = WALK_V * (c.state === 'angry' ? 1.5 : 1) * dt;
  if(d <= step){ c.x = t.x; c.y = t.y; c.pathI++; return c.pathI >= c.path.length; }
  c.x += dx / d * step; c.y += dy / d * step;
  c.bob += dt * 10;
  if(typeof ART !== 'undefined' && ART.ok && Math.random() < dt * 0.12) ART.sparkle(c.x + rnd(-6, 6), c.y - rnd(4, 16)); // جرقه‌ی ظریفِ راه‌رفتن
  c.stepT -= dt;
  if(c.stepT <= 0){ dust(c.x + rnd(-2, 2), c.y + 12); c.stepT = 0.18; }
  return false;
}
function customerDone(c, happy){
  const i = c.desk;
  if(i >= 0){
    const s = G.systems[i];
    s.kind = null; s.cust = null; s.person = null; s.virus = false; s.rebootT = 0; s.progress = 0;
    s.alloc = 0;
    if(G.printerJob === i) G.printerJob = nextPrintJob(i);
  }
  G.queue = G.queue.filter(q => q !== c);
  c.state = happy ? 'leave' : 'angry';
  c.path = [{ x: c.x, y: 116 }, { x: DOOR.x + 8, y: 116 }, { x: DOOR.x + 30, y: 112 }];
  c.pathI = 0;
  if(!happy){
    const K2 = KINDS[c.kind];
    let fHit = lvl('deco') ? 6 : 8;
    if(K2 && K2.angryFame) fHit += Math.round(K2.angryFame * (1 - 0.15 * lvl('clean')));
    fHit = Math.max(3, fHit - 2 * lvl('clean'));
    G.fame = clamp(G.fame - fHit, 0, 100);
    G.combo = 0; G.streak = 0;
    G.dayStats.angry++; G.runStats.angry++; G.weekStats.angry++;
    Save.d.loyal.bad = (Save.d.loyal.bad || 0) + 1;
    G.shake = 1; G.flash = { color:'255,77,94', a: 0.16 };
    puff(c.x, c.y, '#ff4d5e');
    addReview(1, c.kind, c.name);
    Sfx.angry(); vibrate(40);
  }
  seatFromQueue();
}
function seatFromQueue(){
  if(G.queue.length){
    const free = freeDesk(c.kind);
    if(free >= 0) seatCustomer(G.queue[0], free);
  }
}
function nextPrintJob(exclude){
  let best = -1, bt = 1e9;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];
    if(i !== exclude && s.kind === 'print' && s.seatT < bt){ bt = s.seatT; best = i; }
  }
  return best;
}

/* ================= تیکِ مشتریِ پشتِ میز ================= */
function tickSystem(i, dt){
  const s = G.systems[i];
  if(s.bootT > 0) s.bootT -= dt;
  if(!s.kind || s.virus) return;
  const c = s.person;
  if(!c || c.state !== 'sit') return;
  const K = KINDS[s.kind];
  const eff = s.rebootT > 0 ? 0 : s.alloc;
  const served = s.kind !== 'print' && eff >= s.need;
  // صبر
  let drain;
  if(s.kind === 'print') drain = (G.printerJob === i) ? 0.45 : 0.7;
  else drain = served ? 0.25 : 1.0;
  if(G.activeEvent === 'outage') drain += 0.8;
  if(s.vip) drain *= 0.8;
  if(K.drainMul) drain *= K.drainMul;
  if(c.regular) drain *= 0.9;
  s.patience -= drain * dt;
  if(c.patMax && s.patience / c.patMax < 0.28 && (!c.animT || c.animT <= 0)) c.anim = 'disappoint';
  // پیشرفت — سلامتِ تجهیزات اثر واقعی دارد
  const hpF = hpMul(i);
  if(s.kind === 'print'){
    if(G.printerJob === i && s.rebootT <= 0) s.progress += PRINT_RATE * printMul() * hpF * dt;
  } else {
    const pm = (s.vis === 'dl' || s.vis === 'game' || s.kind === 'dl' || s.kind === 'game') ? progMul() * cpuMul(i) : 1;
    s.progress += (eff / Math.max(1, s.need)) / K.dur * pm * hpF * dt;
  }
  // تجهیزاتِ فرسوده گاهی خودشان ری‌استارت می‌شوند
  if(sysHp(i) < 40 && s.rebootT <= 0 && !s.virus && Math.random() < dt * 0.025){
    s.rebootT = rebootDur();
    Sfx.error();
  }
  // صدای تایپِ ظریف (محدود و بی‌آزار)
  if(eff > 0 && s.kind !== 'print' && Math.random() < dt * 1.2) Sfx.type();
  s.progress = clamp(s.progress, 0, 1);
  if(s.progress >= 1){ completeCustomer(i); return; }
  if(s.patience <= 0) customerDone(c, false);
}
function completeCustomer(i){
  const s = G.systems[i], c = s.person;
  const K = KINDS[s.kind];
  const comboMul = 1 + 0.15 * (G.combo + lvl('mgr'));
  let pay = K.pay * payMul() * comboMul * (K.payMulC || 1) * monMul(i);
  if(s.vip) pay *= 2;
  if(G.activeEvent === 'sponsor') pay *= 1.5;
  if(G.activeEvent === 'fest') pay *= 0.85;
  if(G.activeEvent === 'tour' && (s.kind === 'game' || s.kind === 'esports')) pay *= 1.3;
  if(c.celeb) pay *= 3;
  if(c.regular) pay *= 1.25;
  if(s.vipDesk) pay *= 1.4; // تعرفه‌ی سالن VIP
  // عجول: اگر قبلِ ۶۰٪ صبرش تمام شد، انعامِ سرعت
  if(K.fastBonus && c.patience > c.patMax * 0.6){
    pay += K.fastBonus;
    floater(c.x, c.y - 62, '+انعامِ سرعت', hexk('a'));
    G.fame = clamp(G.fame + 1, 0, 100);
  }
  pay = Math.round(pay / 500) * 500;
  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  G.weekStats.earn += pay;
  const hr = s.vipDesk ? 'vip' : (i >= 10 ? 'h2' : 'h1');
  if(!G.dayStats.hallRev) G.dayStats.hallRev = { h1: 0, h2: 0, vip: 0 };
  if(!G.runStats.hallRev) G.runStats.hallRev = { h1: 0, h2: 0, vip: 0 };
  G.dayStats.hallRev[hr] += pay; G.runStats.hallRev[hr] += pay;
  // تورنمنت: هر گیمرِ راضی = یک ثبت‌نام
  if(G.tournament && (s.kind === 'game' || s.kind === 'esports') && G.tourP < G.tournament.cap){
    G.tourP++;
    const fee = Math.round(G.tournament.fee * (1 + 0.25 * lvl('emgr')) / 5000) * 5000;
    G.money += fee; G.dayStats.earned += fee; G.weekStats.earn += fee;
    floater(c.x, c.y - 62, '+ثبت‌نام ' + fmtK(fee), hexk('p'));
  }
  if(s.kind === 'print'){ G.dayStats.printRev = (G.dayStats.printRev || 0) + pay; G.runStats.printRev = (G.runStats.printRev || 0) + pay; }
  if(c.lan){ const b = Math.round(pay / 500) * 500; G.money += b; G.dayStats.earned += b; floater(c.x, c.y - 62, '+لَن‌پارتی', '#59c2ff'); }
  G.combo = Math.min(5, G.combo + 1);
  G.streak++;
  G.dayStats.maxCombo = Math.max(G.dayStats.maxCombo, G.combo);
  G.runStats.maxCombo = Math.max(G.runStats.maxCombo, G.combo);
  G.runStats.bestStreak = Math.max(G.runStats.bestStreak, G.streak);
  let fAdd = 1 + (K.fameOn || 0);
  if(c.regular) fAdd += 1;
  if(G.fame >= 85) fAdd = Math.max(0, fAdd - 1); // نزدیکِ سقف، رشدِ آرام‌تر
  G.fame = clamp(G.fame + fAdd, 0, 100);
  gainXP(s.vip ? 20 : 10);
  G.dayStats.served++; G.runStats.served++; G.weekStats.served++;
  Save.d.loyal.good = (Save.d.loyal.good || 0) + 1;
  if(c.regular && Math.random() < 0.25){ G.runStats.regulars = (G.runStats.regulars || 0) + 1; }
  if(s.kind === 'dl') G.dayStats.dlServed++;
  if(s.kind === 'print'){ G.dayStats.prints++; if(G.printerJob === i) G.printerJob = nextPrintJob(i); Sfx.print(); }
  if(s.vip){ G.dayStats.vipServed++; starBurst(c.x, c.y - 26); }
  if(c.celeb){ G.fame = clamp(G.fame + 6, 0, 100); toast('🌟 مشتریِ مشهور راضی رفت — شهرت +۶', 'amber'); }
  // امتیازِ نظرِ مشتری
  let stars = 3;
  if(c.regular || s.vip) stars++;
  if(c.patience > c.patMax * 0.5) stars++;
  else stars--;
  if(s.vipDesk) stars = Math.min(5, stars + 1);
  addReview(stars, s.kind, c.name);
  coins(c.x, c.y - 20, pay);
  c.bubble = { text: pick(['ممنون!','لِینک شد','حسابِ من','مرسی']), t: 2 };
  customerDone(c, true);
  Sfx.pay(); Sfx.happy();
  if(G.combo >= 2) Sfx.combo(G.combo);
  bumpMissions();
  if(typeof checkStory === 'function') checkStory();
}

/* ================= چای ================= */
function canTea(){ return G.teaCd <= 0; }
function serveTea(c){
  if(!c || c.state !== 'sit' || !canTea()) return false;
  const s = G.systems[c.desk];
  if(!s || s.virus || s.rebootT > 0) return false;
  G.teaCd = teaCdMax();
  const wantSnack = c.snackWish && lvl('snack') >= 1;
  const refill = c.patMax * (0.25 + 0.1 * lvl('snack')) * (wantSnack ? 1.3 : 1);
  s.patience = Math.min(c.patMax, s.patience + refill);
  const tip = Math.round(teaTip() * (wantSnack ? 1.8 : 1));
  G.money += tip; G.dayStats.tipEarned += tip;
  floater(c.x + 4, c.y - 44, '+' + fmtK(tip), '#f2c14e');
  if(wantSnack){ G.dayStats.snacks++; G.runStats.snacks++; } else { G.dayStats.teas++; G.runStats.teas++; }
  c.bubble = { text: wantSnack ? pick(SNACK_LINES) : pick(TEA_LINES), t: 2.2 };
  c.anim = 'drink'; c.animT = 2.2;
  steam(c.x + 6, c.y - 30);
  Sfx.tea();
  // کتریِ دوم: پرتشنه‌ترینِ بقیه هم‌زمان سرو می‌شود
  if(lvl('tea2') >= 1){
    let worst = null, wf = 1;
    for(let i = 0; i < MAX_SLOTS; i++){
      if(!deskOn(i)) continue;
      const o = G.systems[i];
      if(o.kind && o.person && o.person !== c && o.person.state === 'sit'){
        const f = o.patience / o.patMax;
        if(f < wf){ wf = f; worst = o.person; }
      }
    }
    if(worst && wf < 0.9){
      const os = G.systems[worst.desk];
      os.patience = Math.min(worst.patMax, os.patience + refill * 0.8);
      worst.bubble = { text: 'ممنون 🍵', t: 2 };
      G.dayStats.teas++; G.runStats.teas++;
      steam(worst.x + 6, worst.y - 30);
    }
  }
  bumpMissions();
  return true;
}
function staffServe(){
  let worst = null, wf = 0.9;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const o = G.systems[i];
    if(o.kind && o.person && o.person.state === 'sit' && !o.virus){
      const f = o.patience / o.patMax;
      if(f < wf){ wf = f; worst = o.person; }
    }
  }
  if(!worst) return;
  const s = G.systems[worst.desk];
  const wantSnack = worst.snackWish && lvl('snack') >= 1;
  s.patience = Math.min(worst.patMax, s.patience + worst.patMax * (0.2 + 0.08 * lvl('snack')));
  const tip = Math.round(teaTip() * 0.5 * (wantSnack ? 1.8 : 1));
  G.money += tip; G.dayStats.tipEarned += tip;
  floater(worst.x + 4, worst.y - 44, '+' + fmtK(tip), '#f2c14e');
  if(wantSnack){ G.dayStats.snacks++; G.runStats.snacks++; } else { G.dayStats.teas++; G.runStats.teas++; }
  worst.bubble = { text: wantSnack ? 'از کارمند 🥤' : 'دستِ کارمند درد نکنه', t: 2 };
  G.staff.bub = { txt: 'بفرما!', t: 1.4 };
  steam(worst.x + 6, worst.y - 30);
  bumpMissions();
}
function serveThirstiest(){
  let worst = null, wf = 0.85;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const o = G.systems[i];
    if(o.kind && o.person && o.person.state === 'sit' && !o.virus){
      const f = o.patience / o.patMax;
      if(f < wf){ wf = f; worst = o.person; }
    }
  }
  return worst ? serveTea(worst) : false;
}

/* ================= چاپگر ================= */
function tickPrinter(dt){
  if(G.printerJob < 0 || G.printerJob >= MAX_SLOTS || !deskOn(G.printerJob)) return;
  const s = G.systems[G.printerJob];
  if(!s.kind || s.kind !== 'print') { G.printerJob = nextPrintJob(G.printerJob); }
}

/* ================= اتفاقات ================= */
function triggerEvent(kind){
  G.activeEvent = kind;
  G.shake = kind === 'sponsor' ? 0 : 0.8;
  if(kind === 'sponsor'){
    G.flash = { color:'76,255,158', a: 0.14 };
    G.evT = 12; Sfx.sponsor();
    toast('اسپانسرِ امشب: پول ×۱٫۵ 🟢', 'amber');
    return;
  }
  G.flash = { color: kind === 'outage' ? '255,95,162' : kind === 'virus' ? '255,77,94' : '242,193,78', a: 0.18 };
  Sfx.alarm(); vibrate(50);
  if(kind === 'fest'){
    G.evT = 12;
    toast('🎪 جشنواره‌ی تخفیف — مشتریِ بیشتر، پولِ کمتر', 'amber');
  } else if(kind === 'tour'){
    G.evT = 12; G.kindForce = ['game','esports'];
    spawnCustomer();
    toast('🎮 مسابقاتِ گیمینگ — گیمرها هجوم آورده‌اند!', 'pink');
  } else if(kind === 'celeb'){
    G.evT = 4;
    const c0 = { celeb: true };
    spawnCustomer();
    const last = G.people[G.people.length - 1];
    if(last && last.type === 'cust'){ Object.assign(last, c0); last.vip = true; toast('🌟 یک چهره‌ی مشهور به کافه‌نت آمد — پول ×۳', 'amber'); }
    else G.evT = 0;
  } else if(kind === 'inspect'){
    G.evT = 0.01;
    if(G.risk >= 0.25){
      const fine = Math.min(G.money, 250000 + 100000 * (G.week - 1));
      G.money -= fine; G.dayStats.spent += fine; G.runStats.fines++;
      G.fame = clamp(G.fame - 12, 0, 100); G.risk = 0;
      toast('🧐 بازرسِ ناگهانی: جریمه‌ی ' + fmtK(fine) + ' — ریسک صفر شد', 'pink');
      G.shake = 1;
    } else { G.fame = clamp(G.fame + 2, 0, 100); toast('🧐 بازرسیِ ناگهانی: پرونده‌ات پاک بود — شهرت +۲', 'amber'); }
    G.activeEvent = null;
    return;
  } else if(kind === 'partner'){
    G.evT = 0.01;
    const offer = 600000 + 200000 * (G.week - 1);
    openModal('🤝', 'یک برندِ محلی پیشنهادِ همکاریِ تبلیغاتی داده: بنرشان روی دیوار کافه‌ات.',
      { t:'می‌پذیرم', chips:'+' + fmtK(offer) + ' · شهرت −۲', hot:true,
        fx(){ G.money += offer; G.dayStats.earned += offer; G.fame = clamp(G.fame - 2, 0, 100); } },
      { t:'رد می‌کنم', chips:'شهرت +۱', fx(){ G.fame = clamp(G.fame + 1, 0, 100); } });
    G.activeEvent = null;
    return;
  } else if(kind === 'invest'){
    G.evT = 0.01;
    const inv = 2500000 + 1000000 * Math.min(4, G.week - 1);
    openModal('💼', 'یک سرمایه‌گذار حاضر است ' + fmtK(inv) + ' بگذارد — اما سهم می‌خواهد و اعتبارِ مستقلت کم می‌شود.',
      { t:'قبول — پولِ نقد', chips:'+' + fmtK(inv) + ' · شهرت −۶', hot:true,
        fx(){ G.money += inv; G.dayStats.earned += inv; G.fame = clamp(G.fame - 6, 0, 100); } },
      { t:'مستقل می‌مانم', chips:'شهرت +۳', fx(){ G.fame = clamp(G.fame + 3, 0, 100); } });
    G.activeEvent = null;
    return;
  } else if(kind === 'breakdown'){
    G.evT = 0.01;
    const used = [];
    for(let i = 0; i < MAX_SLOTS; i++){ if(deskOn(i) && (G.systems[i].kind || i < 4)) used.push(i); }
    if(used.length){
      const i = pick(used);
      const dmg = lvl('tech') >= 1 ? 15 : 35;
      Save.d.hp[i] = clamp(sysHp(i) - dmg, 5, 100);
      toast('🔧 خرابیِ تجهیزات در میز ' + faNum(i + 1) + ' — سلامت ' + faNum(Math.round(sysHp(i))) + '٪', 'pink');
      if(sysHp(i) < 40){ G.systems[i].rebootT = rebootDur(); }
      Sfx.error();
    }
    G.activeEvent = null;
    return;
  } else if(kind === 'supplier'){
    G.evT = 0.01;
    Save.d.supplier = true;
    toast('🎁 تأمین‌کننده: خریدِ بعدیِ ارتقا ۲۰٪ ارزان‌تر!', 'amber');
    G.activeEvent = null;
    return;
  } else if(kind === 'powerSpike'){
    G.evT = 0.01;
    Save.d.powerSpike = true;
    toast('⚡ برقِ منطقه گران شده — امشب هزینه‌ی برق ×۱٫۳۵', 'pink');
    G.activeEvent = null;
    return;
  } else if(kind === 'netfault'){
    G.budget = Math.max(25, Math.round(budget() * 0.55));
    G.evT = 8;
    rescaleAllocs();
    toast('🌐 اختلالِ شبکه — پهنای باند موقتاً کم شد', 'pink');
  } else if(kind === 'outage'){
    G.budget = Math.max(30, Math.round(budget() * 0.35));
    G.evT = outageDur();
    rescaleAllocs();
  } else if(kind === 'virus'){
    const occ = [];
    for(let i = 0; i < G.slots; i++){
      const s = G.systems[i];
      if(s.kind && s.kind !== 'print' && !s.virus) occ.push(i);
    }
    if(!occ.length){ triggerEvent('outage'); return; }
    const i = pick(occ), s = G.systems[i];
    s.prevAlloc = s.alloc;
    s.virus = true; s.virusT = virusDur(); s.alloc = 20;
    rescaleAllocs();
    G.evT = virusDur();
  } else { // rush
    G.evT = 14; G.rushT = 14;
    spawnCustomer(); spawnCustomer();
  }
}
G.rushT = 0;
function endEvent(){
  const k = G.activeEvent;
  G.activeEvent = null; G.rushT = 0; G.kindForce = null;
  if(k === 'outage' || k === 'netfault') G.budget = budget();
  if(k === 'virus'){
    for(let i = 0; i < 16; i++){
      const s = G.systems[i];
      if(s.virus){ s.virus = false; s.alloc = s.prevAlloc; }
    }
  }
  rescaleAllocs();
}
function tickEvents(dt){
  if(G.activeEvent){
    G.evT -= dt;
    if(G.activeEvent === 'virus'){
      for(let i = 0; i < 16; i++){
        const s = G.systems[i];
        if(s.virus){
          s.virusT -= dt;
          if(s.virusT <= 0){ s.virus = false; s.alloc = s.prevAlloc; rescaleAllocs(); G.activeEvent = null; }
        }
      }
      for(let i = 0; i < 16; i++){
        const s = G.systems[i];
        if(s.rebootT > 0){ s.rebootT -= dt; if(s.rebootT <= 0){ Sfx.boot(); } }
      }
    }
    if(G.evT <= 0) endEvent();
  }
}
function rebootSystem(i){
  const s = G.systems[i];
  if(!s.virus || s.rebootT > 0) return;
  s.rebootT = rebootDur();
  s.virus = false; s.virusT = 0; s.alloc = 0;
  rescaleAllocs();
  Sfx.boot();
}
function sumAlloc(){ let a = 0; for(let i = 0; i < G.slots; i++) a += G.systems[i].alloc; return a; }
function setAlloc(i, v){
  const s = G.systems[i];
  if(!s.kind || s.kind === 'print' || s.virus || s.rebootT > 0) return;
  s.alloc = clamp(round5(v), 0, Math.min(100, freeBudgetExcluding(i)));
}
function rescaleAllocs(){
  let sum = sumAlloc();
  if(sum <= G.budget) return;
  const f = G.budget / sum;
  for(const s of G.systems) s.alloc = clamp(round5(s.alloc * f), 0, 100);
  let over = sumAlloc() - G.budget;
  for(const s of G.systems.slice().sort((a,b) => b.alloc - a.alloc)){
    if(over <= 0) break;
    const cut = Math.min(s.alloc, over);
    s.alloc -= cut; over -= cut;
  }
}

/* ================= دوراهی‌ها ================= */
function triggerDilemma(){
  const i = G.dIdx++;
  G.paused = true;
  const w = G.week;
  if(i === 0) openModal('💿', 'مشتری پیشنهاد می‌دهد سی‌دیِ کپیِ بازی بسوزانی — پولِ نقد، همین حالا.',
    { t:'می‌پذیرم', chips:'+' + fmtK(90000 + 30000*(w-1)) + ' · ریسکِ بازرس +۲۰٪', hot:true,
      fx(){ const a = 90000 + 30000*(w-1); G.money += a; G.dayStats.earned += a; G.risk = Math.min(1, G.risk + 0.2); } },
    { t:'نه، مغازه‌ی تمیزی دارم', chips:'شهرت +۵٪',
      fx(){ G.fame = clamp(G.fame + 5, 0, 100); } });
  else if(i === 1) openModal('🔌', 'می‌شود این‌جا فیلترشکن فروخت. درآمدِ خوب… و ریسکِ خودش.',
    { t:'می‌فروشم', chips:'+' + fmtK(120000 + 40000*(w-1)) + ' · ریسکِ بازرس +۲۵٪', hot:true,
      fx(){ const a = 120000 + 40000*(w-1); G.money += a; G.dayStats.earned += a; G.risk = Math.min(1, G.risk + 0.25); } },
    { t:'جواب منفی', chips:'شهرت +۵٪',
      fx(){ G.fame = clamp(G.fame + 5, 0, 100); } });
  else { // بازرس
    const dirty = G.risk >= 0.25;
    const bribe = 150000 + 50000*(w-1);
    const fine = 250000 + 100000*(w-1);
    openModal('🧐', dirty
        ? 'بازرسِ اتحادیه ورقِ هفته را نشان می‌دهد… چیزهایی پیدا کرده است.'
        : 'بازرسِ اتحادیه برای بازرسیِ معمولی آمده. پرونده‌ات تمیز است.',
      { t:'رشوه — ' + fmtK(bribe), chips:'همه‌چیز فراموش می‌شود · شهرت −۳', hot:true, disabled: G.money < bribe,
        fx(){ G.money -= bribe; G.dayStats.spent += bribe; G.risk = 0; G.runStats.bribes++; G.fame = clamp(G.fame - 3, 0, 100); } },
      { t:'انکار می‌کنم', chips: dirty ? 'جریمه ' + fmtK(fine) + ' · شهرت −۱۵' : 'پرونده پاک · شهرت +۳',
        fx(){
          if(dirty){
            const f = Math.min(fine, G.money);
            G.money -= f; G.dayStats.spent += f; G.runStats.fines++;
            G.fame = clamp(G.fame - 15, 0, 100);
            G.combo = 0; G.shake = 1; G.flash = { color:'255,77,94', a: 0.22 };
          } else {
            G.fame = clamp(G.fame + 3, 0, 100);
            G.missionProg.cleanInspect = 1;
            bumpMissions();
          }
        } });
  }
}
function openModal(icon, text, a, b){
  $('mIcon').textContent = icon;
  $('mText').textContent = text;
  const box = $('mBtns'); box.innerHTML = '';
  for(const o of [a, b]){
    const btn = document.createElement('button');
    btn.className = 'mopt ' + (o.hot ? 'hot' : 'cool');
    btn.innerHTML = '<b>' + o.t + '</b><span>' + o.chips + '</span>';
    btn.disabled = !!o.disabled;
    btn.onclick = () => {
      Sfx.tickS();
      hideFade('modal');
      G.paused = false;
      if(o.fx) o.fx();
      G.flash = { color: o.hot ? '255,95,162' : '76,255,158', a: 0.1 };
    };
    box.appendChild(btn);
  }
  $('modal').hidden = false;
  Sfx.quest();
}

/* ================= ماموریت‌ها ================= */
function bumpMissions(){
  for(const id of Save.d.missions){
    const m = MISSION_BY_ID[id];
    if(!m || m.daily) continue;
    const v = missionValue(m);
    if(v >= m.goal) completeMission(id);
  }
}
function missionValue(m){
  if(m.k === 'dayNoAngry') return G.dayStats.served > 0 && G.dayStats.angry === 0 ? 1 : 0;
  if(m.k === 'cleanInspect') return G.missionProg.cleanInspect || 0;
  if(m.k === 'maxCombo') return G.dayStats.maxCombo;
  return G.dayStats[m.k] || 0;
}
function completeMission(id){
  const m = MISSION_BY_ID[id];
  if(!m) return;
  G.money += m.r; G.dayStats.earned += m.r;
  gainXP(60);
  toast('✦ ' + m.t + ' — ' + fmtK(m.r), 'amber');
  Sfx.mission();
  Save.d.mDone.push(id);
  const pool = MISSIONS.filter(x => !Save.d.missions.includes(x.id) && !Save.d.mDone.includes(x.id) && (!x.req || lvl(x.req) >= 1));
  const idx = Save.d.missions.indexOf(id);
  if(pool.length) Save.d.missions[idx] = pick(pool).id;
  else Save.d.mDone = [];
  persist();
}
function checkDailyMissions(){
  for(const id of Save.d.missions.slice()){
    const m = MISSION_BY_ID[id];
    if(m && m.daily && missionValue(m) >= m.goal) completeMission(id);
  }
}

/* ================= راهِ تاج ================= */
function checkCrown(){
  if(Save.d.crowned || !crownDone()) return;
  Save.d.crowned = true;
  G.fame = 100;
  persist();
  toast('👑 راهِ تاج کامل شد!', 'amber');
  Sfx.win();
  setTimeout(() => { const c = $('crown'); if(c){ c.hidden = false; } }, 900);
}

/* ================= سطح و XP ================= */
function gainXP(n){
  G.xp += n;
  while(G.level < 10 && G.xp >= xpNext(G.level)){
    G.xp -= xpNext(G.level);
    G.level++;
    G.fame = clamp(G.fame + 3, 0, 100);
    toast('⬆ سطح ' + faNum(G.level) + ' — ' + titleFor(G.level));
    addCoins(1, 'سطحِ تازه');
    Sfx.levelup();
    if(typeof ART !== 'undefined' && ART.ok) ART.ring(WORLD_W / 2, VH / 2 - 40);
    if(window.Gfx) Gfx.levelBurst();
  }
  if(G.level >= 10) G.xp = Math.min(G.xp, xpNext(10));
  Save.d._level = G.level;
  checkAch();
}
function checkAch(){
  for(const a of ACH){
    if(Save.d.ach.includes(a.id)) continue;
    if(a.need(G.runStats)){
      Save.d.ach.push(a.id);
      G.fame = clamp(G.fame + a.fame, 0, 100);
      addCoins(3, 'دستاورد: ' + a.t);
      toast('🏆 ' + a.t + ' — شهرت +' + faNum(a.fame));
      Sfx.mission();
      persist();
    }
  }
}

/* ================= روز/هفته/شکست ================= */
function tick(dt){
  G.t += dt;
  // دوربین — نرم دنبال می‌کند
  G.cam.x += (G.cam.target - G.cam.x) * Math.min(1, dt * 4);
  G.cam.x = clamp(G.cam.x, 0, WORLD_W - VW);
  if(G.teaCd > 0) G.teaCd -= dt;
  // کارمندِ کافه — خودش سرو می‌کند
  if(lvl('staff') >= 1){
    G.staff.t -= dt;
    if(G.staff.t <= 0){
      G.staff.t = lvl('staff') === 2 ? 9 : 13;
      staffServe();
    }
    if(G.staff.bub){ G.staff.bub.t -= dt; if(G.staff.bub.t <= 0) G.staff.bub = null; }
  }
  // شمارنده‌ی پولِ متحرک
  if(G.moneyDisp !== G.money) G.moneyDisp += (G.money - G.moneyDisp) * Math.min(1, dt * 7);
  // اسپاون
  G.spawnT -= dt;
  if(G.spawnT <= 0){
    let iv = clamp(9.4 - 0.55 * G.week - 0.014 * G.fame, 4.2, 11) * spawnMul() + rnd(0, 1.4);
    if(G.rushT > 0) iv *= 0.55;
    if(G.activeEvent === 'fest') iv *= 0.8;
    if(G.activeEvent === 'tour') iv *= 0.7;
    G.spawnT = iv;
    spawnCustomer();
  }
  // اتفاقات
  if(G.evIdx < G.evSched.length && G.t >= G.evSched[G.evIdx]){
    G.evIdx++;
    triggerEvent(G.evKinds[G.evIdx - 1] || 'outage');
  }
  tickEvents(dt);
  // دوراهی
  if(G.dIdx < D_TIMES.length && G.t >= D_TIMES[G.dIdx]) triggerDilemma();
  // مشتری‌ها — همه‌ی میزهای فعال
  for(let i = 0; i < MAX_SLOTS; i++){ if(deskOn(i)) tickSystem(i, dt); }
  tickPrinter(dt);
  tickQueue(dt);
  tickPeople(dt);
  tickAmbient(dt);
  tickParticles(dt);
  if(G.t >= DAY_LEN) endDay();
}
function tickQueue(dt){
  for(const c of G.queue){
    c.patience -= 0.8 * dt * (G.activeEvent === 'outage' ? 1.7 : 1);
    if(c.patience <= 0){
      G.fame = clamp(G.fame - 4, 0, 100);
      G.queue = G.queue.filter(x => x !== c);
      G.people = G.people.filter(x => x !== c);
      G.shake = 0.5; Sfx.angry();
    }
  }
  seatFromQueue();
}
function tickPeople(dt){
  const gone = [];
  for(const c of G.people){
    if(c.type !== 'cust') continue;
    if(c.state === 'walk' || c.state === 'angry' || c.state === 'leave'){
      if(walkUpdate(c, dt)){
        if(c.onArrive === 'console') startConsPlay(c);
        else gone.push(c);
      }
    } else if(c.state === 'consPlay'){
      if(c.sitT > 0) c.sitT -= dt;
      c.bt -= dt;
      if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); c.anim = 'talk'; c.animT = 1.4; }
      c.progress += dt * (1 + 0.05 * lvl('adsl') + 0.02 * lvl('router'));
      c.patience -= dt;
      if(c.progress >= c.consNeed) completeConsole(c);
      else if(c.patience <= 0) consoleBail(c);
    } else if(c.state === 'sit'){
      if(c.sitT > 0) c.sitT -= dt;
      c.bt -= dt;
      if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); c.anim = 'talk'; c.animT = 1.4; }
    }
    if(c.bubble){ c.bubble.t -= dt; if(c.bubble.t <= 0) c.bubble = null; }
    if(c.animT > 0){ c.animT -= dt; if(c.animT <= 0) c.anim = null; }
  }
  if(gone.length) G.people = G.people.filter(p => !gone.includes(p));
}
function tickAmbient(dt){
  for(const p of G.people){
    if(p.type === 'amb'){
      p.bt -= dt;
      if(p.bt <= 0){
        const pr = pick(PAIRS);
        p.bubble = { text: pr[p.turn % 2], t: 2.6 };
        p.bt = rnd(6, 13);
        p.turn++;
      }
      if(p.bubble){ p.bubble.t -= dt; if(p.bubble.t <= 0) p.bubble = null; }
    } else if(p.type === 'bar' && Math.random() < dt * 0.25){
      steam(p.x + 14, p.y - 14, 0.5);
    }
  }
  // گشتِ نظافتچی و تکنسین — با اثرِ واقعی
  for(const w of G.people){
    if(w.type !== 'clean' && w.type !== 'tech') continue;
    if(w.bub){ w.bub.t -= dt; if(w.bub.t <= 0) w.bub = null; }
    if(w.pauseT > 0){ w.pauseT -= dt; continue; }
    const wmul = (w.type === 'clean' || w.type === 'tech') ? crewMul(w.type) : 1;
    w.x += w.dir * (w.type === 'clean' ? 22 : 40) * dt * wmul;
    w.bob += dt * 9;
    if(w.type === 'clean' && Math.random() < dt * 2.2) dust(w.x + rnd(-6, 6), w.y + 6);
    if(w.x > 700){ w.dir = -1; w.pauseT = rnd(1.2, 2.6); }
    if(w.x < 70){ w.dir = 1; w.pauseT = rnd(1.2, 2.6); }
    w.bt -= dt;
    if(w.bt <= 0){
      w.bt = rnd(9, 18);
      w.bub = { t: 2.2, text: w.type === 'clean' ? pick(['دستمال همیشه آماده‌ست','اینجا هم برق افتاد','سروِ بهداشتیِ بعدی…']) : pick(['دارم سیستم‌ها رو چک می‌کنم','دُمِ دستگاه گرم نکنه…','خنکِ کارتِ گرافیک رو دیدم']) };
    }
    if(w.type === 'tech'){
      w.fixT -= dt;
      if(w.fixT <= 0){
        // بررسیِ پیوسته: به‌محضِ رسیدنِ کنارِ خراب‌ترین میز، سرویس می‌کند
        let worst = -1, worstHp = 85;
        for(let i = 0; i < MAX_SLOTS; i++){
          if(!deskOn(i) || G.systems[i].kind) continue;
          const hpx = sysHp(i);
          if(hpx < worstHp){ worstHp = hpx; worst = i; }
        }
        if(worst >= 0 && Math.abs(deskPos(worst).x - w.x) < 110){
          Save.d.hp[worst] = clamp(sysHp(worst) + 2, 5, 100);
          w.bub = { t: 2, text: '🔧 میزِ ' + faNum(worst + 1) + ' رو سرویس کردم' };
          w.fixT = 8;
        }
      }
    }
  }
  // دودِ قلیان گوشه‌ی کافه
  if(Math.random() < dt * 0.8) smoke(285, 96);
  // گربه‌ی کافه
  const cat = G.cat;
  if(!cat.on){
    cat.t -= dt;
    if(cat.t <= 0){
      cat.on = true;
      cat.dir = Math.random() < 0.5 ? 1 : -1;
      cat.x = cat.dir > 0 ? -24 : VW + 24;
      cat.stop = 0;
    }
  } else {
    if(cat.stop > 0) cat.stop -= dt;
    else {
      cat.x += cat.dir * 24 * dt;
      if(cat.x < -30 || cat.x > VW + 30){ cat.on = false; cat.t = rnd(16, 40); }
    }
    if(cat.bub){ cat.bub.t -= dt; if(cat.bub.t <= 0) cat.bub = null; }
  }
}

/* ================= پایان روز ================= */
function endDay(){
  const ds = G.dayStats;
  G.runStats.bestDay = Math.max(G.runStats.bestDay, ds.earned);
  const st = $('sumStars');
  if(ds.angry === 0 && ds.served >= 8) st.textContent = '★★★';
  else if(ds.angry <= 1 && ds.served >= 5) st.textContent = '★★☆';
  else st.textContent = '★☆☆';
  st.hidden = false;
  if(lvl('deco')) G.fame = clamp(G.fame + 2, 0, 100);
  if(lvl('clean')) G.fame = clamp(G.fame + 0.5 * lvl('clean'), 0, 100);
  const ad = activeAd();
  if(ad && ad.fame) G.fame = clamp(G.fame + ad.fame, 0, 100);
  if(ds.angry === 0 && ds.served > 0) gainXP(30);
  // هزینه‌های واقعی مدیریت
  let pw = powerCost();
  if(Save.d.powerSpike) pw = Math.round(pw * 1.35);
  const sal = staffSalary();
  const netC = internetCost();
  const mat = (ds.teas + ds.snacks) * 12000;
  if(pw){ G.money -= pw; ds.power = pw; G.runStats.powerPaid = (G.runStats.powerPaid || 0) + pw; }
  if(sal){ G.money -= sal; ds.salary = sal; G.runStats.salariesPaid = (G.runStats.salariesPaid || 0) + sal; }
  if(netC){ G.money -= netC; ds.internet = netC; G.runStats.netPaid = (G.runStats.netPaid || 0) + netC; }
  if(mat){ G.money -= mat; ds.materials = mat; G.runStats.materialsPaid = (G.runStats.materialsPaid || 0) + mat; }
  // فرسایشِ تجهیزاتِ امروزشده + سرویسِ تکنسین
  for(let i = 0; i < G.slots; i++){
    if(ds.served > 0){
      const wear = Math.max(1, Math.round((2 + Math.round(Math.random() * 3)) * (1 - 0.15 * lvl('cooling'))));
      Save.d.hp[i] = clamp(sysHp(i) - wear, 5, 100);
    }
  }
  // تجربه‌ی کارمندان — هر شب کمی ماهرتر
  for(const sid of ['tech','clean','mgr','net','emgr']){
    if(lvl(sid) >= 1 && Save.d.staffXp) Save.d.staffXp[sid] = Math.min(40, (Save.d.staffXp[sid] || 0) + 1);
  }
  /* خستگیِ شبِ کار + روحیه */
  if(Save.d.crew && Save.d.crew.length) for(const cm of Save.d.crew){
    cm.fatigue = clamp(cm.fatigue + 12, 0, 100);
    cm.happy = clamp(cm.happy + (cm.fatigue > 80 ? -6 : 2), 10, 100);
  }
  const tl = lvl('tech');
  if(tl >= 1){
    let fixed = 0;
    const xpB = 1 + Math.min(0.3, (Save.d.staffXp.tech || 0) * 0.008);
    const tmul = crewMul('tech');
    for(let i = 0; i < MAX_SLOTS && fixed < tl; i++){
      if(!deskOn(i)) continue;
      if(sysHp(i) < 60){
        Save.d.hp[i] = clamp(sysHp(i) + Math.round((8 + 6 * tl) * xpB * tmul), 5, 100);
        const fee = 30000;
        if(G.money >= fee){ G.money -= fee; ds.spent += fee; G.runStats.repairPaid = (G.runStats.repairPaid || 0) + fee; }
        fixed++;
      }
    }
  }
  if(ds.angry > 0) G.wkNoAngry = false;
  if(ds.angry === 0 && ds.served >= 6) addCoins(2, 'روزِ بی‌نقص');
  G.runStats.revenue += ds.earned;
  if(G.lanDay && ds.served >= 5){ G.runStats.lans++; G.fame = clamp(G.fame + 3, 0, 100); toast('🎮 لَن‌پارتیِ موفق — شهرت +۳', 'pink'); }
  // تورنمنت: جلسه‌ی پایانی
  if(G.tournament){
    const T = G.tournament, parts = G.tourP || 0;
    if(parts >= 3){
      G.money -= T.prize; G.dayStats.spent += T.prize;
      const fam = T.fame + 2 * lvl('emgr');
      G.fame = clamp(G.fame + fam, 0, 100);
      G.runStats.tourneys = (G.runStats.tourneys || 0) + 1;
      gainXP(60);
      toast('🏆 ' + T.name + ' با ' + faNum(parts) + ' شرکت‌کننده تمام شد — جایزه پرداخت، شهرت +' + faNum(fam), 'amber');
      Sfx.win();
    } else {
      const back = Math.round(T.cost / 2);
      G.money += back;
      toast('🏆 ' + T.name + ' فقط ' + faNum(parts) + ' شرکت‌کننده داشت — نصفِ هزینه برگشت', 'pink');
    }
    G.tournament = null;
  }
  checkLT();
  checkCrown();
  G.risk = 0;
  if(G.money < 0) toast('⚠ موجودیِ منفی شد — با وامِ بانک یا درآمدِ فردا جبران کن', 'red');
  persist();
  G.paused = true;
  showSummary();
  return true;
}
function showSummary(){
  const ds = G.dayStats;
  $('sumIcon').textContent = ds.angry === 0 ? '🌙' : '🌘';
  $('sumTitle').textContent = 'روز ' + faNum(G.day) + ' تمام شد';
  $('sumTitle').className = ds.angry === 0 ? 'bigTitle win' : 'bigTitle';
  $('sumSub').textContent = ds.angry === 0
    ? 'روزی آرام — هیچ مشتری‌ای عصبانی نرفت.'
    : faNum(ds.angry) + ' مشتری عصبانی رفت؛ فردا بهترش کن.';
  /* شعبه‌ی دوم — درآمدِ غیرمستقیمِ امروز */
  const br = branchEarn();
  if(br > 0){ G.money += br; ds.earned += br; G.weekStats.earn += br; Save.d.branch.last = br; }
  const B = Save.d.branch;
  if(B && B.owned && !B.mgr && lvl('mgr') >= 1){ const m = crewFor('mgr'); if(m){ B.mgr = m.name; toast('🏢 ' + m.name + ' مدیرِ شعبه‌ی دوم شد', 'cyan'); } }
  const rows = [
    ['درآمد امروز', fmtK(ds.earned), 'g'],
    ['انعام چای و اسنک', fmtK(ds.tipEarned), 'a'],
    ['درآمد چاپ', fmtK(ds.printRev || 0), 'a'],
    br > 0 ? ['درآمدِ شعبه‌ی دوم', '+' + fmtK(br), 'g'] : null,
    ds.internet ? ['اینترنت', '−' + fmtK(ds.internet), 'r'] : null,
    ds.materials ? ['مواد اولیه', '−' + fmtK(ds.materials), 'r'] : null,
    ds.power ? ['هزینه‌ی برق', '−' + fmtK(ds.power), 'r'] : null,
    ds.salary ? ['حقوق کارمند', '−' + fmtK(ds.salary), 'r'] : null,
    G.lanDay ? ['لَن‌پارتیِ امشب', 'پاداشِ ×۱٫۵', 'a'] : null,
    ['مشتری‌های راضی', faNum(ds.served), ''],
    ['مشتری‌های عصبانی', faNum(ds.angry), ds.angry ? 'r' : ''],
    ['رضایتِ امروز', faNum(satisfactionPct()) + '٪', satisfactionPct() >= 70 ? 'g' : ''],
    ['بهترین کامبو', '×' + faF1(1 + 0.15 * ds.maxCombo), ''],
  ];
  $('sumRows').innerHTML = rows.filter(Boolean).map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');
  $('summary').hidden = false;
  if(typeof passAdvance === 'function') passAdvance(); // فازِ ۴ — بتل‌پسِ فصلی
  if(typeof sendScore === 'function') sendScore(); // فازِ ۵ — لیدربورد
  if(ds.angry === 0 && ds.served >= 3) Sfx.rentPaid(); else Sfx.boot();
  checkDailyMissions();
}
function nextDay(){
  if($('summary').hidden) return; // گاردِ دوبارکلیک
  hideFade('summary');
  G.paused = false;
  if(G.day >= DAYS){ showWeekend(); return; }
  G.day++;
  persist();
  startDay();
}
function renderBank(){
  const b = Save.d.bank;
  const box = $('bankBox');
  if(b.debt > 0 && b.loanId){
    const ln = loanById(b.loanId);
    const due = installmentOf(ln);
    const total = Math.round(b.debt * 1.02 / 10000) * 10000;
    box.innerHTML =
      '<div class="shopHead" style="margin-top:6px"><div class="shopTitle">🏦 بانک</div><div class="shopMoney" style="color:var(--pink)">بدهی: ' + fmtK(b.debt) + '</div></div>' +
      '<div class="row"><span>' + ln.name + ' — قسطِ ' + faNum(b.partsLeft) + ' از ' + faNum(b.parts) + '</span><b class="r">هفته‌ای ' + fmtK(due) + '</b></div>' +
      (b.late ? '<div class="row"><span>⚠ قسطِ معوق: ' + faNum(b.late) + ' بار — جریمه اعمال شد</span></div>' : '') +
      '<button class="nbtn ghost" id="btnSettle"' + (G.money >= total ? '' : ' disabled') + ' style="margin-top:6px">تسویه‌ی کامل — ' + fmtK(total) + '</button>';
    const st = $('btnSettle');
    if(st) st.onclick = () => { Sfx.tickS(); if(settleDebt()) renderBank(); };
  } else {
    box.innerHTML =
      '<div class="shopHead" style="margin-top:6px"><div class="shopTitle">🏦 بانک — وامِ توسعه</div>' +
      '<div class="shopMoney" style="color:var(--green)">بدهی نداری ✓</div></div>' +
      LOANS.map(ln => {
        const ok = G.level >= ln.req && b.debt <= 0;
        return '<div class="urow"><div class="uico">🏦</div>' +
          '<div class="ubody"><div class="uname">' + ln.name + ' — ' + fmtK(ln.amt) + '</div>' +
          '<div class="ueff">سود ' + faNum(Math.round(ln.rate * 100)) + '٪ · ' + faNum(ln.n) + ' قسطِ هفتگیِ ' + fmtK(installmentOf(ln)) + (ln.req ? ' · نیاز به سطح ' + faNum(ln.req) : '') + '</div></div>' +
          '<button class="ubuy"' + (ok ? '' : ' disabled') + '>دریافت</button></div>';
      }).join('');
    const bs = box.querySelectorAll('button.ubuy');
    LOANS.forEach((ln, i) => {
      const btn = bs[i];
      if(btn) btn.onclick = () => { Sfx.tickS(); if(takeLoan(ln.id)) renderBank(); };
    });
  }
}
function showWeekend(){
  G.scene = 'day'; // صحنه پشت مودال دیده شود
  const rent = rentFor(G.week);
  $('wkTitle').textContent = 'اجاره‌ی هفته ' + faNum(G.week);
  $('wkSub').textContent = 'مالک درِ کافه است. هفته‌ای که گذشت را باید حساب کرد.';
  $('wkRent').textContent = fmtK(rent) + ' تومان';
  $('wkHave').textContent = 'موجودی: ' + fmtK(G.money);
  const f = clamp(G.money / rent, 0, 1);
  $('wkBar').style.width = (f * 100) + '%';
  $('wkPay').disabled = G.money < rent;
  $('wkPay').textContent = G.money >= rent ? 'پرداخت — هفته‌ی بعد' : 'پول کافی نیست…';
  const ws = $('wkShop');
  if(G.money < rent){
    ws.dataset.mode = 'give';
    ws.textContent = '🔒 تسلیم — کافه بسته می‌شود';
    ws.style.color = 'var(--red)'; ws.style.borderColor = 'rgba(255,77,94,.5)';
  } else {
    ws.dataset.mode = 'shop';
    ws.textContent = 'اول کمی ارتقا بخرم';
    ws.style.color = ''; ws.style.borderColor = '';
  }
  renderBank();
  $('weekend').hidden = false;
  if(G.money >= rent) Sfx.quest(); else Sfx.lose();

}
function takeLoan(id){
  const ln = loanById(id);
  if(!ln) return false;
  const b = Save.d.bank;
  if(b.debt > 0){ toast('اول وامِ قبلی را تسویه کن', 'pink'); return false; }
  if(G.level < ln.req){ toast('برای این وام به سطح ' + faNum(ln.req) + ' نیاز داری', 'pink'); return false; }
  b.debt = ln.amt; b.apr = ln.rate; b.parts = ln.n; b.partsLeft = ln.n; b.loanId = id; b.late = 0;
  G.money += ln.amt;
  G.runStats.loansTaken = (G.runStats.loansTaken || 0) + 1;
  persist();
  toast('🏦 ' + ln.name + ' take شد — ' + fmtK(ln.amt) + ' نقد شد · قسطِ هفتگی ' + fmtK(installmentOf(ln)), 'amber');
  Sfx.loan();
  return true;
}
function bankDue(){
  const b = Save.d.bank;
  if(b.debt <= 0 || !b.loanId) return 0;
  return installmentOf(loanById(b.loanId));
}
function payInstallment(){
  const b = Save.d.bank;
  if(b.debt <= 0 || !b.loanId) return;
  const due = installmentOf(loanById(b.loanId));
  if(G.money >= due){
    G.money -= due;
    const interest = Math.round(b.debt * b.apr / Math.max(1, b.partsLeft));
    const principal = Math.max(0, due - interest);
    b.debt = Math.max(0, b.debt - principal);
    b.partsLeft--;
    G.runStats.interestPaid = (G.runStats.interestPaid || 0) + interest;
    toast('🏦 قسطِ ' + fmtK(due) + ' پرداخت شد' + (b.debt <= 0 ? ' — وام تسویه شد!' : ' · بدهی: ' + fmtK(b.debt)), 'amber');
  } else {
    const fee = Math.round(due * 0.1);
    b.debt += fee; b.late++;
    toast('⚠ قسطِ بانک معوق ماند — جریمه‌ی ' + fmtK(fee) + ' به بدهی اضافه شد', 'pink');
    Sfx.warn();
  }
  if(b.debt <= 0 || b.partsLeft <= 0){ b.debt = 0; b.partsLeft = 0; b.loanId = null; b.parts = 0; }
  persist();
}
function settleDebt(){
  const b = Save.d.bank;
  if(b.debt <= 0) return false;
  const total = Math.round(b.debt * 1.02 / 10000) * 10000;
  if(G.money < total){ toast('پولِ تسویه‌ی کامل کافی نیست — ' + fmtK(total), 'pink'); return false; }
  G.money -= total;
  G.runStats.interestPaid = (G.runStats.interestPaid || 0) + (total - b.debt);
  b.debt = 0; b.partsLeft = 0; b.parts = 0; b.loanId = null; b.late = 0;
  persist();
  toast('🏦 وام کامل تسویه شد — نفسِ راحت!', 'amber');
  Sfx.loan();
  return true;
}
/* ---------- فروش و تعمیرِ تجهیزات — فروشِ تکتکیِ میز ---------- */
function deskBaseValue(i){
  if(i >= 16) return 11250000;
  if(i >= 10){
    const hl = lvl('hall');
    if(hl >= 2) return 13300000;
    if(hl >= 1) return 5000000;
    return 0;
  }
  const t = lvl('sys');
  if(t >= 1) return [1100000,2200000,3800000,6000000,9000000,13000000][t-1];
  return 0;
}
function sellDesk(i){
  if(!deskOn(i)) return false;
  if(i < 4) return false;              // چهار میزِ پایه هرگز فروش نمی‌روند
  const s = G.systems[i];
  if(s && s.kind) return false;        // مشتریِ روی میز = ممنوع
  const base = deskBaseValue(i);
  if(base <= 0) return false;
  const val = Math.max(50000, Math.round(base * 0.45 * sysHp(i) / 100 / 50000) * 50000);
  Save.d.deskOff[i] = 1;
  G.money += val;
  G.slots = cafeCapacity();
  persist();
  checkAch();
  toast('🏷 فقط میزِ ' + faNum(i + 1) + ' فروخته شد — ' + fmtK(val) + ' · ظرفیت: ' + faNum(G.slots), 'amber');
  Sfx.coin();
  return true;
}
function rebuyCost(i){
  const base = deskBaseValue(i);
  if(base <= 0) return 0;
  return Math.round(base * 0.6 / 50000) * 50000;
}
function rebuyDesk(i){
  if(deskOn(i) || i < 4) return false;
  const cost = rebuyCost(i);
  if(cost <= 0) return false;
  let payC = cost;
  if(Save.d.supplier) payC = Math.round(cost * 0.8 / 50000) * 50000; // تخفیف فقط اگر خرید برسد مصرف می‌شود
  if(G.money < payC){ toast('قیمتِ میزِ تازه: ' + fmtK(payC), 'pink'); return false; }
  if(Save.d.supplier){
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد — ' + fmtK(cost - payC) + ' صرفه‌جویی', 'amber');
  }
  G.money -= payC; G.dayStats.spent += payC;
  delete Save.d.deskOff[i];
  if(!Save.d.hp) Save.d.hp = [];
  Save.d.hp[i] = 85; // دستِ دومِ سرویس‌شده
  G.slots = cafeCapacity();
  persist();
  toast('🖥 میزِ ' + faNum(i + 1) + ' دوباره نصب شد — ' + fmtK(cost) + ' · ظرفیت: ' + faNum(G.slots), 'amber');
  Sfx.buy();
  return true;
}
function repairDesk(i){
  const cost = repairCost(i);
  if(sysHp(i) >= 100) return false;
  if(G.money < cost){ toast('پولِ تعمیر کافی نیست — ' + fmtK(cost), 'pink'); return false; }
  G.money -= cost; G.dayStats.spent += cost;
  G.runStats.repairPaid = (G.runStats.repairPaid || 0) + cost;
  Save.d.hp[i] = 100;
  G.systems[i].rebootT = Math.min(G.systems[i].rebootT, 0.1);
  persist();
  toast('🔧 میز ' + faNum(i + 1) + ' تعمیر شد — ' + fmtK(cost), 'amber');
  Sfx.boot();
  return true;
}
function payRent(){
  const rent = rentFor(G.week);
  if(G.money < rent) return;
  if(payRent._busy) return;
  payRent._busy = true;
  setTimeout(() => { payRent._busy = false; }, 400);
  G.money -= rent;
  G.runStats.weeksPaid++;
  G.runStats.rentTotal = (G.runStats.rentTotal || 0) + rent;
  // حقوقِ هفتگیِ کارمندانِ تازه
  let ws = 0;
  for(const sid of ['tech','clean','mgr','net','emgr']) ws += staffWeekly(sid, lvl(sid));
  if(ws > 0){
    if(G.money >= ws){
      G.money -= ws;
      G.runStats.salariesPaid = (G.runStats.salariesPaid || 0) + ws;
      toast('🧍 حقوقِ هفتگیِ کارمندان: −' + fmtK(ws), 'amber');
    } else {
      G.fame = clamp(G.fame - 2, 0, 100);
      toast('⚠ پولِ حقوقِ کارمندان کم بود — نارضایتی! شهرت −۲', 'pink');
    }
  }
  // نگهداریِ تجهیزات
  const maint = Math.round(equipValue() * 0.015 / 10000) * 10000;
  if(maint > 0 && G.money >= maint){
    G.money -= maint;
    G.runStats.maintPaid = (G.runStats.maintPaid || 0) + maint;
    toast('🔧 هزینه‌ی نگهداریِ هفتگی: −' + fmtK(maint), 'amber');
  }
  // مالیاتِ سود (از هفته‌ی چهارم)
  if(G.week >= 4){
    const profit = (G.weekStats.earn || 0) - rent - ws - maint;
    if(profit > 2000000){
      const tax = Math.round(profit * 0.08 / 10000) * 10000;
      if(G.money >= tax){
        G.money -= tax;
        G.runStats.taxPaid = (G.runStats.taxPaid || 0) + tax;
        toast('🧾 مالیاتِ سودِ هفته: −' + fmtK(tax), 'amber');
      }
    }
  }
  // قسطِ بانک
  payInstallment();
  persist();
  hideFade('weekend');
  toast('🏠 اجاره‌ی هفته ' + faNum(G.week) + ' پرداخت شد — کافه زنده است!');
  Sfx.rentPaid();
  if(G.wkNoAngry) addCoins(4, 'هفته‌ی بی‌نقص');
  G.wkNoAngry = true;
  // رقبای هوشمند: اقتصادِ واقعی — درآمد، هزینه، تصمیمِ هفتگی
  tickRivals();
  // اثرِ نظرات روی شهرت
  const ra = reviewAvg();
  if(Save.d.reviews.length >= 3 && Math.abs(ra - 3.4) > 0.4){
    G.fame = clamp(G.fame + (ra > 3.4 ? 2 : -2), 0, 100);
  }
  // تبلیغِ فعال
  if(Save.d.ads){
    Save.d.ads.left--;
    if(Save.d.ads.left <= 0){ Save.d.ads = null; toast('📣 کمپینِ تبلیغات تمام شد'); }
  }
  // ماموریتِ هفتگی
  checkWeeklyMissions();
  // نمودارِ روند
  const net = (G.weekStats.earn || 0) - rent;
  Save.d.weekHist.push(Math.round(net));
  if(Save.d.weekHist.length > 10) Save.d.weekHist.shift();
  G.weekStats = { earn: 0, served: 0, angry: 0 };
  G.week++; G.day = 1;
  persist();
  checkAch();
  checkLT();
  startDay();
}
/* هوشِ اقتصادیِ رقبا — هفته‌ای یک تصمیمِ واقعی */
function tickRivals(){
  for(const r of RIVALS){
    const st = rivalState(r.id);
    if(!st.alive) continue;
    // اقتصادِ رقیب: درآمدِ تقریبی از تجهیزات × سرعت × قیمت
    const income = st.eq * r.speed * st.price * 1200000;
    const costs = 500000 + st.eq * 280000 + (st.ad ? 1500000 : 0);
    st.cash = Math.max(-2000000, st.cash + income - costs);
    if(st.ad > 0) st.ad--;
    if(st.cash < 0){ st.fame = Math.max(0, st.fame - 3); if(st.eq > 1) st.eq--; }
    else if(st.cash > 2500000){
      if(st.strat === 'value' && Math.random() < 0.6){
        st.price = Math.max(0.7, st.price - 0.05);
        st.fame = Math.min(100, st.fame + 2);
        toast('📉 ' + r.name + ' قیمت‌هایش را پایین آورد (×' + faF1(st.price) + ')', 'pink');
      } else if(st.strat === 'premium' && Math.random() < 0.55){
        st.eq = Math.min(9, st.eq + 1);
        st.price = Math.min(1.5, st.price + 0.03);
        st.fame = Math.min(100, st.fame + 2);
        toast('📈 ' + r.name + ' تجهیزاتِ تازه خرید (تجهیز ' + faNum(st.eq) + ')', 'pink');
      } else if(st.strat === 'growth' && Math.random() < 0.6){
        st.cash -= 1500000;
        st.ad = 2;
        st.fame = Math.min(100, st.fame + 3);
        toast('📣 ' + r.name + ' تبلیغاتِ سنگین راه انداخت — شهرتشان +۳', 'pink');
      } else {
        st.fame = Math.min(100, st.fame + 1.2 * r.speed);
      }
    } else {
      st.fame = Math.min(100, st.fame + 0.8 * r.speed);
    }
    // ورشکستگی
    if(st.fame < 10 && st.cash < -1500000){
      st.alive = false;
      toast('🏠 ' + r.name + ' تعطیل شد — مشتری‌هایش به کافه‌ی تو رسیدند!', 'amber');
      G.fame = clamp(G.fame + 4, 0, 100);
      Sfx.win();
    }
  }
}
function checkWeeklyMissions(){
  const ws = G.weekStats || { earn: 0, served: 0 };
  for(const m of MISSIONS_W){
    if(Save.d.mWDone.includes(m.id)) continue;
    let v = 0;
    if(m.k === 'weekEarn') v = ws.earn;
    else if(m.k === 'weekSat') v = satisfactionPct();
    else if(m.k === 'weekRival') v = beatRival(m.comp) ? 1 : 0;
    else if(m.k === 'weekStaff') v = lvl('tech') + lvl('clean') + lvl('mgr');
    else if(m.k === 'weekServed') v = ws.served;
    if(v >= m.goal){
      G.money += m.r; G.dayStats.earned += m.r;
      gainXP(50);
      Save.d.mWDone.push(m.id);
      toast('📅 ماموریتِ هفتگی: ' + m.t + ' — ' + fmtK(m.r), 'amber');
      Sfx.mission();
    }
  }
}
function giveUp(){
  hideFade('weekend');
  gameOver();
}
function gameOver(){
  G.scene = 'over';
  $('cornerL').hidden = true;
  const s = G.runStats;
  $('goTitle').textContent = 'کافه بسته شد';
  $('goSub').textContent = 'اجاره ماند روی میز و مالک کلید را پس گرفت. اما کافه‌ی نو، راهش را بلد است.';
  const rows = [
    ['هفته‌های پرداخت‌شده', faNum(s.weeksPaid), 'g'],
    ['موجودی آخر', fmtK(G.money), 'r'],
    ['مشتری‌های راضی', faNum(s.served), ''],
    ['بهترین روز', fmtK(s.bestDay), 'a'],
    ['سطح کافه', faNum(G.level) + ' — ' + titleFor(G.level), ''],
    ['دستاورد', faNum(Save.d.ach.length) + ' / ' + faNum(ACH.length), ''],
  ];
  $('goRows').innerHTML = rows.map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');
  $('goLegacy').textContent = 'کافه‌ی نو با +' + faF1(legacyPct() * 100) + '٪ درآمد شروع می‌کند (' +
    faNum(s.weeksPaid) + ' اجاره‌ی پرداخت‌شده). ارتقاها، سطح، دستاورد و شهرت می‌مانند؛ فقط هفته از نو شمرده می‌شود.';
  $('gameover').hidden = false;
  Save.d.money = G.money; Save.d.week = G.week; Save.d.day = G.day; Save.save();
  Sfx.lose();
}
function restartWithLegacy(){
  hideFade('gameover');
  newGame(true);
}
</script>
