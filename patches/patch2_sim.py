# -*- coding: utf-8 -*-
# پچ ۲ — شبیه‌سازی: باگ میزها + اقتصاد کامل + بانک + رقبا + سلامت + وفاداری + رویدادها
import io
p = io.open('p3_sim.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) ظرفیتِ مرکزی در شروعِ روز ----------
rep("  G.slots = 4 + lvl('sys') + 3 * lvl('hall');\n  G.systems = [];",
    "  G.slots = cafeCapacity();\n  G.systems = [];")

# آمارهای تازه‌ی روز + ماموریت هفتگی + رویدادهای تازه در برنامه
rep("""  G.dayStats = { earned:0, served:0, angry:0, teas:0, tipEarned:0, prints:0, maxCombo:0, dlServed:0, vipServed:0, spent:0 };
  G.missionProg = {};""",
"""  G.dayStats = { earned:0, served:0, angry:0, teas:0, tipEarned:0, prints:0, maxCombo:0, dlServed:0, vipServed:0, spent:0,
    power:0, salary:0, internet:0, materials:0, printRev:0, servedBreak:0 };
  G.missionProg = {};
  G.weekStats = G.weekStats || { earn:0, served:0, angry:0 };
  G.kindForce = null;
  // سلامتِ تجهیزات — آرایه‌ی پایدار
  if(!Array.isArray(Save.d.hp) || Save.d.hp.length !== MAX_SLOTS){
    Save.d.hp = []; for(let i = 0; i < MAX_SLOTS; i++) Save.d.hp.push(100);
  }""")

rep("""  const pool = ['outage','virus','rush'].sort(() => Math.random() - 0.5);
  G.evKinds = [];
  for(let i = 0; i < G.evSched.length; i++){
    let k = pool[i % 3];
    if(G.week >= 2 && Math.random() < 0.2) k = 'sponsor';
    G.evKinds.push(k);
  }""",
"""  const pool = G.week >= 3
    ? ['outage','virus','rush','fest','tour','celeb','inspect','partner','invest','breakdown']
    : ['outage','virus','rush','fest','breakdown'];
  G.evKinds = [];
  for(let i = 0; i < G.evSched.length; i++){
    let k = pool[Math.floor(Math.random() * pool.length)];
    if(G.week >= 2 && Math.random() < 0.18) k = 'sponsor';
    if(i === 0) k = pool[Math.floor(Math.random() * Math.min(4, pool.length))]; // اولِ روز ملایم‌تر
    G.evKinds.push(k);
  }""")

# ---------- ۲) اسپاونِ مشتری: انواعِ تازه + وفادار ----------
rep("""function pickKind(){
  let sum = 0; for(const k of KIND_KEYS) sum += KINDS[k].w;
  let r = Math.random() * sum;
  for(const k of KIND_KEYS){ r -= KINDS[k].w; if(r <= 0) return k; }
  return 'dl';
}""",
"""function pickKind(){
  if(G.kindForce){ const ks = KIND_KEYS.filter(k => G.kindForce.includes(k)); if(ks.length) return pick(ks); }
  let sum = 0; for(const k of KIND_KEYS) sum += KINDS[k].w;
  let r = Math.random() * sum;
  for(const k of KIND_KEYS){ r -= KINDS[k].w; if(r <= 0) return k; }
  return 'dl';
}""")

rep("""    vip: lvl('vip') >= 1 && Math.random() < 0.1,
    snackWish: lvl('snack') >= 1 && Math.random() < 0.35,
    lan: G.lanDay,
  };
  c.patMax = c.patience;
  if(c.vip){ c.patience *= 1.25; c.patMax = c.patience; }
  if(c.lan && c.kind !== 'print') c.need = Math.max(5, Math.round(c.need * 1.25));""",
"""    vip: lvl('vip') >= 1 && Math.random() < 0.1,
    snackWish: lvl('snack') >= 1 && Math.random() < 0.35,
    lan: G.lanDay,
  };
  // شخصیت‌های تازه
  const K2 = KINDS[kind];
  c.regular = Math.random() < loyalChance();
  if(c.regular) c.patience *= 1.2;
  if(K2.printChance && Math.random() < K2.printChance && lvl('printer') >= 1){
    c.kind = 'print'; c.need = 0;
  }
  if(K2.virusChance){ c.troubleMaker = true; }
  c.patMax = c.patience;
  if(c.vip){ c.patience *= 1.25; c.patMax = c.patience; }
  if(c.lan && c.kind !== 'print') c.need = Math.max(5, Math.round(c.need * 1.25));""")

# ---------- ۳) نشستن: دردسرساز + چاپِ دانشجو ----------
rep("""  if(c.kind === 'print'){ s.alloc = 0; s.disp = 0; }
  else s.alloc = Math.min(s.alloc, freeBudgetExcluding(i));
  G.queue = G.queue.filter(q => q !== c);
  if(G.printerJob < 0 && c.kind === 'print') G.printerJob = i;
  Sfx.tickS();
}""",
"""  if(c.kind === 'print'){ s.alloc = 0; s.disp = 0; }
  else s.alloc = Math.min(s.alloc, freeBudgetExcluding(i));
  G.queue = G.queue.filter(q => q !== c);
  if(G.printerJob < 0 && c.kind === 'print') G.printerJob = i;
  // دردسرساز: ممکن است همان اول ویروسِ پخش کند
  if(c.troubleMaker && Math.random() < (KINDS.trouble.virusChance || 0.3) && lvl('antivirus') < 2){
    const targets = [];
    for(let j = 0; j < G.slots; j++){ const o = G.systems[j]; if(o.kind && o.kind !== 'print' && !o.virus) targets.push(j); }
    if(targets.length){
      const j = pick(targets), os = G.systems[j];
      os.prevAlloc = os.alloc; os.virus = true; os.virusT = virusDur(); os.alloc = 20;
      if(!G.activeEvent){ G.activeEvent = 'virus'; G.evT = virusDur(); }
      rescaleAllocs();
      toast('⚠ یک مشتریِ دردسرساز ویروس پخش کرد!', 'pink');
    }
  }
  Sfx.tickS();
}""")

# ---------- ۴) تیکِ میز: سلامت + شخصیت‌ها ----------
rep("""  const K = KINDS[s.kind];
  const eff = s.rebootT > 0 ? 0 : s.alloc;
  const served = s.kind !== 'print' && eff >= s.need;
  // صبر
  let drain;
  if(s.kind === 'print') drain = (G.printerJob === i) ? 0.45 : 0.7;
  else drain = served ? 0.25 : 1.0;
  if(G.activeEvent === 'outage') drain += 0.8;
  if(s.vip) drain *= 0.8;
  s.patience -= drain * dt;
  // پیشرفت
  if(s.kind === 'print'){
    if(G.printerJob === i && s.rebootT <= 0) s.progress += PRINT_RATE * printMul() * dt;
  } else {
    const pm = (s.kind === 'dl' || s.kind === 'game') ? progMul() : 1;
    s.progress += (eff / Math.max(1, s.need)) / K.dur * pm * dt;
  }
  s.progress = clamp(s.progress, 0, 1);
  if(s.progress >= 1){ completeCustomer(i); return; }
  if(s.patience <= 0) customerDone(c, false);
}""",
"""  const K = KINDS[s.kind];
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
  // پیشرفت — سلامتِ تجهیزات اثر واقعی دارد
  const hpF = hpMul(i);
  if(s.kind === 'print'){
    if(G.printerJob === i && s.rebootT <= 0) s.progress += PRINT_RATE * printMul() * hpF * dt;
  } else {
    const pm = (s.vis === 'dl' || s.vis === 'game' || s.kind === 'dl' || s.kind === 'game') ? progMul() : 1;
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
}""")

# ---------- ۵) تکمیلِ سرویس: پولِ شخصیت‌ها + وفاداری ----------
rep("""function completeCustomer(i){
  const s = G.systems[i], c = s.person;
  const K = KINDS[s.kind];
  const comboMul = 1 + 0.15 * G.combo;
  let pay = K.pay * payMul() * comboMul;
  if(s.vip) pay *= 2;
  if(G.activeEvent === 'sponsor') pay *= 1.5;
  pay = Math.round(pay / 500) * 500;
  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  if(c.lan){ const b = Math.round(pay / 500) * 500; G.money += b; G.dayStats.earned += b; floater(c.x, c.y - 62, '+لَن‌پارتی', '#59c2ff'); }
  G.combo = Math.min(5, G.combo + 1);
  G.streak++;
  G.dayStats.maxCombo = Math.max(G.dayStats.maxCombo, G.combo);
  G.runStats.maxCombo = Math.max(G.runStats.maxCombo, G.combo);
  G.runStats.bestStreak = Math.max(G.runStats.bestStreak, G.streak);
  G.fame = clamp(G.fame + 2, 0, 100);
  gainXP(s.vip ? 20 : 10);
  G.dayStats.served++; G.runStats.served++;
  if(s.kind === 'dl') G.dayStats.dlServed++;
  if(s.kind === 'print'){ G.dayStats.prints++; if(G.printerJob === i) G.printerJob = nextPrintJob(i); }
  if(s.vip){ G.dayStats.vipServed++; starBurst(c.x, c.y - 26); }
  coins(c.x, c.y - 20, pay);
  c.bubble = { text: pick(['ممنون!','لِینک شد','حسابِ من','مرسی']), t: 2 };
  customerDone(c, true);
  Sfx.pay();
  if(G.combo >= 2) Sfx.combo(G.combo);
  bumpMissions();
}""",
"""function completeCustomer(i){
  const s = G.systems[i], c = s.person;
  const K = KINDS[s.kind];
  const comboMul = 1 + 0.15 * (G.combo + lvl('mgr'));
  let pay = K.pay * payMul() * comboMul * (K.payMulC || 1);
  if(s.vip) pay *= 2;
  if(G.activeEvent === 'sponsor') pay *= 1.5;
  if(G.activeEvent === 'fest') pay *= 0.85;
  if(G.activeEvent === 'tour' && (s.kind === 'game' || s.kind === 'esports')) pay *= 1.3;
  if(c.celeb) pay *= 3;
  if(c.regular) pay *= 1.25;
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
  if(s.kind === 'print'){ G.dayStats.printRev = (G.dayStats.printRev || 0) + pay; G.runStats.printRev = (G.runStats.printRev || 0) + pay; }
  if(c.lan){ const b = Math.round(pay / 500) * 500; G.money += b; G.dayStats.earned += b; floater(c.x, c.y - 62, '+لَن‌پارتی', '#59c2ff'); }
  G.combo = Math.min(5, G.combo + 1);
  G.streak++;
  G.dayStats.maxCombo = Math.max(G.dayStats.maxCombo, G.combo);
  G.runStats.maxCombo = Math.max(G.runStats.maxCombo, G.combo);
  G.runStats.bestStreak = Math.max(G.runStats.bestStreak, G.streak);
  let fAdd = 2 + (K.fameOn || 0);
  if(c.regular) fAdd += 2;
  G.fame = clamp(G.fame + fAdd, 0, 100);
  gainXP(s.vip ? 20 : 10);
  G.dayStats.served++; G.runStats.served++; G.weekStats.served++;
  Save.d.loyal.good = (Save.d.loyal.good || 0) + 1;
  if(c.regular && Math.random() < 0.25){ G.runStats.regulars = (G.runStats.regulars || 0) + 1; }
  if(s.kind === 'dl') G.dayStats.dlServed++;
  if(s.kind === 'print'){ G.dayStats.prints++; if(G.printerJob === i) G.printerJob = nextPrintJob(i); Sfx.print(); }
  if(s.vip){ G.dayStats.vipServed++; starBurst(c.x, c.y - 26); }
  if(c.celeb){ G.fame = clamp(G.fame + 6, 0, 100); toast('🌟 مشتریِ مشهور راضی رفت — شهرت +۶', 'amber'); }
  coins(c.x, c.y - 20, pay);
  c.bubble = { text: pick(['ممنون!','لِینک شد','حسابِ من','مرسی']), t: 2 };
  customerDone(c, true);
  Sfx.pay(); Sfx.happy();
  if(G.combo >= 2) Sfx.combo(G.combo);
  bumpMissions();
}""")

# ---------- ۶) عصبانیت: شخصیت‌ها + وفاداریِ منفی ----------
rep("""  if(!happy){
    G.fame = clamp(G.fame - (lvl('deco') ? 6 : 8), 0, 100);
    G.combo = 0; G.streak = 0;
    G.dayStats.angry++; G.runStats.angry++;
    G.shake = 1; G.flash = { color:'255,77,94', a: 0.16 };
    puff(c.x, c.y, '#ff4d5e');
    Sfx.angry(); vibrate(40);
  }""",
"""  if(!happy){
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
    Sfx.angry(); vibrate(40);
  }""")

# ---------- ۷) باگِ حلقه‌ها: همه‌ی میزها ----------
rep("""function sumAlloc(){ let a = 0; for(let i = 0; i < 10; i++) a += G.systems[i].alloc; return a; }""",
"""function sumAlloc(){ let a = 0; for(let i = 0; i < G.slots; i++) a += G.systems[i].alloc; return a; }""")
rep("""function tickPrinter(dt){
  if(G.printerJob < 0 || G.printerJob >= 10) return;
  const s = G.systems[G.printerJob];
  if(!s.kind || s.kind !== 'print') { G.printerJob = nextPrintJob(G.printerJob); }
}""",
"""function tickPrinter(dt){
  if(G.printerJob < 0 || G.printerJob >= G.slots) return;
  const s = G.systems[G.printerJob];
  if(!s.kind || s.kind !== 'print') { G.printerJob = nextPrintJob(G.printerJob); }
}""")
rep("""  // مشتری‌ها
  for(let i = 0; i < 10; i++) tickSystem(i, dt);""",
"""  // مشتری‌ها — همه‌ی میزهای فعال
  for(let i = 0; i < G.slots; i++) tickSystem(i, dt);""")

# ---------- ۸) اسپاونِ با تبلیغ/رقبای فشرده ----------
rep("""    let iv = clamp(9.4 - 0.55 * G.week - 0.014 * G.fame, 4.2, 11) * spawnMul() + rnd(0, 1.4);
    if(G.rushT > 0) iv *= 0.55;""",
"""    let iv = clamp(9.4 - 0.55 * G.week - 0.014 * G.fame, 4.2, 11) * spawnMul() + rnd(0, 1.4);
    if(G.rushT > 0) iv *= 0.55;
    if(G.activeEvent === 'fest') iv *= 0.8;
    if(G.activeEvent === 'tour') iv *= 0.7;""")

# ---------- ۹) رویدادهای تازه ----------
rep("""  if(kind === 'outage'){
    G.budget = Math.max(30, Math.round(budget() * 0.35));
    G.evT = outageDur();
    rescaleAllocs();
  } else if(kind === 'virus'){""",
"""  if(kind === 'fest'){
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
    for(let i = 0; i < G.slots; i++){ if(G.systems[i].kind || i < 4) used.push(i); }
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
  } else if(kind === 'outage'){
    G.budget = Math.max(30, Math.round(budget() * 0.35));
    G.evT = outageDur();
    rescaleAllocs();
  } else if(kind === 'virus'){""")

rep("""function endEvent(){
  const k = G.activeEvent;
  G.activeEvent = null; G.rushT = 0;""",
"""function endEvent(){
  const k = G.activeEvent;
  G.activeEvent = null; G.rushT = 0; G.kindForce = null;""")

# ---------- ۱۰) پایانِ روز: هزینه‌های کامل + فرسایش + تکنسین ----------
rep("""  if(lvl('deco')) G.fame = clamp(G.fame + 2, 0, 100);
  if(ds.angry === 0 && ds.served > 0) gainXP(30);
  // هزینه‌های واقعی مدیریت: برق و حقوق
  const pw = powerCost(), sal = staffSalary();
  if(pw){ G.money -= pw; ds.power = pw; }
  if(sal){ G.money -= sal; ds.salary = sal; }""",
"""  if(lvl('deco')) G.fame = clamp(G.fame + 2, 0, 100);
  if(lvl('clean')) G.fame = clamp(G.fame + 0.5 * lvl('clean'), 0, 100);
  const ad = activeAd();
  if(ad && ad.fame) G.fame = clamp(G.fame + ad.fame, 0, 100);
  if(ds.angry === 0 && ds.served > 0) gainXP(30);
  // هزینه‌های واقعی مدیریت
  const pw = powerCost(), sal = staffSalary();
  const netC = internetCost();
  const mat = (ds.teas + ds.snacks) * 12000;
  if(pw){ G.money -= pw; ds.power = pw; G.runStats.powerPaid = (G.runStats.powerPaid || 0) + pw; }
  if(sal){ G.money -= sal; ds.salary = sal; G.runStats.salariesPaid = (G.runStats.salariesPaid || 0) + sal; }
  if(netC){ G.money -= netC; ds.internet = netC; G.runStats.netPaid = (G.runStats.netPaid || 0) + netC; }
  if(mat){ G.money -= mat; ds.materials = mat; G.runStats.materialsPaid = (G.runStats.materialsPaid || 0) + mat; }
  // فرسایشِ تجهیزاتِ امروزشده + سرویسِ تکنسین
  for(let i = 0; i < G.slots; i++){
    if(ds.served > 0) Save.d.hp[i] = clamp(sysHp(i) - (2 + Math.round(Math.random() * 3)), 5, 100);
  }
  const tl = lvl('tech');
  if(tl >= 1){
    let fixed = 0;
    for(let i = 0; i < G.slots && fixed < tl; i++){
      if(sysHp(i) < 60){
        Save.d.hp[i] = clamp(sysHp(i) + 8 + 6 * tl, 5, 100);
        const fee = 30000;
        if(G.money >= fee){ G.money -= fee; ds.spent += fee; G.runStats.repairPaid = (G.runStats.repairPaid || 0) + fee; }
        fixed++;
      }
    }
  }""")

# ---------- ۱۱) گزارشِ مالیِ روز ----------
rep("""  const rows = [
    ['درآمد امروز', fmtK(ds.earned), 'g'],
    ['انعام چای', fmtK(ds.tipEarned), 'a'],
    ds.power ? ['هزینه‌ی برق', '−' + fmtK(ds.power), 'r'] : null,
    ds.salary ? ['حقوق کارمند', '−' + fmtK(ds.salary), 'r'] : null,
    G.lanDay ? ['لَن‌پارتیِ امشب', 'پاداشِ ×۱٫۵', 'a'] : null,
    ['مشتری‌های راضی', faNum(ds.served), ''],
    ['مشتری‌های عصبانی', faNum(ds.angry), ds.angry ? 'r' : ''],
    ['بهترین کامبو', '×' + faF1(1 + 0.15 * ds.maxCombo), ''],
  ];""",
"""  const rows = [
    ['درآمد امروز', fmtK(ds.earned), 'g'],
    ['انعام چای و اسنک', fmtK(ds.tipEarned), 'a'],
    ['درآمد چاپ', fmtK(ds.printRev || 0), 'a'],
    ds.internet ? ['اینترنت', '−' + fmtK(ds.internet), 'r'] : null,
    ds.materials ? ['مواد اولیه', '−' + fmtK(ds.materials), 'r'] : null,
    ds.power ? ['هزینه‌ی برق', '−' + fmtK(ds.power), 'r'] : null,
    ds.salary ? ['حقوق کارمند', '−' + fmtK(ds.salary), 'r'] : null,
    G.lanDay ? ['لَن‌پارتیِ امشب', 'پاداشِ ×۱٫۵', 'a'] : null,
    ['مشتری‌های راضی', faNum(ds.served), ''],
    ['مشتری‌های عصبانی', faNum(ds.angry), ds.angry ? 'r' : ''],
    ['رضایتِ امروز', faNum(satisfactionPct()) + '٪', satisfactionPct() >= 70 ? 'g' : ''],
    ['بهترین کامبو', '×' + faF1(1 + 0.15 * ds.maxCombo), ''],
  ];""")

# ---------- ۱۲) بانک: وام، قسط، تسویه ----------
rep("""function payRent(){
  const rent = rentFor(G.week);
  if(G.money < rent) return;
  G.money -= rent;
  G.runStats.weeksPaid++;""",
"""function takeLoan(id){
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
/* ---------- فروش و تعمیرِ تجهیزات ---------- */
function sellDesk(i){
  if(i < 4 || i >= G.slots) return false;
  const s = G.systems[i];
  if(s.kind) return false;
  let tier = lvl('sys'), hallL = lvl('hall');
  if(i >= 10){
    if(hallL <= 0) return false;
    const base = 15000000;
    const val = Math.round(base * 0.5 * sysHp(i) / 100 / 50000) * 50000;
    Save.d.up.hall = hallL - 1;
    G.money += val;
  } else {
    if(tier <= 0) return false;
    const base = [1100000, 2200000, 3800000, 6000000, 9000000, 13000000][tier - 1];
    const val = Math.round(base * 0.45 * sysHp(i) / 100 / 50000) * 50000;
    Save.d.up.sys = tier - 1;
    G.money += val;
  }
  G.slots = cafeCapacity();
  G.dayStats.spent += 0;
  persist();
  toast('🏷 تجهیزات فروخته شد — ' + fmtK(val) + ' · ظرفیت: ' + faNum(G.slots) + ' میز', 'amber');
  Sfx.coin();
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
  G.money -= rent;
  G.runStats.weeksPaid++;
  G.runStats.rentTotal = (G.runStats.rentTotal || 0) + rent;
  // قسطِ بانک
  payInstallment();""")

# ماموریت هفتگی + رقبای هوشمند + تبلیغ در پرداختِ اجاره
rep("""  if(G.wkNoAngry) addCoins(4, 'هفته‌ی بی‌نقص');
  G.wkNoAngry = true;
  G.week++; G.day = 1;
  persist();
  checkAch();
  startDay();
}""",
"""  if(G.wkNoAngry) addCoins(4, 'هفته‌ی بی‌نقص');
  G.wkNoAngry = true;
  // رقبای هوشمند: هفته‌ای یک قدم جلو — اما نه بی‌نهایت
  for(const r of RIVALS){
    const cur = rivalFame(r.id);
    const grow = r.speed * (0.8 + Math.random() * 0.5) + (Save.d.stats.weeksPaid || 0) * 0.05;
    Save.d.rivalFame[r.id] = Math.min(100, cur + grow * 0.8);
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
  startDay();
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
}""")

io.open('p3_sim.js', 'w', encoding='utf-8').write(p)
print('patch2 sim OK')
