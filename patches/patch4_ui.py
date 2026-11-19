# -*- coding: utf-8 -*-
# پچ ۴ — UI: داشبورد + بانک + تعمیر/فروش + تنظیمات صدا + ظرفیت مرکزی
import io
p = io.open('p5_ui.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) هدِ مشتری به جایگاهِ تازه ----------
rep("""    if(Math.hypot(x - p.x, y - (p.y - 33)) < 19) return i;""",
"""    if(Math.hypot(x - p.x, y - (p.y - 38)) < 19) return i;""")

# ---------- ۲) دکمه‌ی داشبورد + تعمیر با لمسِ میزِ فرسوده ----------
rep("""  if(btn === 'shop'){ G.tapFx = { id:'shop', t:0.28 }; Sfx.tickS(); openShop(); return; }
  if(btn === 'quests'){ G.tapFx = { id:'quests', t:0.28 }; Sfx.tickS(); openQuests(); return; }
  if(btn === 'tea'){ G.tapFx = { id:'tea', t:0.28 }; serveThirstiest(); return; }""",
"""  if(btn === 'shop'){ G.tapFx = { id:'shop', t:0.28 }; Sfx.tickS(); openShop(); return; }
  if(btn === 'quests'){ G.tapFx = { id:'quests', t:0.28 }; Sfx.tickS(); openQuests(); return; }
  if(btn === 'dash'){ G.tapFx = { id:'dash', t:0.28 }; Sfx.tickS(); openDash(); return; }
  if(btn === 'tea'){ G.tapFx = { id:'tea', t:0.28 }; serveThirstiest(); return; }""")

rep("""  const mon = hitMonitor(wx, v.y);
  if(mon >= 0 && G.systems[mon].virus){ rebootSystem(mon); G.shake = 0.35; return; }""",
"""  const mon = hitMonitor(wx, v.y);
  if(mon >= 0 && G.systems[mon].virus){ rebootSystem(mon); G.shake = 0.35; return; }
  if(mon >= 0 && sysHp(mon) < 55 && !G.systems[mon].kind){
    openRepair(mon);
    return;
  }""")

# ---------- ۳) ظرفیتِ مرکزی در خرید و init ----------
rep("""  if(u.id === 'sys') G.slots = 4 + lvl('sys');
  if(u.id === 'router' && G.activeEvent !== 'outage') G.budget = budget();
  persist();
  Sfx.buy();
  toast(u.icon + ' ' + u.name + ' — لول ' + faNum(l + 1));
  checkAch();
  renderShop();""",
"""  if(u.id === 'sys' || u.id === 'hall') G.slots = cafeCapacity();
  if(u.id === 'router' && G.activeEvent !== 'outage') G.budget = budget();
  if(u.id === 'wall' || u.id === 'lamp2' || u.id === 'plant2' || u.id === 'poster2') refreshDecor();
  if(u.id === 'tech' || u.id === 'clean' || u.id === 'mgr') toast('🧍 ' + u.name + ' استخدام شد — حقوقِ هفتگی: ' + fmtK(staffWeekly(u.id, l + 1)), 'amber');
  persist();
  Sfx.buy();
  toast(u.icon + ' ' + u.name + ' — لول ' + faNum(l + 1));
  checkAch();
  renderShop();""")

rep("""  syncSoundBtn();
  bindUI();
  resize();""",
"""  Sfx.init();
  if(Sfx.sfxG) Sfx.sfxG.gain.value = Save.d.volS !== undefined ? Save.d.volS : 0.8;
  if(Sfx.musG) Sfx.musG.gain.value = (Save.d.volM !== undefined ? Save.d.volM : 0.5) * 0.55;
  syncSoundBtn();
  bindUI();
  resize();""")

rep("""  G.slots = 4 + lvl('sys');
  buildAmbient(); // کافه از همان منو زنده است""",
"""  G.slots = cafeCapacity();
  buildAmbient(); // کافه از همان منو زنده است""")

# ---------- ۴) داشبورد مدیریتی ----------
rep("""/* ================= ماموریت‌ها ================= */""",
"""/* ================= تعمیرِ میز ================= */
function openRepair(i){
  const cost = repairCost(i);
  openModal('🔧', 'میزِ ' + faNum(i + 1) + ' به تعمیر نیاز دارد — سلامتِ فعلی: ' + faNum(Math.round(sysHp(i))) + '٪. تجهیزاتِ فرسوده سرعتِ سرویس را می‌کاهند.',
    { t:'تعمیر کامل — ' + fmtK(cost), chips:'سلامت ۱۰۰٪ · سرویسِ پرسرعت', hot: false,
      fx(){ repairDesk(i); } },
    { t:'بعداً', chips:'وضعیت همین‌طور می‌ماند', fx(){} });
}

/* ================= داشبوردِ مدیریتی ================= */
function openDash(){ renderDash(); $('dash').hidden = false; }
function renderDash(){
  const busy = [];
  for(let i = 0; i < G.slots; i++) if(G.systems[i].kind) busy.push(i);
  const avgHp = (() => { let s = 0; for(let i = 0; i < G.slots; i++) s += sysHp(i); return Math.round(s / Math.max(1, G.slots)); })();
  const ds = G.dayStats;
  const used = sumAlloc(), bud = budget();
  const kpis = [
    ['در حالِ کار', faNum(busy.length) + '/' + faNum(G.slots), 'g'],
    ['در صف', faNum(G.queue.length), G.queue.length ? 'a' : ''],
    ['رضایت', faNum(satisfactionPct()) + '٪', satisfactionPct() >= 70 ? 'g' : 'r'],
    ['پهنای باند', faNum(used) + '/' + faNum(bud), used > bud ? 'r' : ''],
    ['سلامتِ تجهیزات', faNum(avgHp) + '٪', avgHp >= 70 ? 'g' : avgHp >= 45 ? 'a' : 'r'],
    ['مشتریِ وفادار', faNum(G.runStats.regulars || 0), ''],
  ];
  $('dashKpi').innerHTML = kpis.map(k => '<div><b class="' + k[2] + '">' + k[1] + '</b><small>' + k[0] + '</small></div>').join('');
  const fin = [
    ['درآمد امروز', '+' + fmtK(ds.earned), 'g'],
    ['چای و اسنک', '+' + fmtK(ds.tipEarned), 'g'],
    ['چاپ', '+' + fmtK(ds.printRev || 0), 'g'],
    ['برق', '−' + fmtK(ds.power || 0), 'r'],
    ['حقوق', '−' + fmtK(ds.salary || 0), 'r'],
    ['اینترنت', '−' + fmtK(ds.internet || 0), 'r'],
    ['مواد اولیه', '−' + fmtK(ds.materials || 0), 'r'],
    ['مجموعِ هزینه‌ی امروز', '−' + fmtK((ds.power||0) + (ds.salary||0) + (ds.internet||0) + (ds.materials||0)), 'r'],
  ];
  $('dashFin').innerHTML = fin.map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');
  /* نمودارِ روندِ سودِ هفتگی */
  const cvD = $('dashChart'), gD = cvD.getContext('2d');
  const hist = (Save.d.weekHist || []).slice(-8);
  const est = Math.max(0, (G.weekStats ? G.weekStats.earn : 0) - rentFor(G.week));
  const data = hist.concat([Math.round(est)]);
  const W = cvD.width, H = cvD.height;
  gD.clearRect(0, 0, W, H);
  if(data.length >= 1){
    const mx = Math.max(1, ...data.map(v => Math.abs(v)));
    const step = W / Math.max(2, data.length);
    gD.strokeStyle = 'rgba(255,255,255,.1)';
    gD.beginPath(); gD.moveTo(0, H / 2); gD.lineTo(W, H / 2); gD.stroke();
    gD.beginPath();
    data.forEach((v, i) => {
      const x = W - (data.length - 1 - i) * step;
      const y = H / 2 - (v / mx) * (H / 2 - 6);
      if(i === 0) gD.moveTo(x, y); else gD.lineTo(x, y);
    });
    gD.strokeStyle = '#4cff9e'; gD.lineWidth = 2; gD.stroke();
    gD.fillStyle = 'rgba(76,255,158,.12)';
    gD.lineTo(W, H / 2); gD.lineTo(W - (data.length - 1) * step, H / 2); gD.closePath(); gD.fill();
  }
  /* رقبا */
  $('dashRivals').innerHTML = RIVALS.map(r => {
    const rf = Math.round(rivalFame(r.id));
    const mine = Math.round(G.fame);
    const win = mine > rf;
    return '<div class="row"><span>' + r.name + ' <small style="color:#7d8894">· تجهیز ' + faNum(r.eq) + ' · قیمت ×' + faF1(r.price) + '</small></span>' +
      '<b class="' + (win ? 'g' : 'r') + '">' + (win ? 'جلویم ✓ ' : 'عقبم ') + faNum(mine) + ' / ' + faNum(rf) + '</b></div>';
  }).join('');
  /* تبلیغات */
  const ad = activeAd();
  const adHtml = ADS.map(a => {
    const isActive = ad && ad.id === a.id;
    const afford = G.money >= a.cost && !ad;
    return '<div class="urow' + (afford ? ' can' : '') + '">' +
      '<div class="uico">📣</div>' +
      '<div class="ubody"><div class="uname">' + a.t + '</div><div class="ueff">' + a.d + '</div></div>' +
      (isActive
        ? '<div class="ubuy max">فعال · ' + faNum(Save.d.ads.left) + ' روز</div>'
        : '<button class="ubuy"' + (afford ? '' : ' disabled') + '>' + fmtK(a.cost) + '</button>') +
      '</div>';
  }).join('');
  $('dashAds').innerHTML = adHtml;
  const bs = $('dashAds').querySelectorAll('button.ubuy');
  ADS.forEach((a, i) => { const b = bs[i]; if(b) b.onclick = () => buyAd(a); });
  /* تعمیراتِ پیشنهادی */
  const bad = [];
  for(let i = 0; i < G.slots; i++) if(sysHp(i) < 100) bad.push(i);
  bad.sort((a, b) => sysHp(a) - sysHp(b));
  $('dashFix').innerHTML = bad.length ? bad.slice(0, 3).map(i => {
    const busyI = !!G.systems[i].kind;
    const c = repairCost(i);
    return '<div class="row"><span>میز ' + faNum(i + 1) + ' — سلامت ' + faNum(Math.round(sysHp(i))) + '٪</span>' +
      '<button class="ubuy" data-fix="' + i + '"' + ((G.money >= c && !busyI) ? '' : ' disabled') + '>' + fmtK(c) + '</button></div>';
  }).join('') : '<div class="ueff" style="text-align:center;color:var(--green)">همه‌چیز سالم است ✓</div>';
  const fbs = $('dashFix').querySelectorAll('button[data-fix]');
  fbs.forEach(b => { b.onclick = () => { const i = +b.dataset.fix; if(repairDesk(i)) renderDash(); }; });
  /* فروشِ میزِ اضافی */
  const sellable = [];
  for(let i = 4; i < G.slots; i++) if(!G.systems[i].kind) sellable.push(i);
  $('dashSell').innerHTML = sellable.length
    ? '<div class="ueff" style="margin-bottom:6px">میزِ خالیِ اضافه بفروش — ' + faNum(sellable.length) + ' میز آماده‌ی فروش (بهای استهلاک‌شده):</div>' +
      sellable.map(i => '<div class="row"><span>میز ' + faNum(i + 1) + ' · سلامت ' + faNum(Math.round(sysHp(i))) + '٪</span>' +
      '<button class="ubuy" data-sell="' + i + '">بفروش</button></div>').join('')
    : '<div class="ueff" style="text-align:center;color:#7d8894">میزِ خالیِ قابلِ فروشی نیست</div>';
  const sbs = $('dashSell').querySelectorAll('button[data-sell]');
  sbs.forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.sell;
      const s = G.systems[i];
      if(s.kind){ toast('اول مشتریِ آن میز را بفرست', 'pink'); return; }
      if(sellDesk(i)){ G.slots = cafeCapacity(); renderDash(); }
    };
  });
  /* کارمندان */
  const st2 = [
    ['🔧 تکنسین', lvl('tech'), 3, staffWeekly('tech', lvl('tech'))],
    ['🧹 نظافت', lvl('clean'), 2, staffWeekly('clean', lvl('clean'))],
    ['📋 مدیر شیفت', lvl('mgr'), 2, staffWeekly('mgr', lvl('mgr'))],
  ];
  $('dashStaff').innerHTML = st2.map(s =>
    '<div class="row"><span>' + s[0] + ' — لول ' + faNum(s[1]) + '/' + faNum(s[2]) + '</span><b class="a">حقوق ' + fmtK(s[3]) + '/هفته</b></div>'
  ).join('');
}
function buyAd(a){
  if(Save.d.ads){ toast('یک کمپین در حالِ اجراست', 'pink'); return; }
  if(G.money < a.cost) return;
  G.money -= a.cost;
  G.dayStats.spent += a.cost;
  Save.d.ads = { id: a.id, left: a.days };
  persist();
  toast('📣 ' + a.t + ' فعال شد — ' + faNum(a.days) + ' روز', 'amber');
  Sfx.buy();
  renderDash();
}

/* ================= ماموریت‌ها ================= */""")

# ---------- ۵) ماموریت هفتگی در پنجره‌ی ماموریت ----------
rep("""  const al = $('achList');
  al.innerHTML = '';""",
"""  /* ماموریتِ هفتگی */
  const wm = MISSIONS_W.find(m => !Save.d.mWDone.includes(m.id)) || MISSIONS_W[0];
  $('weekMission').innerHTML = '<div class="urow"><div class="uico">' + wm.icon + '</div>' +
    '<div class="ubody"><div class="uname">' + wm.t + '</div><div class="ueff">پاداشِ ' + fmtK(wm.r) + ' — هنگامِ پرداختِ اجاره داوری می‌شود</div></div>' +
    '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:var(--cyan)">هفتگی</div></div>';
  const al = $('achList');
  al.innerHTML = '';""")

s = io.open('p3_sim.js', encoding='utf-8').read()

def reps(old, new, n=1):
    global s
    assert old in s, 'MISSING in sim: ' + old[:80]
    s = s.replace(old, new, n)

# ---------- ۶) بانک در صفحه‌ی اجاره (فایل شبیه‌سازی) ----------
reps("""function showWeekend(){
  G.scene = 'day'; // صحنه پشت مودال دیده شود
  const rent = rentFor(G.week);""",
"""function renderBank(){
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
  const rent = rentFor(G.week);""")

reps("""  $('weekend').hidden = false;
  if(G.money >= rent) Sfx.quest(); else Sfx.lose();

}""",
"""  renderBank();
  $('weekend').hidden = false;
  if(G.money >= rent) Sfx.quest(); else Sfx.lose();

}""")

io.open('p3_sim.js', 'w', encoding='utf-8').write(s)
print('patch4 sim part OK')

# ---------- ۷) اسلایدرهای صدا در مکث ----------
rep("""  $('btnSound').onclick = () => {
    Save.d.sound = !Save.d.sound; Save.save(); syncSoundBtn();
    Sfx.init(); Sfx.resume(); if(Save.d.sound) Sfx.tickS();
  };""",
"""  $('btnSound').onclick = () => {
    Save.d.sound = !Save.d.sound; Save.save(); syncSoundBtn();
    Sfx.init(); Sfx.resume(); if(Save.d.sound) Sfx.tickS(); else Sfx.stopMusic();
  };
  $('volS').value = Math.round((Save.d.volS !== undefined ? Save.d.volS : 0.8) * 100);
  $('volM').value = Math.round((Save.d.volM !== undefined ? Save.d.volM : 0.5) * 100);
  $('volS').oninput = e => { Sfx.setVolS(+e.target.value / 100); };
  $('volM').oninput = e => { Sfx.setVolM(+e.target.value / 100); if(Save.d.music && Save.d.sound) Sfx.startMusic(); };""")

# دکمه‌ی موسیقی جدا در منو؟ — از سوییچ صدا استفاده می‌کنیم؛ موسیقی مستقل با اسلایدر صفر می‌شود.
rep("""  document.addEventListener('visibilitychange', () => {
    if(document.hidden && G.scene === 'day'){ G.userPaused = true; $('pause').hidden = false; persist(); }
  });""",
"""  document.addEventListener('visibilitychange', () => {
    if(document.hidden && G.scene === 'day'){ G.userPaused = true; $('pause').hidden = false; persist(); }
  });
  window.addEventListener('beforeunload', () => { try{ persist(); }catch(e){} });""")

# ---------- ۸) ذخیره‌ی debounce ----------
rep("""/* ================= حلقه‌ی اصلی ================= */""",
"""/* ================= ذخیره‌ی کم‌تواتر ================= */
let saveTmr = null;
function saveSoon(){
  if(saveTmr) return;
  saveTmr = setTimeout(() => { saveTmr = null; persist(); }, 2000);
}

/* ================= حلقه‌ی اصلی ================= */""")

# auto-save دوره‌ای حینِ روز
rep("""  const running = G.scene === 'day' && !G.paused && !G.userPaused && !G.frozen && !anyModalOpen();
  if(running){
    try{ tick(dt); }catch(e){ console.error('tick', e); }""",
"""  const running = G.scene === 'day' && !G.paused && !G.userPaused && !G.frozen && !anyModalOpen();
  if(document.hidden){ last = ts; requestAnimationFrame(frame); return; }
  if(running){
    frames % 600 === 0 && saveSoon();
    try{ tick(dt); }catch(e){ console.error('tick', e); }""")

io.open('p5_ui.js', 'w', encoding='utf-8').write(p)
print('patch4 ui OK')
