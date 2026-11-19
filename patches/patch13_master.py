# -*- coding: utf-8 -*-
# پچ ۱۳ — ماسترپرومپت V4: باگِ تخفیفِ تأمین‌کننده، ESC، تورنمنتِ بین‌المللی،
# درآمد به تفکیک سالن، هدفون/خنک‌کننده، گوشه‌ی کنسولِ کامل، دستاوردهای تازه
import io, re

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag=''):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:80])
    return t.replace(old, new, 1)

# ================= p2_core =================
p = rd('p2_core.js')

# --- تورنمنتِ بین‌المللی (بند ۱۱) ---
p = rep(p, """  { id:'t3', name:'تورنمنتِ ملی',    cost: 8000000, prize: 15000000, fee: 300000, cap: 16, req: 6, fame: 20 },
];""",
"""  { id:'t3', name:'تورنمنتِ ملی',    cost: 8000000, prize: 15000000, fee: 300000, cap: 16, req: 6, fame: 20 },
  { id:'t4', name:'تورنمنتِ بین‌المللی', cost: 20000000, prize: 38000000, fee: 500000, cap: 20, req: 8, fame: 35 },
];""", 't4')

# --- سه ارتقای جدیدِ مؤثر (بند ۶ و ۵) ---
p = rep(p, """  { id:'tea2',      cat:'equip', name:'کتریِ دوم',       icon:'🍵', max:2, prices:[1500000,4000000],                          eff:'چای هم‌زمان برای ۲ مشتری' },""",
"""  { id:'tea2',      cat:'equip', name:'کتریِ دوم',       icon:'🍵', max:2, prices:[1500000,4000000],                          eff:'چای هم‌زمان برای ۲ مشتری' },
  { id:'headset',   cat:'equip', name:'هدفونِ گیمینگ',    icon:'🎧', max:2, prices:[900000,2100000],                           eff:'گیمرها و حرفه‌ای‌ها ۳۰٪ بیشتر جذب می‌شوند در هر سطح' },
  { id:'cooling',   cat:'equip', name:'خنک‌کننده‌ی مرکزی', icon:'❄', max:2, prices:[1400000,3200000],                          eff:'فرسایشِ شبانه‌ی تجهیزات −۱۵٪ در هر سطح — تعمیرِ کمتر، عمرِ بیشتر' },
  { id:'console',   cat:'equip', name:'گوشه‌ی کنسول',     icon:'🎮', max:1, prices:[18000000], req:5,                          eff:'۲ ایستگاهِ کنسول با تلویزیونِ بزرگ و مبل — تعرفه ×۱٫۲ · گیمرها و پولدارها' },""", 'upg3')

# --- ۴ دستاوردِ تازه (بند ۱۲): بعد از rich1 ---
p = rep(p, """  { id:'rich1',""",
"""  { id:'hall2',  t:'افتتاحِ سالن دومِ گیم',      need: () => lvl('hall') >= 1,        fame: 4 },
  { id:'vipH',   t:'افتتاحِ سالنِ VIP',          need: () => lvl('vipHall') >= 1,     fame: 6 },
  { id:'desk20', t:'۲۰ میزِ فعالِ هم‌زمان',       need: () => cafeCapacity() >= 20,    fame: 6 },
  { id:'tour1',  t:'برگزاریِ اولین تورنمنتِ موفق', need: s => (s.tourneys || 0) >= 1,   fame: 5 },
  { id:'rich1',""", 'ach4')

wr('p2_core.js', p)
print('p2 OK')

# ================= p3_sim =================
p = rd('p3_sim.js')

# --- موقعیتِ ایستگاه‌های کنسول (راهروِ بین سالن۲ و VIP) ---
p = rep(p, """const DOOR = { x: 338, y: 112 };""",
"""const CONSOLE_POS = [{ x: 636, y: 240 }, { x: 636, y: 356 }]; // گوشه‌ی کنسول — بین سالن۲ و VIP
const DOOR = { x: 338, y: 112 };""", 'cpos')

# --- ریستِ ایستگاه‌های کنسول در آغازِ روز ---
p = rep(p, """  G.people = []; G.queue = []; G.particles = []; G.leaving = [];""",
"""  G.people = []; G.queue = []; G.particles = []; G.leaving = [];
  G.console = [{ c: null }, { c: null }];""", 'cinit')

# --- هدفون: جذبِ گیمر در pickKind (هر دو حلقه‌ی وزن) ---
old_w = """    if(tourBias && tourBias.includes(k)) w *= 3;
    sum += w;
  }"""
new_w = """    if(tourBias && tourBias.includes(k)) w *= 3;
    if((k === 'game' || k === 'esports') && lvl('headset')) w *= 1 + 0.3 * lvl('headset');
    sum += w;
  }"""
p = rep(p, old_w, new_w, 'pick1')
old_w2 = """    if(tourBias && tourBias.includes(k)) w *= 3;
    r -= w;
    if(r <= 0){ G.nextKind = k; return k; }
  }"""
new_w2 = """    if(tourBias && tourBias.includes(k)) w *= 3;
    if((k === 'game' || k === 'esports') && lvl('headset')) w *= 1 + 0.3 * lvl('headset');
    r -= w;
    if(r <= 0){ G.nextKind = k; return k; }
  }"""
p = rep(p, old_w2, new_w2, 'pick2')

# --- خنک‌کننده: فرسایشِ شبانه (بند ۶) ---
p = rep(p, """    if(ds.served > 0) Save.d.hp[i] = clamp(sysHp(i) - (2 + Math.round(Math.random() * 3)), 5, 100);""",
"""    if(ds.served > 0){
      const wear = Math.max(1, Math.round((2 + Math.round(Math.random() * 3)) * (1 - 0.15 * lvl('cooling'))));
      Save.d.hp[i] = clamp(sysHp(i) - wear, 5, 100);
    }""", 'cooling')

# --- باگِ D: تخفیفِ تأمین‌کننده فقط بعد از خریدِ موفق و با اعمالِ واقعی ---
p = rep(p, """  const cost = rebuyCost(i);
  if(cost <= 0) return false;
  if(Save.d.supplier){
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }
  if(G.money < cost){ toast('قیمتِ میزِ تازه: ' + fmtK(cost), 'pink'); return false; }
  G.money -= cost; G.dayStats.spent += cost;""",
"""  const cost = rebuyCost(i);
  if(cost <= 0) return false;
  let payC = cost;
  if(Save.d.supplier) payC = Math.round(cost * 0.8 / 50000) * 50000; // تخفیف فقط اگر خرید برسد مصرف می‌شود
  if(G.money < payC){ toast('قیمتِ میزِ تازه: ' + fmtK(payC), 'pink'); return false; }
  if(Save.d.supplier){
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد — ' + fmtK(cost - payC) + ' صرفه‌جویی', 'amber');
  }
  G.money -= payC; G.dayStats.spent += payC;""", 'disc-rebuy')

# --- درآمد به تفکیک سالن (بند ۹) در completeCustomer ---
p = rep(p, """  pay = Math.round(pay / 500) * 500;
  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  G.weekStats.earn += pay;""",
"""  pay = Math.round(pay / 500) * 500;
  G.money += pay;
  floater(c.x, c.y - 48, '+' + fmtK(pay), '#4cff9e');
  G.dayStats.earned += pay;
  G.weekStats.earn += pay;
  const hr = s.vipDesk ? 'vip' : (i >= 10 ? 'h2' : 'h1');
  if(!G.dayStats.hallRev) G.dayStats.hallRev = { h1: 0, h2: 0, vip: 0 };
  if(!G.runStats.hallRev) G.runStats.hallRev = { h1: 0, h2: 0, vip: 0 };
  G.dayStats.hallRev[hr] += pay; G.runStats.hallRev[hr] += pay;""", 'hallrev')

# --- مسیرِ کنسول + چرخه‌ی عمرِ مشتریِ کنسول ---
p = rep(p, """function freeDesk(){""",
"""/* ================= گوشه‌ی کنسول ================= */
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
function freeDesk(){""", 'console-fns')

# --- اسپاون: هدایت به کنسول قبل از جست‌وجوی میز ---
p = rep(p, """  const free = freeDesk();
  if(free >= 0){ seatCustomer(c, free); }""",
"""  if(Math.random() < 0.25 && routeConsole(c)){ G.people.push(c); G.doorGlow = 1; Sfx.arrive(); return; }
  const free = freeDesk();
  if(free >= 0){ seatCustomer(c, free); }""", 'spawn-hook')

# --- ماشینِ حالتِ tickPeople: رسیدن به کنسول + نشستِ کنسول ---
p = rep(p, """    if(c.state === 'walk' || c.state === 'angry' || c.state === 'leave'){
      if(walkUpdate(c, dt)) gone.push(c);
    } else if(c.state === 'sit'){
      if(c.sitT > 0) c.sitT -= dt;
      c.bt -= dt;
      if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); }
    }""",
"""    if(c.state === 'walk' || c.state === 'angry' || c.state === 'leave'){
      if(walkUpdate(c, dt)){
        if(c.onArrive === 'console') startConsPlay(c);
        else gone.push(c);
      }
    } else if(c.state === 'consPlay'){
      if(c.sitT > 0) c.sitT -= dt;
      c.bt -= dt;
      if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); }
      c.progress += dt * (1 + 0.05 * lvl('adsl') + 0.02 * lvl('router'));
      c.patience -= dt;
      if(c.progress >= c.consNeed) completeConsole(c);
      else if(c.patience <= 0) consoleBail(c);
    } else if(c.state === 'sit'){
      if(c.sitT > 0) c.sitT -= dt;
      c.bt -= dt;
      if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); }
    }""", 'tickpeople')

wr('p3_sim.js', p)
print('p3 OK')

# ================= p4_scene =================
p = rd('p4_scene.js')

# --- ترسیمِ گوشه‌ی کنسول ---
p = rep(p, """function sRand(i, j){""",
"""/* ================= گوشه‌ی کنسول ================= */
function drawConsoles(){
  if(!lvl('console') || !CONSOLE_POS) return;
  const z0 = G.zoom || 1;
  const visL = G.cam.x - 80, visR = G.cam.x + VW / z0 + 80;
  for(let i = 0; i < CONSOLE_POS.length; i++){
    const P = CONSOLE_POS[i];
    if(P.x < visL || P.x > visR) continue;
    const busy = G.console && G.console[i] && G.console[i].c;
    // فرشِ گوشه
    ctx.fillStyle = 'rgba(96,72,150,.20)';
    rr(P.x - 36, P.y - 24, 72, 46, 9); ctx.fill();
    // مبلِ دو نفره
    ctx.fillStyle = '#2b3252';
    rr(P.x - 32, P.y - 20, 42, 28, 7); ctx.fill();
    ctx.fillStyle = busy ? '#39426e' : '#31395e';
    rr(P.x - 36, P.y - 12, 50, 15, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    rr(P.x - 32, P.y - 20, 42, 6, 4); ctx.fill();
    // پایه‌ی تلویزیون
    ctx.fillStyle = '#171d33';
    ctx.fillRect(P.x + 17, P.y - 36, 5, 44);
    ctx.fillStyle = '#232a46';
    ctx.fillRect(P.x + 10, P.y + 4, 19, 5);
    // قابِ تلویزیون
    ctx.fillStyle = '#0b1122';
    rr(P.x + 8, P.y - 60, 36, 24, 4); ctx.fill();
    if(busy){
      // صفحه‌ی روشنِ بازی + گلو
      const hue = ['#59c2ff', '#4cff9e'][i % 2];
      ctx.fillStyle = hue; ctx.globalAlpha = .8;
      ctx.fillRect(P.x + 11, P.y - 57, 30, 18);
      ctx.globalAlpha = 1;
      // نمودارِ بازیِ متحرک
      ctx.fillStyle = 'rgba(11,17,34,.9)';
      for(let b = 0; b < 3; b++){
        const bh = 3 + sRand(i * 3 + 1, b * 7 + Math.floor(G.t * 2.5)) * 11;
        ctx.fillRect(P.x + 13 + b * 10, P.y - 43 - bh, 7, bh);
      }
      putGlow(P.x + 26, P.y - 48, 30, 'rgba(89,194,255,.45)', .55);
    } else {
      ctx.fillStyle = '#131a30';
      ctx.fillRect(P.x + 11, P.y - 57, 30, 18);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.fillRect(P.x + 11, P.y - 57, 30, 3);
      ctx.fillStyle = 'rgba(89,194,255,.10)';
      faText('🎮', P.x + 26, P.y - 48, 9, '#59c2ff', 'center');
    }
    // دسته‌ی بازی روی مبل
    ctx.fillStyle = busy ? '#ff5fa2' : '#5a6480';
    rr(P.x - 24, P.y + 2, 10, 6, 2.5); ctx.fill();
    if(busy){
      putGlow(P.x - 19, P.y + 5, 12, 'rgba(255,95,162,.4)', .5);
    }
  }
}
function sRand(i, j){""", 'draw-console')

# --- فراخوانی در drawScene بعد از پستِ چاپ ---
p = rep(p, """  drawPrintStation();""",
"""  drawPrintStation();
  drawConsoles();""", 'call-console')

wr('p4_scene.js', p)
print('p4 OK')

# ================= p5_ui =================
p = rd('p5_ui.js')

# --- باگِ D در buyUpgrade: اول پول، بعد مصرفِ تخفیف ---
p = rep(p, """  let price = u.prices[l];
  if(Save.d.supplier){
    price = Math.round(price * 0.8 / 10000) * 10000;
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }
  if(G.money < price) return;""",
"""  let price = u.prices[l];
  if(G.money < price) return; // پولِ کافی بدونِ تخفیف لازم است — تخفیف فقط با خریدِ واقعی مصرف می‌شود
  if(Save.d.supplier){
    price = Math.round(price * 0.8 / 10000) * 10000;
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }""", 'disc-buy')

# --- درآمد به تفکیک سالن + کنسول در داشبورد ---
p = rep(p, """  $('dashRev').innerHTML =
    '<div class="row"><span>میانگینِ امتیازِ ' + faNum(Save.d.reviews.length) + ' نظر</span><b class="a">' + faF1(ra) + ' / ۵ ★</b></div>' +""",
"""  const hrD = G.dayStats.hallRev || { h1: 0, h2: 0, vip: 0 };
  $('dashRev').innerHTML =
    '<div class="row"><span>درآمدِ سالنِ اصلی (امروز)</span><b class="a">' + fmtK(hrD.h1) + '</b></div>' +
    (lvl('hall') ? '<div class="row"><span>درآمدِ سالنِ گیم (امروز)</span><b class="a">' + fmtK(hrD.h2) + '</b></div>' : '') +
    (lvl('vipHall') ? '<div class="row"><span>درآمدِ سالنِ VIP (امروز)</span><b class="a">' + fmtK(hrD.vip) + '</b></div>' : '') +
    (lvl('console') ? '<div class="row"><span>درآمدِ گوشه‌ی کنسول (امروز)</span><b class="a">' + fmtK(G.dayStats.consoleRev || 0) + '</b></div>' : '') +
    '<div class="row"><span>میانگینِ امتیازِ ' + faNum(Save.d.reviews.length) + ' نظر</span><b class="a">' + faF1(ra) + ' / ۵ ★</b></div>' +""", 'dashrev')

# --- ESC: بستنِ پنجره‌های مناسب ---
assert "id=\"dash\"" in rd('p1_head.html'), 'dash element missing'
p = rep(p, """  $('btnPause').onclick = () => { Sfx.tickS(); G.userPaused = true; $('pause').hidden = false; };""",
"""  document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    if(!$('shop').hidden){ Sfx.tickS(); hideFade('shop'); return; }
    if(!$('dash').hidden){ Sfx.tickS(); hideFade('dash'); return; }
    if(G.userPaused && !$('pause').hidden){ G.userPaused = false; hideFade('pause'); return; }
  });
  $('btnPause').onclick = () => { Sfx.tickS(); G.userPaused = true; $('pause').hidden = false; };""", 'esc')

wr('p5_ui.js', p)
print('p5 OK')
print('patch13 done')
