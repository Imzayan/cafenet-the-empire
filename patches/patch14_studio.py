# -*- coding: utf-8 -*-
# پچ ۱۴ — پرامپتِ استودیویی: نامِ مشتری، مراحلِ ۱–۵ رشد، ترجیحِ واقعیِ میز،
# کارمندانِ مرئیِ گشت‌زن (نظافتچی/تکنسین با اثرِ واقعی)، ذخیره‌ی دستی، نام در نظرات
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag=''):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:80])
    return t.replace(old, new, 1)

# ================= p2_core =================
p = rd('p2_core.js')

# --- نام‌های فارسیِ مشتری‌ها ---
p = rep(p, "const CLOTHES = ['#3e6b6b','#7a4a3a','#55603a','#6b4a6b','#4a5a7a','#7a6a3a','#4a6b55','#804040','#3a5a4a','#6b3a3a'];",
"""const CLOTHES = ['#3e6b6b','#7a4a3a','#55603a','#6b4a6b','#4a5a7a','#7a6a3a','#4a6b55','#804040','#3a5a4a','#6b3a3a'];
const NAMES = ['آرش','سینا','نیما','پویا','رها','ترانه','میلاد','کاوه','شایان','درسا','بهنام','پارسا','مهدی','آریا','سانیا','فرزاد','کیان','مهسا','بردیا','شیوا','یاسین','نوید','الهام','سامان','روژان','هیوا','کتایون','بابک','نازنین','فرهاد','پریا','دانیال','گلناز','هومن','سپهر','مینا'];""", 'names')

# --- مراحلِ ۱–۵ کسب‌وکار (از وضعیتِ واقعی) ---
p = rep(p, """function reviewAvg(){""",
"""const STAGES = [
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
function reviewAvg(){""", 'stages')

# --- نام در addReview — سازگار با نظراتِ قدیمی ---
p = rep(p, """function addReview(stars, kindId){
  const s = clamp(Math.round(stars), 1, 5);
  Save.d.reviews.unshift({ s, k: kindId, w: G.week, txt: pick(REVIEW_TXT[s]) });""",
"""function addReview(stars, kindId, name){
  const s = clamp(Math.round(stars), 1, 5);
  Save.d.reviews.unshift({ s, k: kindId, w: G.week, txt: pick(REVIEW_TXT[s]), n: name || undefined });""", 'addrev')

wr('p2_core.js', p)
print('p2 OK')

# ================= p3_sim =================
p = rd('p3_sim.js')

# --- نام و تاریخچه‌ی مراجعه برای هر مشتری ---
p = rep(p, """    shirt: pick(CLOTHES), hair: pick(HAIRS),
    vip: lvl('vip') >= 1 && Math.random() < 0.1,""",
"""    shirt: pick(CLOTHES), hair: pick(HAIRS),
    name: pick(NAMES),
    visN: 0,
    vip: lvl('vip') >= 1 && Math.random() < 0.1,""", 'custname')

# --- تاریخچه: مشتریِ وفادار سابقه‌ی مراجعه دارد؛ VIP اعلامِ نام ---
p = rep(p, """  if(c.regular) c.patience *= 1.2;""",
"""  if(c.regular){ c.patience *= 1.2; c.visN = 2 + Math.floor(Math.random() * 6); } // سابقه‌ی مراجعه‌های قبلی""", 'visn')

p = rep(p, """  if(c.vip){ c.patience *= 1.25; c.patMax = c.patience; }""",
"""  if(c.vip){ c.patience *= 1.25; c.patMax = c.patience; setTimeout(() => { if(G.scene === 'day') toast('💎 VIPِ امشب: ' + c.name + ' — پولِ دوبرابر!', 'amber'); }, 900); }""", 'viptoast')

# --- ترجیحِ واقعیِ میز: گیمرها سالنِ گیم، اقتصادی‌ها از VIP می‌گذرند ---
p = rep(p, """  const K = KINDS[G.nextKind || ''];
  if(K && (K.payMulC || K.fameOn)){
    for(let i = 16; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  for(let i = 0; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  return -1;""",
"""  const k = G.nextKind || '';
  const K = KINDS[k];
  if(K && (K.payMulC || K.fameOn)){
    for(let i = 16; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  if((k === 'game' || k === 'esports') && lvl('pcTier') >= 2){
    for(let i = 10; i < 16; i++) if(deskOn(i) && !G.systems[i].cust) return i; // گیمر: سالنِ گیم قبل از سالنِ اصلی
  }
  if(k === 'student' || k === 'poor'){
    for(let i = 0; i < 10; i++) if(deskOn(i) && !G.systems[i].cust) return i; // اقتصادی‌ها از میزهای VIP می‌گذرند
    for(let i = 10; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  }
  for(let i = 0; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].cust) return i;
  return -1;""", 'freedesk')

# --- نام در نظرات (خوش‌حساب و عصبانی) ---
p = rep(p, "    addReview(1, c.kind);", "    addReview(1, c.kind, c.name);", 'rev1')
p = rep(p, "  addReview(stars, s.kind);", "  addReview(stars, s.kind, c.name);", 'rev2')

# --- کارمندانِ مرئی: نظافتچیِ گشت‌زن + تکنسینِ گشت با تعمیرِ روبه‌میز ---
p = rep(p, """  G.console = [{ c: null }, { c: null }];""",
"""  G.console = [{ c: null }, { c: null }];
  if(lvl('clean')) G.people.push({ type:'clean', x: 80, y: 505, dir: 1, bt: rnd(1,3), ph: rnd(0, TAU), shirt: pick(CLOTHES), hair: pick(HAIRS), bub: null });
  if(lvl('tech')) G.people.push({ type:'tech', x: 700, y: 398, dir: -1, bt: rnd(1,3), ph: rnd(0, TAU), shirt: pick(CLOTHES), hair: pick(HAIRS), bub: null, fixT: 0 });""", 'staffwalk')

p = rep(p, """  // دودِ قلیان گوشه‌ی کافه
  if(Math.random() < dt * 0.8) smoke(285, 96);""",
"""  // گشتِ نظافتچی و تکنسین — با اثرِ واقعی
  for(const w of G.people){
    if(w.type !== 'clean' && w.type !== 'tech') continue;
    if(w.bub){ w.bub.t -= dt; if(w.bub.t <= 0) w.bub = null; }
    if(w.pauseT > 0){ w.pauseT -= dt; continue; }
    w.x += w.dir * (w.type === 'clean' ? 22 : 26) * dt;
    w.bob += dt * 9;
    if(w.type === 'clean' && Math.random() < dt * 2.2) sparkle(w.x + rnd(-6, 6), w.y + 6);
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
        w.fixT = 6;
        let worst = -1, worstHp = 70;
        for(let i = 0; i < MAX_SLOTS; i++){
          if(!deskOn(i) || G.systems[i].kind) continue;
          const hpx = sysHp(i);
          if(hpx < worstHp){ worstHp = hpx; worst = i; }
        }
        if(worst >= 0 && Math.abs(deskPos(worst).x - w.x) < 90){
          Save.d.hp[worst] = clamp(sysHp(worst) + 2, 5, 100);
          w.bub = { t: 2, text: '🔧 میزِ ' + faNum(worst + 1) + ' رو سرویس کردم' };
        }
      }
    }
  }
  // دودِ قلیان گوشه‌ی کافه
  if(Math.random() < dt * 0.8) smoke(285, 96);""", 'stafftick')

# --- برچسبِ مرحله در زیرنویسِ HUD ---
p = rep(p, """  $('bSub').textContent = titleFor(G.level) + ' · سطح ' + faNum(G.level) + ' · میراث +' + faF1((Save.d.legacy||0)*100) + '٪' + (G.lanDay ? ' · 🎮 لَن‌پارتیِ امشب' : '');""",
"""  const stg = stageInfo();
  $('bSub').textContent = 'مرحله‌ی ' + faNum(stg.n) + ': ' + stg.t + ' · ' + titleFor(G.level) + ' · سطح ' + faNum(G.level) + ' · میراث +' + faF1((Save.d.legacy||0)*100) + '٪' + (G.lanDay ? ' · 🎮 لَن‌پارتیِ امشب' : '');""", 'stage-sub')

wr('p3_sim.js', p)
print('p3 OK')

# ================= p4_scene =================
p = rd('p4_scene.js')

# --- ترسیمِ نظافتچی و تکنسینِ درحالِ گشت ---
p = rep(p, """function drawPerson(c){
  if(c.type === 'cust'){""",
"""function drawPerson(c){
  if(c.type === 'clean' || c.type === 'tech'){
    drawFigure(c.x, c.y + 9, {
      shirt: c.type === 'clean' ? '#4a6b55' : '#3e556b', hair: c.hair, H: 22,
      walking: true, walkPh: c.bob,
    });
    faText(c.type === 'clean' ? '🧹' : '🔧', c.x + (c.dir > 0 ? 9 : -9), c.y - 6, 8, '#dfe6ec', 'center');
    if(c.bub) drawBubble(c.x, c.y - 12, c.bub.text);
    return;
  }
  if(c.type === 'cust'){""", 'draw-staff')

wr('p4_scene.js', p)
print('p4 OK')

# ================= p1_head =================
p = rd('p1_head.html')

# --- دکمه‌ی ذخیره‌ی دستی در منوی مکث ---
p = rep(p, """        <button class="nbtn ghost" id="btnToMenu">منوی اصلی (ذخیره می‌شود)</button>""",
"""        <button class="nbtn ghost" id="btnSaveMan">💾 ذخیره‌ی دستی</button>
        <button class="nbtn ghost" id="btnToMenu">منوی اصلی (ذخیره می‌شود)</button>""", 'saveman')

wr('p1_head.html', p)
print('p1 OK')

# ================= p5_ui =================
p = rd('p5_ui.js')

# --- bind ذخیره‌ی دستی ---
p = rep(p, """  $('btnToMenu').onclick = () => { G.userPaused = false; goMenu(); };""",
"""  $('btnSaveMan').onclick = () => { Sfx.tickS(); persist(); toast('💾 بازی ذخیره شد', 'amber'); };
  $('btnToMenu').onclick = () => { G.userPaused = false; goMenu(); };""", 'bind-save')

# --- KPI مرحله در داشبورد ---
p = rep(p, """    ['مشتریِ وفادار', faNum(G.runStats.regulars || 0), ''],
  ];""",
"""    ['مشتریِ وفادار', faNum(G.runStats.regulars || 0), ''],
    ['مرحله', stageInfo().t, ''],
  ];""", 'kpi-stage')

# --- نامِ مشتری در ردیف‌های نظر ---
p = rep(p, """'<div class="row"><span>' + '★'.repeat(rv.s) + '☆'.repeat(5 - rv.s) + ' <small style="color:#7d8894">' + (KINDS[rv.k] && KINDS[rv.k].t ? KINDS[rv.k].t : 'مشتری') + '</small></span>""",
"""'<div class="row"><span>' + '★'.repeat(rv.s) + '☆'.repeat(5 - rv.s) + ' <small style="color:#7d8894">' + (rv.n ? rv.n + ' · ' : '') + (KINDS[rv.k] && KINDS[rv.k].t ? KINDS[rv.k].t : 'مشتری') + '</small></span>""", 'rev-name')

wr('p5_ui.js', p)
print('p5 OK')
print('patch14 done')
