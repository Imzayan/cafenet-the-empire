# -*- coding: utf-8 -*-
# پچ ۱۰ — UI: فیلتر/مرتب‌سازی فروشگاه + تورنمنت/نظرات/ارزش در داشبورد + آموزش + پینچ + بازخرید
import io
p = io.open('p5_ui.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) لمسِ میزها فقطِ فعال‌ها ----------
rep("""function hitSliderBand(x, y){
  for(let i = 0; i < G.slots; i++){
    const s = G.systems[i];""",
"""function hitSliderBand(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];""")
rep("""function hitMonitor(x, y){
  for(let i = 0; i < G.slots; i++){
    const s = G.systems[i];""",
"""function hitMonitor(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];""")
rep("""function hitCustomerHead(x, y){
  for(let i = 0; i < G.slots; i++){
    const s = G.systems[i];""",
"""function hitCustomerHead(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];""")

# ---------- ۲) پینچ‌زوم + دکمه‌های زوم + تبِ VIP ----------
rep("""cv.addEventListener('pointerdown', e => {
  Sfx.init(); Sfx.resume();
  if(G.scene !== 'day' || G.paused || G.frozen || G.userPaused || anyModalOpen()) return;
  const v = vxy(e);
  const wx = v.x + (G.cam ? G.cam.x : 0);
  const btn = hitButton(v.x, v.y);
  if(btn === 'panL'){ G.cam.target = Math.max(0, G.cam.target - 300); Sfx.tickS(); return; }
  if(btn === 'panR'){ G.cam.target = Math.min(WORLD_W - VW, G.cam.target + 300); Sfx.tickS(); return; }
  if(btn === 'tabA'){ G.cam.target = 0; Sfx.tickS(); return; }
  if(btn === 'tabB'){ G.cam.target = WORLD_W - VW; Sfx.tickS(); return; }""",
"""G.pins = new Map();
cv.addEventListener('pointerdown', e => {
  Sfx.init(); Sfx.resume();
  const v0 = vxy(e);
  G.pins.set(e.pointerId, v0);
  if(G.pins.size === 2){
    const ps = [...G.pins.values()];
    G.pinch = { d0: Math.max(20, Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y)), z0: G.zoom || 1 };
    G.drag = null; G.pan = null;
    return;
  }
  if(G.scene !== 'day' || G.paused || G.frozen || G.userPaused || anyModalOpen()) return;
  const v = vxy(e);
  const wx = v.x + (G.cam ? G.cam.x : 0);
  const btn = hitButton(v.x, v.y);
  if(btn === 'panL'){ G.cam.target = Math.max(0, G.cam.target - 300); Sfx.tickS(); return; }
  if(btn === 'panR'){ G.cam.target = Math.min(WORLD_W - VW, G.cam.target + 300); Sfx.tickS(); return; }
  if(btn === 'zin'){ setZoom((G.zoom || 1) + 0.2); return; }
  if(btn === 'zout'){ setZoom((G.zoom || 1) - 0.2); return; }
  if(btn === 'tabA'){ G.cam.target = 0; Sfx.tickS(); return; }
  if(btn === 'tabB'){ G.cam.target = 280; Sfx.tickS(); return; }
  if(btn === 'tabC'){ G.cam.target = WORLD_W - VW; Sfx.tickS(); return; }""")

rep("""cv.addEventListener('pointermove', e => {
  if(G.drag && e.pointerId === G.drag.id){""",
"""cv.addEventListener('pointermove', e => {
  if(G.pins && G.pins.has(e.pointerId)){
    G.pins.set(e.pointerId, vxy(e));
    if(G.pinch && G.pins.size === 2){
      const ps = [...G.pins.values()];
      const d = Math.max(20, Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y));
      setZoom(G.pinch.z0 * d / G.pinch.d0);
      return;
    }
  }
  if(G.drag && e.pointerId === G.drag.id){""")

rep("""const endDrag = e => {
  if(G.drag && (!e || e.pointerId === G.drag.id)) G.drag = null;
  if(G.pan && (!e || e.pointerId === G.pan.id)) G.pan = null;
};""",
"""const endDrag = e => {
  if(G.pins && e && G.pins.has(e.pointerId)) G.pins.delete(e.pointerId);
  if(G.pins && G.pins.size < 2) G.pinch = null;
  if(G.drag && (!e || e.pointerId === G.drag.id)) G.drag = null;
  if(G.pan && (!e || e.pointerId === G.pan.id)) G.pan = null;
};""")

# ---------- ۳) فروشگاه: فیلتر + مرتب‌سازی + تخفیفِ تأمین‌کننده + پیش‌نیاز ----------
rep("""function renderShop(){
  $('shopMoney').textContent = 'موجودی: ' + fmtK(G.money);
  const list = $('shopList');
  list.innerHTML = '';
  for(const u of UPGRADES){
    const l = lvl(u.id);
    const maxed = l >= u.max;
    const price = maxed ? 0 : u.prices[l];
    const can = !maxed && G.money >= price;
    const row = document.createElement('div');
    row.className = 'urow' + (can ? ' can' : '');
    let pips = '';
    for(let i = 0; i < u.max; i++) pips += '<div class="pip' + (i < l ? ' on' : '') + '"></div>';
    row.innerHTML =
      '<div class="uico">' + u.icon + '</div>' +
      '<div class="ubody"><div class="uname">' + u.name + '</div>' +
      '<div class="ueff">' + u.eff + '</div>' +
      '<div class="pips">' + pips + '</div></div>' +
      '<button class="ubuy' + (maxed ? ' max' : '') + '"' + (can ? '' : ' disabled') + '>' +
      (maxed ? 'حدِ کامل' : fmtK(price)) + '</button>';
    if(!maxed){
      row.querySelector('.ubuy').onclick = () => buyUpgrade(u);
    }
    list.appendChild(row);
  }
}""",
"""G.shopFilter = 'all';
G.shopSort = null;
function renderShop(){
  $('shopMoney').textContent = 'موجودی: ' + fmtK(G.money) + (Save.d.supplier ? ' 🎁 تخفیفِ ۲۰٪ فعال' : '');
  const list = $('shopList');
  list.innerHTML = '';
  let ups = UPGRADES.filter(u => G.shopFilter === 'all' || (u.cat || 'equip') === G.shopFilter);
  if(G.shopSort === 'price') ups = ups.slice().sort((a, b) => (a.prices[Math.min(lvl(a.id), a.prices.length-1)] || 0) - (b.prices[Math.min(lvl(b.id), b.prices.length-1)] || 0));
  for(const u of ups){
    const l = lvl(u.id);
    const maxed = l >= u.max;
    let price = maxed ? 0 : u.prices[l];
    const disc = Save.d.supplier && !maxed;
    if(disc) price = Math.round(price * 0.8 / 10000) * 10000;
    const reqLocked = u.req && G.level < u.req;
    const can = !maxed && !reqLocked && G.money >= price;
    const row = document.createElement('div');
    row.className = 'urow' + (can ? ' can' : '');
    let pips = '';
    for(let i = 0; i < u.max; i++) pips += '<div class="pip' + (i < l ? ' on' : '') + '"></div>';
    row.innerHTML =
      '<div class="uico">' + u.icon + '</div>' +
      '<div class="ubody"><div class="uname">' + u.name + (disc ? ' <span style="color:var(--amber)">🎁</span>' : '') + '</div>' +
      '<div class="ueff">' + u.eff + (reqLocked ? ' — 🔒 نیاز به سطح ' + faNum(u.req) : '') + '</div>' +
      '<div class="pips">' + pips + '</div></div>' +
      '<button class="ubuy' + (maxed ? ' max' : '') + '"' + (can ? '' : ' disabled') + '>' +
      (maxed ? 'حدِ کامل' : fmtK(price) + (disc ? ' 🎁' : '')) + '</button>';
    if(!maxed && !reqLocked){
      row.querySelector('.ubuy').onclick = () => buyUpgrade(u);
    }
    list.appendChild(row);
  }
}
function bindShopChips(){
  document.querySelectorAll('#shopChips .fchip').forEach(ch => {
    ch.onclick = () => {
      G.shopFilter = ch.dataset.f;
      document.querySelectorAll('#shopChips .fchip').forEach(c => c.classList.toggle('on', c === ch));
      Sfx.tickS();
      renderShop();
    };
  });
  const st = $('shopSort');
  if(st) st.onclick = () => {
    G.shopSort = G.shopSort === 'price' ? null : 'price';
    st.classList.toggle('on', G.shopSort === 'price');
    Sfx.tickS();
    renderShop();
  };
}""")

rep("""function buyUpgrade(u){
  const l = lvl(u.id);
  if(l >= u.max) return;
  const price = u.prices[l];
  if(G.money < price) return;
  G.money -= price;
  G.dayStats.spent += price;
  Save.d.up[u.id] = l + 1;
  if(u.id === 'sys' || u.id === 'hall') G.slots = cafeCapacity();
  if(u.id === 'router' && G.activeEvent !== 'outage') G.budget = budget();
  if(u.id === 'wall' || u.id === 'lamp2' || u.id === 'plant2' || u.id === 'poster2') refreshDecor();
  if(u.id === 'tech' || u.id === 'clean' || u.id === 'mgr') toast('🧍 ' + u.name + ' استخدام شد — حقوقِ هفتگی: ' + fmtK(staffWeekly(u.id, l + 1)), 'amber');
  persist();
  Sfx.buy();
  toast(u.icon + ' ' + u.name + ' — لول ' + faNum(l + 1));
  checkAch();
  renderShop();
}""",
"""function buyUpgrade(u){
  const l = lvl(u.id);
  if(l >= u.max) return;
  if(u.req && G.level < u.req){ toast('برای ' + u.name + ' به سطح ' + faNum(u.req) + ' نیاز داری', 'pink'); return; }
  let price = u.prices[l];
  if(Save.d.supplier){
    price = Math.round(price * 0.8 / 10000) * 10000;
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }
  if(G.money < price) return;
  G.money -= price;
  G.dayStats.spent += price;
  Save.d.up[u.id] = l + 1;
  if(u.id === 'sys' || u.id === 'hall' || u.id === 'vipHall'){
    G.slots = cafeCapacity();
    if(u.id === 'vipHall'){ refreshDecor(); toast('💎 سالن VIP افتتاح شد — ۴ میزِ لوکس با تعرفه ×۱٫۴!', 'amber'); }
  }
  if(u.id === 'router' || u.id === 'net'){ if(G.activeEvent !== 'outage' && G.activeEvent !== 'netfault') G.budget = budget(); }
  if(u.id === 'wall' || u.id === 'lamp2' || u.id === 'plant2' || u.id === 'poster2' || u.id === 'pcTier') refreshDecor();
  if(u.id === 'tech' || u.id === 'clean' || u.id === 'mgr' || u.id === 'net' || u.id === 'emgr') toast('🧍 ' + u.name + ' استخدام شد — حقوقِ هفتگی: ' + fmtK(staffWeekly(u.id, l + 1)), 'amber');
  persist();
  Sfx.buy();
  toast(u.icon + ' ' + u.name + ' — لول ' + faNum(l + 1));
  checkAch();
  checkLT();
  renderShop();
}""")

rep("""function openShop(from){
  shopFrom = from || null;
  renderShop();
  $('shop').hidden = false;
}""",
"""function openShop(from){
  shopFrom = from || null;
  G.tutShop = true;
  bindShopChips();
  renderShop();
  $('shop').hidden = false;
}""")

# ---------- ۴) داشبورد: ارزش + ماهانه + رقبا + تورنمنت + نظرات + تجربه ----------
rep("""  const fin = [
    ['درآمد امروز', '+' + fmtK(ds.earned), 'g'],
    ['چای و اسنک', '+' + fmtK(ds.tipEarned), 'g'],
    ['چاپ', '+' + fmtK(ds.printRev || 0), 'g'],
    ['برق', '−' + fmtK(ds.power || 0), 'r'],
    ['حقوق', '−' + fmtK(ds.salary || 0), 'r'],
    ['اینترنت', '−' + fmtK(ds.internet || 0), 'r'],
    ['مواد اولیه', '−' + fmtK(ds.materials || 0), 'r'],
    ['مجموعِ هزینه‌ی امروز', '−' + fmtK((ds.power||0) + (ds.salary||0) + (ds.internet||0) + (ds.materials||0)), 'r'],
  ];
  $('dashFin').innerHTML = fin.map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');""",
"""  const fin = [
    ['درآمد امروز', '+' + fmtK(ds.earned), 'g'],
    ['چای و اسنک', '+' + fmtK(ds.tipEarned), 'g'],
    ['چاپ', '+' + fmtK(ds.printRev || 0), 'g'],
    ['برق', '−' + fmtK(ds.power || 0), 'r'],
    ['حقوق', '−' + fmtK(ds.salary || 0), 'r'],
    ['اینترنت', '−' + fmtK(ds.internet || 0), 'r'],
    ['مواد اولیه', '−' + fmtK(ds.materials || 0), 'r'],
    ['مجموعِ هزینه‌ی امروز', '−' + fmtK((ds.power||0) + (ds.salary||0) + (ds.internet||0) + (ds.materials||0)), 'r'],
    ['ارزشِ تجهیزات', fmtK(equipValue()), 'a'],
    ['ارزشِ کلِ کسب‌وکار', fmtK(equipValue() + Math.max(0, G.money) - (Save.d.bank.debt || 0)), 'a'],
    ['سودِ هفته‌ی قبل', Save.d.weekHist.length ? fmtK(Save.d.weekHist[Save.d.weekHist.length - 1]) : '—', Save.d.weekHist.length && Save.d.weekHist[Save.d.weekHist.length - 1] >= 0 ? 'g' : 'r'],
    ['درآمدِ ماهانه (۴ هفته)', fmtK((Save.d.weekHist || []).slice(-4).reduce((a, b) => a + b, 0)), ''],
  ];
  $('dashFin').innerHTML = fin.map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');""")

rep("""  /* رقبا */
  $('dashRivals').innerHTML = RIVALS.map(r => {
    const rf = Math.round(rivalFame(r.id));
    const mine = Math.round(G.fame);
    const win = mine > rf;
    return '<div class="row"><span>' + r.name + ' <small style="color:#7d8894">· تجهیز ' + faNum(r.eq) + ' · قیمت ×' + faF1(r.price) + '</small></span>' +
      '<b class="' + (win ? 'g' : 'r') + '">' + (win ? 'جلویم ✓ ' : 'عقبم ') + faNum(mine) + ' / ' + faNum(rf) + '</b></div>';
  }).join('');""",
"""  /* رقبا — وضعیتِ کامل */
  $('dashRivals').innerHTML = RIVALS.map(r => {
    const st = rivalState(r.id);
    const rf = Math.round(st.fame);
    const mine = Math.round(G.fame);
    const win = mine > rf;
    const status = !st.alive ? ' <span style="color:var(--red)">🏚 تعطیل</span>'
      : st.ad > 0 ? ' <span style="color:var(--amber)">📣 تبلیغ می‌کند</span>'
      : ' <small style="color:#7d8894">' + r.stratT + '</small>';
    return '<div class="row"><span>' + r.name + status + '<small style="color:#7d8894"> · تجهیز ' + faNum(st.eq) + ' · قیمت ×' + faF1(st.price) + '</small></span>' +
      '<b class="' + (win ? 'g' : 'r') + '">' + (st.alive ? (win ? 'جلویم ✓ ' : 'عقبم ') : '') + faNum(mine) + ' / ' + faNum(rf) + '</b></div>';
  }).join('') + (RIVALS.every(r => !rivalState(r.id).alive) ? '<div class="ueff" style="color:var(--green);text-align:center">مونوپولی محله مالِ توست! 👑</div>' : '');

  /* تورنمنت‌ها */
  $('dashTour').innerHTML = (Save.d.tourPend
    ? '<div class="urow"><div class="uico">🏆</div><div class="ubody"><div class="uname">' + (tourById(Save.d.tourPend) || {}).name + '</div><div class="ueff">فردا برگزار می‌شود — هر گیمرِ راضی ثبت‌نامِ نقدی می‌آورد</div></div><div class="ubuy max">برنامه‌ریزی شد</div></div>'
    : TOURN.map(t => {
      const ok = G.level >= t.req && G.money >= t.cost;
      return '<div class="urow' + (ok ? ' can' : '') + '"><div class="uico">🏆</div>' +
        '<div class="ubody"><div class="uname">' + t.name + (G.level < t.req ? ' — 🔒 سطح ' + faNum(t.req) : '') + '</div>' +
        '<div class="ueff">هزینه ' + fmtK(t.cost) + ' · جایزه ' + fmtK(t.prize) + ' · ثبت‌نامِ هر گیمر ' + fmtK(t.fee) + ' · تا ' + faNum(t.cap) + ' نفر</div></div>' +
        '<button class="ubuy"' + (ok ? '' : ' disabled') + '>برگزاری</button></div>';
    }).join(''));
  const tbs = $('dashTour').querySelectorAll('button.ubuy');
  TOURN.forEach((t, i) => { const b = tbs[i]; if(b) b.onclick = () => { Sfx.tickS(); if(startTournament(t.id)) renderDash(); }; });

  /* نظراتِ مشتریان */
  const ra = reviewAvg();
  $('dashRev').innerHTML =
    '<div class="row"><span>میانگینِ امتیازِ ' + faNum(Save.d.reviews.length) + ' نظر</span><b class="a">' + faF1(ra) + ' / ۵ ★</b></div>' +
    Save.d.reviews.slice(0, 4).map(rv =>
      '<div class="row"><span>' + '★'.repeat(rv.s) + '☆'.repeat(5 - rv.s) + ' <small style="color:#7d8894">' + (KINDS[rv.k] && KINDS[rv.k].t ? KINDS[rv.k].t : 'مشتری') + '</small></span><b style="font-size:10px;color:#cfd8e0">' + rv.txt + '</b></div>'
    ).join('');""")

rep("""  /* کارمندان */
  const st2 = [
    ['🔧 تکنسین', lvl('tech'), 3, staffWeekly('tech', lvl('tech'))],
    ['🧹 نظافت', lvl('clean'), 2, staffWeekly('clean', lvl('clean'))],
    ['📋 مدیر شیفت', lvl('mgr'), 2, staffWeekly('mgr', lvl('mgr'))],
  ];
  $('dashStaff').innerHTML = st2.map(s =>
    '<div class="row"><span>' + s[0] + ' — لول ' + faNum(s[1]) + '/' + faNum(s[2]) + '</span><b class="a">حقوق ' + fmtK(s[3]) + '/هفته</b></div>'
  ).join('');
}""",
"""  /* کارمندان + تجربه */
  const st2 = [
    ['🔧 تکنسین', 'tech', 3],
    ['🧹 نظافت', 'clean', 2],
    ['📋 مدیر شیفت', 'mgr', 2],
    ['🌐 متخصص شبکه', 'net', 2],
    ['🏆 مسئول مسابقات', 'emgr', 2],
  ];
  $('dashStaff').innerHTML = st2.map(s =>
    '<div class="row"><span>' + s[0] + ' — لول ' + faNum(lvl(s[1])) + '/' + faNum(s[2]) + ' <small style="color:#7d8894">· تجربه ' + faNum((Save.d.staffXp && Save.d.staffXp[s[1]]) || 0) + '</small></span><b class="a">حقوق ' + fmtK(staffWeekly(s[1], lvl(s[1]))) + '/هفته</b></div>'
  ).join('');
  /* میزهای فروخته‌شده — بازخرید */
  const sold = [];
  for(let i = 4; i < MAX_SLOTS; i++) if(Save.d.deskOff && Save.d.deskOff[i]) sold.push(i);
  $('dashSell').innerHTML =
    (sold.length
      ? '<div class="ueff" style="margin-bottom:6px;color:var(--amber)">میزهای فروخته‌شده — با ۶۰٪ بهای مدل بازخرید کن:</div>' +
        sold.map(i => '<div class="row"><span>جای میز ' + faNum(i + 1) + '</span>' +
        '<button class="ubuy" data-rebuy="' + i + '"' + (G.money >= rebuyCost(i) ? '' : ' disabled') + '>' + fmtK(rebuyCost(i)) + '</button></div>').join('')
      : '') +
    (sellable.length
      ? '<div class="ueff" style="margin-bottom:6px">میزِ خالیِ اضافه بفروش — ' + faNum(sellable.length) + ' میز (بهای استهلاک‌شده، فقط همان یک میز):</div>' +
        sellable.map(i => '<div class="row"><span>میز ' + faNum(i + 1) + ' · سلامت ' + faNum(Math.round(sysHp(i))) + '٪</span>' +
        '<button class="ubuy" data-sell="' + i + '">بفروش</button></div>').join('')
      : (sold.length ? '' : '<div class="ueff" style="text-align:center;color:#7d8894">میزِ خالیِ قابلِ فروشی نیست</div>'));
  const rbs = $('dashSell').querySelectorAll('button[data-rebuy]');
  rbs.forEach(b => { b.onclick = () => { const i = +b.dataset.rebuy; if(rebuyDesk(i)) renderDash(); }; });
  const sbs = $('dashSell').querySelectorAll('button[data-sell]');
  sbs.forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.sell;
      const s = G.systems[i];
      if(s.kind){ toast('اول مشتریِ آن میز را بفرست', 'pink'); return; }
      if(sellDesk(i)){ G.slots = cafeCapacity(); renderDash(); }
    };
  });
}""")

# ---------- ۵) ماموریت‌های بلندمدت ----------
rep("""  const al = $('achList');
  al.innerHTML = '';""",
"""  /* اهدافِ بلندمدت */
  $('ltList').innerHTML = MISSIONS_LT.map(m => {
    const done = Save.d.ltDone.includes(m.id);
    return '<div class="urow"><div class="uico">' + (done ? '✅' : m.icon) + '</div>' +
      '<div class="ubody"><div class="uname">' + m.t + '</div><div class="ueff">پاداشِ ' + fmtK(m.r) + '</div></div>' +
      '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:' + (done ? 'var(--green)' : 'var(--dim)') + '">' + (done ? '✓' : '—') + '</div></div>';
  }).join('');
  const al = $('achList');
  al.innerHTML = '';""")

# ---------- ۶) آموزشِ تعاملی ----------
rep("""/* ================= ذخیره‌ی کم‌تواتر ================= */""",
"""/* ================= آموزشِ تعاملی ================= */
const TUT = [
  { t:'به کافه‌نت خوش آمدی، رئیس! مشتری‌ها وارد می‌شوند و سرِ میزها می‌نشینند… صبر کن اولین مشتری بنشیند.', chk: () => G.systems.some(s => s.kind) },
  { t:'حالا اسلایدرِ زیرِ میز را بکش تا به «نیازِ» مشتری برسد — خطِ کوچک روی ریل، نیازِ او را نشان می‌دهد.', chk: () => G.systems.some(s => s.kind && s.kind !== 'print' && s.alloc >= s.need) },
  { t:'وقتی کارش تمام شد پول می‌گیری. با لمسِ ☕ روی سرِ مشتری (یا دکمه‌ی ☕) چای بده — انعام می‌آورد و صبرش را پر می‌کند.', chk: () => (G.runStats.teas || 0) >= 1 || G.dayStats.tipEarned > 0 },
  { t:'از دکمه‌ی 🛠 ارتقا بخر؛ بانک و تورنمنت هم داخلِ 📊 داشبورد است. میزِ سالن VIP و کیفیتِ سیستم‌ها هم این‌جاست.', chk: () => !!G.tutShop },
  { t:'هر روز سه تصمیمِ اخلاقی، هر هفته اجاره. حالا کافه مالِ توست — موفق باشی! 🎉', chk: () => true },
];
let tutI = 0, tutT = 0;
function tickTutorial(dt){
  if(Save.d.seenTut || G.scene !== 'day') return;
  const el = $('tut');
  if(!el) return;
  if(el.hidden){ el.hidden = false; renderTut(); }
  tutT += dt;
  if(tutT < 0.5) return;
  tutT = 0;
  if(TUT[tutI] && TUT[tutI].chk()){
    tutI++;
    if(tutI >= TUT.length){ finishTut(); return; }
    renderTut();
    Sfx.tickS();
  }
}
function renderTut(){
  const el = $('tut');
  if(!el || tutI >= TUT.length) return;
  $('tutTxt').textContent = TUT[tutI].t;
  $('tutDots').textContent = TUT.map((_, i) => i < tutI ? '●' : '○').join(' ');
}
function finishTut(){
  Save.d.seenTut = true;
  persist();
  const el = $('tut');
  if(el) el.hidden = true;
  Sfx.mission();
}

/* ================= ذخیره‌ی کم‌تواتر ================= */""")

rep("""  const running = G.scene === 'day' && !G.paused && !G.userPaused && !G.frozen && !anyModalOpen();
  if(document.hidden){ last = ts; requestAnimationFrame(frame); return; }""",
"""  const running = G.scene === 'day' && !G.paused && !G.userPaused && !G.frozen && !anyModalOpen();
  if(document.hidden){ last = ts; requestAnimationFrame(frame); return; }
  if(G.scene === 'day'){ try{ tickTutorial(rdt); }catch(e){} }""")

rep("""function init(){
  Save.load();
  G.runStats = Save.d.stats;""",
"""function init(){
  Save.load();
  if(Save.d.seenTut){ tutI = TUT.length; }
  G.runStats = Save.d.stats;""")

io.open('p5_ui.js', 'w', encoding='utf-8').write(p)
print('patch10 ui OK')
