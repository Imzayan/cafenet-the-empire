# -*- coding: utf-8 -*-
# پچ ۸ — شبیه‌سازی: میزِ تکی + VIP ×۱٫۴ + تورنمنت + رقبا + نظرات + مالیات/حقوق هفتگی + رویدادهای تازه
import io
p = io.open('p3_sim.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) چیدمان: سالن VIP ----------
rep("""function deskPos(i){
  if(i >= 10){ const j = i - 10; return { x: 404 + 64 * (j % 3), y: 168 + 124 * Math.floor(j / 3) }; }
  const row = Math.floor(i / 5), col = i % 5;
  return { x: 44 + 62 * col, y: 168 + 124 * row };
}""",
"""function deskPos(i){
  if(i >= 16){ const j = i - 16; return { x: 700 + 80 * (j % 2), y: 168 + 124 * Math.floor(j / 2) }; }
  if(i >= 10){ const j = i - 10; return { x: 404 + 64 * (j % 3), y: 168 + 124 * Math.floor(j / 3) }; }
  const row = Math.floor(i / 5), col = i % 5;
  return { x: 44 + 62 * col, y: 168 + 124 * row };
}""")

# ---------- ۲) حلقه‌ها: همه‌ی میزهای فعال ----------
rep("""  G.slots = cafeCapacity();
  G.systems = [];
  for(let i = 0; i < 16; i++){""",
"""  G.slots = cafeCapacity();
  G.systems = [];
  for(let i = 0; i < MAX_SLOTS; i++){""")

rep("""  G.kindForce = null;
  // سلامتِ تجهیزات — آرایه‌ی پایدار
  if(!Array.isArray(Save.d.hp) || Save.d.hp.length !== MAX_SLOTS){""",
"""  G.kindForce = null;
  Save.d.powerSpike = false;
  // روزِ تورنمنت؟
  if(Save.d.tourPend){
    G.tournament = tourById(Save.d.tourPend);
    Save.d.tourPend = null;
    G.tourP = 0;
    if(G.tournament) setTimeout(() => { toast('🏆 ' + G.tournament.name + ' شروع شد — هر گیمرِ راضی = ثبت‌نامِ ' + fmtK(G.tournament.fee), 'amber'); }, 1800);
  } else G.tournament = null;
  // سلامتِ تجهیزات — آرایه‌ی پایدار
  if(!Array.isArray(Save.d.hp) || Save.d.hp.length !== MAX_SLOTS){""")

rep("""  // مشتری‌ها — همه‌ی میزهای فعال
  for(let i = 0; i < G.slots; i++) tickSystem(i, dt);""",
"""  // مشتری‌ها — همه‌ی میزهای فعال
  for(let i = 0; i < MAX_SLOTS; i++){ if(deskOn(i)) tickSystem(i, dt); }""")

rep("""function tickPrinter(dt){
  if(G.printerJob < 0 || G.printerJob >= G.slots) return;""",
"""function tickPrinter(dt){
  if(G.printerJob < 0 || G.printerJob >= MAX_SLOTS || !deskOn(G.printerJob)) return;""")

rep("""function nextPrintJob(exclude){
  let best = -1, bt = 1e9;
  for(let i = 0; i < G.slots; i++){""",
"""function nextPrintJob(exclude){
  let best = -1, bt = 1e9;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;""")

rep("""function freeDesk(){
  for(let i = 0; i < G.slots; i++) if(!G.systems[i].cust) return i;
  return -1;
}""",
"""function freeDesk(){
  // پولدار و گیمرِ حرفه‌ای میزهای VIP را ترجیح می‌دهند
  const K = KINDS[G.nextKind || ''];
  if(K && (K.payMulC || K.fameOn)){
    for(let i = 16; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  for(let i = 0; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  return -1;
}""")

rep("""  if(c.troubleMaker && Math.random() < (KINDS.trouble.virusChance || 0.3) && lvl('antivirus') < 2){
    const targets = [];
    for(let j = 0; j < G.slots; j++){ const o = G.systems[j]; if(o.kind && o.kind !== 'print' && !o.virus) targets.push(j); }""",
"""  if(c.troubleMaker && Math.random() < (KINDS.trouble.virusChance || 0.3) && lvl('antivirus') < 2){
    const targets = [];
    for(let j = 0; j < MAX_SLOTS; j++){ if(!deskOn(j)) continue; const o = G.systems[j]; if(o.kind && o.kind !== 'print' && !o.virus) targets.push(j); }""")

# bootT برای روشن‌شدن مانیتور
rep("""  s.progress = 0; s.virus = false; s.virusT = 0; s.rebootT = 0; s.seatT = G.t; s.vip = c.vip;
  s.cust = c.id; s.person = c;""",
"""  s.progress = 0; s.virus = false; s.virusT = 0; s.rebootT = 0; s.seatT = G.t; s.vip = c.vip;
  s.bootT = 0.45; s.vipDesk = i >= 16;
  s.cust = c.id; s.person = c;""")

# ---------- ۳) pickKind: بایاسِ تبلیغ و تورنمنت ----------
rep("""function pickKind(){
  if(G.kindForce){ const ks = KIND_KEYS.filter(k => G.kindForce.includes(k)); if(ks.length) return pick(ks); }
  let sum = 0; for(const k of KIND_KEYS) sum += KINDS[k].w;
  let r = Math.random() * sum;
  for(const k of KIND_KEYS){ r -= KINDS[k].w; if(r <= 0) return k; }
  return 'dl';
}""",
"""function pickKind(){
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
    sum += w;
  }
  let r = Math.random() * sum;
  for(const k of KIND_KEYS){
    let w = KINDS[k].w;
    if(bias && (k === bias || (bias === 'student' && (k === 'student' || k === 'hurry')))) w *= 3;
    if(bias === 'esports' && k === 'esports') w *= 3;
    if(tourBias && tourBias.includes(k)) w *= 3;
    r -= w;
    if(r <= 0){ G.nextKind = k; return k; }
  }
  G.nextKind = 'dl';
  return 'dl';
}""")

# ---------- ۴) تیکِ میز: bootT ----------
rep("""function tickSystem(i, dt){
  const s = G.systems[i];
  if(!s.kind || s.virus) return;""",
"""function tickSystem(i, dt){
  const s = G.systems[i];
  if(s.bootT > 0) s.bootT -= dt;
  if(!s.kind || s.virus) return;""")

# ---------- ۵) تکمیل: VIP desk ×۱٫۴ + تورنمنت + نظرات ----------
rep("""  if(c.celeb) pay *= 3;
  if(c.regular) pay *= 1.25;""",
"""  if(c.celeb) pay *= 3;
  if(c.regular) pay *= 1.25;
  if(s.vipDesk) pay *= 1.4; // تعرفه‌ی سالن VIP""")

rep("""  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  G.weekStats.earn += pay;""",
"""  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  G.weekStats.earn += pay;
  // تورنمنت: هر گیمرِ راضی = یک ثبت‌نام
  if(G.tournament && (s.kind === 'game' || s.kind === 'esports') && G.tourP < G.tournament.cap){
    G.tourP++;
    const fee = Math.round(G.tournament.fee * (1 + 0.25 * lvl('emgr')) / 5000) * 5000;
    G.money += fee; G.dayStats.earned += fee; G.weekStats.earn += fee;
    floater(c.x, c.y - 62, '+ثبت‌نام ' + fmtK(fee), hexk('p'));
  }""")

rep("""  if(c.celeb){ G.fame = clamp(G.fame + 6, 0, 100); toast('🌟 مشتریِ مشهور راضی رفت — شهرت +۶', 'amber'); }
  coins(c.x, c.y - 20, pay);""",
"""  if(c.celeb){ G.fame = clamp(G.fame + 6, 0, 100); toast('🌟 مشتریِ مشهور راضی رفت — شهرت +۶', 'amber'); }
  // امتیازِ نظرِ مشتری
  let stars = 3;
  if(c.regular || s.vip) stars++;
  if(c.patience > c.patMax * 0.5) stars++;
  else stars--;
  if(s.vipDesk) stars = Math.min(5, stars + 1);
  addReview(stars, s.kind);
  coins(c.x, c.y - 20, pay);""")

rep("""    G.shake = 1; G.flash = { color:'255,77,94', a: 0.16 };
    puff(c.x, c.y, '#ff4d5e');
    Sfx.angry(); vibrate(40);
  }
  seatFromQueue();""",
"""    G.shake = 1; G.flash = { color:'255,77,94', a: 0.16 };
    puff(c.x, c.y, '#ff4d5e');
    addReview(1, c.kind);
    Sfx.angry(); vibrate(40);
  }
  seatFromQueue();""")

# ---------- ۶) چای/کارمند: حلقه‌های فعال ----------
rep("""function serveThirstiest(){
  let worst = null, wf = 0.85;
  for(let i = 0; i < G.slots; i++){""",
"""function serveThirstiest(){
  let worst = null, wf = 0.85;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;""")
rep("""function staffServe(){
  let worst = null, wf = 0.9;
  for(let i = 0; i < G.slots; i++){""",
"""function staffServe(){
  let worst = null, wf = 0.9;
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;""")
rep("""  if(lvl('tea2') >= 1){
    let worst = null, wf = 1;
    for(let i = 0; i < G.slots; i++){""",
"""  if(lvl('tea2') >= 1){
    let worst = null, wf = 1;
    for(let i = 0; i < MAX_SLOTS; i++){
      if(!deskOn(i)) continue;""")

# ---------- ۷) فروش/خریدِ مجددِ تکتکیِ میز ----------
rep("""/* ---------- فروش و تعمیرِ تجهیزات ---------- */
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
}""",
"""/* ---------- فروش و تعمیرِ تجهیزات — فروشِ تکتکیِ میز ---------- */
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
  if(s.kind) return false;             // مشتریِ روی میز = ممنوع
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
  if(Save.d.supplier){
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }
  if(G.money < cost){ toast('قیمتِ میزِ تازه: ' + fmtK(cost), 'pink'); return false; }
  G.money -= cost; G.dayStats.spent += cost;
  delete Save.d.deskOff[i];
  if(!Save.d.hp) Save.d.hp = [];
  Save.d.hp[i] = 85; // دستِ دومِ سرویس‌شده
  G.slots = cafeCapacity();
  persist();
  toast('🖥 میزِ ' + faNum(i + 1) + ' دوباره نصب شد — ' + fmtK(cost) + ' · ظرفیت: ' + faNum(G.slots), 'amber');
  Sfx.buy();
  return true;
}""")

# ---------- ۸) رویدادهای تازه ----------
rep("""  } else if(kind === 'outage'){
    G.budget = Math.max(30, Math.round(budget() * 0.35));
    G.evT = outageDur();
    rescaleAllocs();
  } else if(kind === 'virus'){""",
"""  } else if(kind === 'supplier'){
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
  } else if(kind === 'virus'){""")

rep("""    ? ['outage','virus','rush','fest','tour','celeb','inspect','partner','invest','breakdown']
    : ['outage','virus','rush','fest','breakdown'];""",
"""    ? ['outage','virus','rush','fest','tour','celeb','inspect','partner','invest','breakdown','supplier','powerSpike','netfault']
    : ['outage','virus','rush','fest','breakdown','supplier'];""")

rep("""  if(k === 'outage') G.budget = budget();
  if(k === 'virus'){""",
"""  if(k === 'outage' || k === 'netfault') G.budget = budget();
  if(k === 'virus'){""")

rep("""  } else if(kind === 'breakdown'){
    G.evT = 0.01;
    const used = [];
    for(let i = 0; i < G.slots; i++){ if(G.systems[i].kind || i < 4) used.push(i); }""",
"""  } else if(kind === 'breakdown'){
    G.evT = 0.01;
    const used = [];
    for(let i = 0; i < MAX_SLOTS; i++){ if(deskOn(i) && (G.systems[i].kind || i < 4)) used.push(i); }""")

# ---------- ۹) پایان روز: برقِ گران + تورنمنت + تجربه‌ی کارمندان ----------
rep("""  // هزینه‌های واقعی مدیریت
  const pw = powerCost(), sal = staffSalary();
  const netC = internetCost();
  const mat = (ds.teas + ds.snacks) * 12000;
  if(pw){ G.money -= pw; ds.power = pw; G.runStats.powerPaid = (G.runStats.powerPaid || 0) + pw; }""",
"""  // هزینه‌های واقعی مدیریت
  let pw = powerCost();
  if(Save.d.powerSpike) pw = Math.round(pw * 1.35);
  const sal = staffSalary();
  const netC = internetCost();
  const mat = (ds.teas + ds.snacks) * 12000;
  if(pw){ G.money -= pw; ds.power = pw; G.runStats.powerPaid = (G.runStats.powerPaid || 0) + pw; }""")

rep("""  const tl = lvl('tech');
  if(tl >= 1){
    let fixed = 0;
    for(let i = 0; i < G.slots && fixed < tl; i++){
      if(sysHp(i) < 60){
        Save.d.hp[i] = clamp(sysHp(i) + 8 + 6 * tl, 5, 100);""",
"""  // تجربه‌ی کارمندان — هر شب کمی ماهرتر
  for(const sid of ['tech','clean','mgr','net','emgr']){
    if(lvl(sid) >= 1 && Save.d.staffXp) Save.d.staffXp[sid] = Math.min(40, (Save.d.staffXp[sid] || 0) + 1);
  }
  const tl = lvl('tech');
  if(tl >= 1){
    let fixed = 0;
    const xpB = 1 + Math.min(0.3, (Save.d.staffXp.tech || 0) * 0.008);
    for(let i = 0; i < MAX_SLOTS && fixed < tl; i++){
      if(!deskOn(i)) continue;
      if(sysHp(i) < 60){
        Save.d.hp[i] = clamp(sysHp(i) + Math.round((8 + 6 * tl) * xpB), 5, 100);""")

rep("""  G.runStats.revenue += ds.earned;
  if(G.lanDay && ds.served >= 5){ G.runStats.lans++; G.fame = clamp(G.fame + 3, 0, 100); toast('🎮 لَن‌پارتیِ موفق — شهرت +۳', 'pink'); }
  checkCrown();""",
"""  G.runStats.revenue += ds.earned;
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
  checkCrown();""")

# ---------- ۱۰) اجاره: حقوق هفتگی + نگهداری + مالیات + رقبا + نظرات ----------
rep("""function payRent(){
  const rent = rentFor(G.week);
  if(G.money < rent) return;
  if(payRent._busy) return;
  payRent._busy = true;
  setTimeout(() => { payRent._busy = false; }, 400);
  G.money -= rent;
  G.runStats.weeksPaid++;
  G.runStats.rentTotal = (G.runStats.rentTotal || 0) + rent;
  // قسطِ بانک
  payInstallment();""",
"""function payRent(){
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
  payInstallment();""")

rep("""  // رقبای هوشمند: هفته‌ای یک قدم جلو — اما نه بی‌نهایت
  for(const r of RIVALS){
    const cur = rivalFame(r.id);
    const grow = r.speed * (0.8 + Math.random() * 0.5) + (Save.d.stats.weeksPaid || 0) * 0.05;
    Save.d.rivalFame[r.id] = Math.min(100, cur + grow * 0.8);
  }""",
"""  // رقبای هوشمند: اقتصادِ واقعی — درآمد، هزینه، تصمیمِ هفتگی
  tickRivals();
  // اثرِ نظرات روی شهرت
  const ra = reviewAvg();
  if(Save.d.reviews.length >= 3 && Math.abs(ra - 3.4) > 0.4){
    G.fame = clamp(G.fame + (ra > 3.4 ? 2 : -2), 0, 100);
  }""")

rep("""  G.week++; G.day = 1;
  persist();
  checkAch();
  startDay();
}
function checkWeeklyMissions(){""",
"""  G.week++; G.day = 1;
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
      toast('🏚 ' + r.name + ' تعطیل شد — مشتری‌هایش به کافه‌ی تو رسیدند!', 'amber');
      G.fame = clamp(G.fame + 4, 0, 100);
      Sfx.win();
    }
  }
}""")

io.open('p3_sim.js', 'w', encoding='utf-8').write(p)
print('patch8 sim OK')
