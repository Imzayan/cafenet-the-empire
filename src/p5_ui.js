<script>
/* ============================================================
   کافه‌نت — ورودی لمسی · صفحات DOM · حلقه‌ی اصلی
   ============================================================ */

/* ================= گیتِ کلی ================= */
const OVERLAYS = ['modal','shop','quests','summary','weekend','gameover','pause','menu','premium','crown'];
function anyModalOpen(){ return OVERLAYS.some(id => !$(id).hidden); }
function hideFade(id){
  const el = $(id);
  if(el.hidden) return;
  el.classList.add('bye');
  setTimeout(() => { el.hidden = true; el.classList.remove('bye'); }, 220);
}

/* ================= ورودی لمسی ================= */
function hitSliderBand(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];
    if(!s.kind || s.kind === 'print' || s.virus || s.rebootT > 0) continue;
    const p = deskPos(i);
    if(x > p.x - 32 && x < p.x + 32 && y > p.y + 22 && y < p.y + 52) return i;
  }
  return -1;
}
function hitMonitor(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];
    if(!s.kind) continue;
    const p = deskPos(i);
    if(x > p.x - 20 && x < p.x + 20 && y > p.y - 12 && y < p.y + 14) return i;
  }
  return -1;
}
function hitCustomerHead(x, y){
  for(let i = 0; i < MAX_SLOTS; i++){
    if(!deskOn(i)) continue;
    const s = G.systems[i];
    if(!s.kind || !s.person || s.person.state !== 'sit') continue;
    const p = deskPos(i);
    if(Math.hypot(x - p.x, y - (p.y - 38)) < 19) return i;
  }
  return -1;
}
function hitButton(x, y){
  if(!HIT.list) return null;
  for(const b of HIT.list){
    if(x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return b.id;
  }
  // نوار ماموریت
  if(x > 16 && x < 344 && y > 478 && y < 506) return 'quests';
  return null;
}
G.pins = new Map();
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
  if(btn === 'tabC'){ G.cam.target = WORLD_W - VW; Sfx.tickS(); return; }
  if(btn === 'shop'){ G.tapFx = { id:'shop', t:0.28 }; Sfx.tickS(); openShop(); return; }
  if(btn === 'quests'){ G.tapFx = { id:'quests', t:0.28 }; Sfx.tickS(); openQuests(); return; }
  if(btn === 'dash'){ G.tapFx = { id:'dash', t:0.28 }; Sfx.tickS(); openDash(); return; }
  if(btn === 'tea'){ G.tapFx = { id:'tea', t:0.28 }; serveThirstiest(); return; }
  // گربه‌ی کافه
  if(G.cat && G.cat.on && Math.abs(wx - G.cat.x) < 18 && v.y > 348 && v.y < 392){
    G.cat.stop = 1;
    G.cat.bub = { txt: 'میو!', t: 1.1 };
    for(let i = 0; i < 2; i++) G.particles.push({ type:'heart', x: G.cat.x + rnd(-4, 4), y: 354, vx: rnd(-6, 6), vy: -26, life: 0.9, delay: i * 0.12 });
    G.runStats.catPats++;
    Sfx.tickS();
    return;
  }
  const si = hitSliderBand(wx, v.y);
  if(si >= 0){
    const p = deskPos(si);
    const tx = p.x - 26, tw = 52;
    setAlloc(si, (wx - tx) / tw * 100);
    G.drag = { si, id: e.pointerId };
    try{ cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }catch(err){}
    Sfx.tickS();
    return;
  }
  const head = hitCustomerHead(wx, v.y);
  if(head >= 0){ serveTea(G.systems[head].person); return; }
  const mon = hitMonitor(wx, v.y);
  if(mon >= 0 && G.systems[mon].virus){ rebootSystem(mon); G.shake = 0.35; return; }
  if(mon >= 0 && sysHp(mon) < 55 && !G.systems[mon].kind){
    openRepair(mon);
    return;
  }
  // کشیدنِ زمین = جابه‌جایی دوربین
  G.pan = { x0: v.x, cam0: G.cam.x, id: e.pointerId };
});
cv.addEventListener('pointermove', e => {
  if(G.pins && G.pins.has(e.pointerId)){
    G.pins.set(e.pointerId, vxy(e));
    if(G.pinch && G.pins.size === 2){
      const ps = [...G.pins.values()];
      const d = Math.max(20, Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y));
      setZoom(G.pinch.z0 * d / G.pinch.d0);
      return;
    }
  }
  if(G.drag && e.pointerId === G.drag.id){
    const v = vxy(e);
    const p = deskPos(G.drag.si);
    const tx = p.x - 26, tw = 52;
    const before = G.systems[G.drag.si].alloc;
    setAlloc(G.drag.si, (v.x + G.cam.x - tx) / tw * 100);
    if(G.systems[G.drag.si].alloc !== before) Sfx.tickS();
    return;
  }
  if(G.pan && e.pointerId === G.pan.id){
    const v = vxy(e);
    G.cam.x = clamp(G.pan.cam0 - (v.x - G.pan.x0), 0, WORLD_W - VW);
    G.cam.target = G.cam.x;
  }
});
const endDrag = e => {
  if(G.pins && e && G.pins.has(e.pointerId)) G.pins.delete(e.pointerId);
  if(G.pins && G.pins.size < 2) G.pinch = null;
  if(G.drag && (!e || e.pointerId === G.drag.id)) G.drag = null;
  if(G.pan && (!e || e.pointerId === G.pan.id)) G.pan = null;
};
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);

/* ================= مغازه‌ی ارتقا ================= */
let shopFrom = null;
function openShop(from){
  shopFrom = from || null;
  G.tutShop = true;
  bindShopChips();
  renderShop();
  $('shop').hidden = false;
}
G.shopFilter = 'all';
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
}
function buyUpgrade(u){
  const l = lvl(u.id);
  if(l >= u.max) return;
  if(u.req && G.level < u.req){ toast('برای ' + u.name + ' به سطح ' + faNum(u.req) + ' نیاز داری', 'pink'); return; }
  let price = u.prices[l];
  if(G.money < price) return; // پولِ کافی بدونِ تخفیف لازم است — تخفیف فقط با خریدِ واقعی مصرف می‌شود
  if(Save.d.supplier){
    price = Math.round(price * 0.8 / 10000) * 10000;
    Save.d.supplier = false;
    toast('🎁 تخفیفِ تأمین‌کننده روی این خرید اعمال شد', 'amber');
  }
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
}

/* ================= فروشگاه پرمیوم ================= */
const PREMIUM = [
  { id:'skin_gold',   t:'پوسته‌ی طلایی', d:'نئون، HUD و تمام رنگ‌های کافه طلایی می‌شوند', cost:8, type:'skin', v:'gold', icon:'🟡' },
  { id:'skin_violet', t:'پوسته‌ی بنفش',  d:'نئون و تمام رنگ‌های کافه بنفشِ رویایی می‌شوند', cost:8, type:'skin', v:'violet', icon:'🟣' },
  { id:'turbo',       t:'توربو اسلایدر', d:'دانلود و گیم ۲۵٪ سریع‌تر — برای همیشه', cost:6, type:'turbo', icon:'⚡' },
];
function applySkin(){
  try{ document.body.dataset.skin = (Save.d.skin && Save.d.skin !== 'classic') ? Save.d.skin : ''; }catch(e){}
  try{ if(typeof buildBG === 'function') buildBG(); }catch(e){}
}
function openPremium(){ renderPremium(); $('premium').hidden = false; }
function renderPremium(){
  $('prCoins').textContent = 'سکه: ' + faNum(Save.d.coins) + ' 🪙';
  const list = $('prList');
  list.innerHTML = '';
  for(const it of PREMIUM){
    const owned = Save.d.powned.includes(it.id);
    const equipped = (it.type === 'skin' && Save.d.skin === it.v) || (it.type === 'turbo' && Save.d.turbo);
    const row = document.createElement('div');
    row.className = 'urow' + (owned ? ' can' : '');
    let btn;
    if(equipped) btn = '<div class="ubuy max">در حال استفاده</div>';
    else if(owned && it.type === 'skin') btn = '<button class="ubuy">استفاده</button>';
    else if(owned && it.type === 'turbo') btn = '<div class="ubuy max">فعال ✓</div>';
    else btn = '<button class="ubuy"' + (Save.d.coins >= it.cost ? '' : ' disabled') + '>' + faNum(it.cost) + ' 🪙</button>';
    row.innerHTML =
      '<div class="uico">' + it.icon + '</div>' +
      '<div class="ubody"><div class="uname">' + it.t + '</div>' +
      '<div class="ueff">' + it.d + '</div></div>' + btn;
    const b = row.querySelector('button');
    if(b) b.onclick = () => buyPremium(it);
    list.appendChild(row);
  }
}
function buyPremium(it){
  if(it.type === 'skin' && Save.d.powned.includes(it.id)){
    Save.d.skin = it.v; applySkin(); persist(); Sfx.tickS(); renderPremium();
    return;
  }
  if(Save.d.powned.includes(it.id) || Save.d.coins < it.cost) return;
  Save.d.coins -= it.cost;
  Save.d.powned.push(it.id);
  if(it.type === 'skin'){ Save.d.skin = it.v; applySkin(); }
  if(it.type === 'turbo') Save.d.turbo = true;
  persist(); Sfx.buy();
  toast('🪙 ' + it.t + ' — فعال شد', 'amber');
  renderPremium();
}

/* ================= تعمیرِ میز ================= */
function openRepair(i){
  const cost = repairCost(i);
  openModal('🔧', 'میزِ ' + faNum(i + 1) + ' به تعمیر نیاز دارد — سلامتِ فعلی: ' + faNum(Math.round(sysHp(i))) + '٪. تجهیزاتِ فرسوده سرعتِ سرویس را می‌کاهند.',
    { t:'تعمیر کامل — ' + fmtK(cost), chips:'سلامت ۱۰۰٪ · سرویسِ پرسرعت', hot: false,
      fx(){ repairDesk(i); } },
    { t:'بعداً', chips:'وضعیت همین‌طور می‌ماند', fx(){} });
}

/* ================= داشبوردِ مدیریتی ================= */
function openDash(){
  $('dashMoney').textContent = 'موجودی: ' + fmtK(G.money);
  renderDash();
  $('dash').hidden = false;
}
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
    ['مرحله', stageInfo().t, ''],
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
    ['ارزشِ تجهیزات', fmtK(equipValue()), 'a'],
    ['ارزشِ کلِ کسب‌وکار', fmtK(equipValue() + Math.max(0, G.money) - (Save.d.bank.debt || 0)), 'a'],
    ['سودِ هفته‌ی قبل', Save.d.weekHist.length ? fmtK(Save.d.weekHist[Save.d.weekHist.length - 1]) : '—', Save.d.weekHist.length && Save.d.weekHist[Save.d.weekHist.length - 1] >= 0 ? 'g' : 'r'],
    ['درآمدِ ماهانه (۴ هفته)', fmtK((Save.d.weekHist || []).slice(-4).reduce((a, b) => a + b, 0)), ''],
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
  /* رقبا — وضعیتِ کامل */
  $('dashRivals').innerHTML = RIVALS.map(r => {
    const st = rivalState(r.id);
    const rf = Math.round(st.fame);
    const mine = Math.round(G.fame);
    const win = mine > rf;
    const status = !st.alive ? ' <span style="color:var(--red)">🏠 تعطیل</span>'
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
  const hrD = G.dayStats.hallRev || { h1: 0, h2: 0, vip: 0 };
  $('dashRev').innerHTML =
    '<div class="row"><span>درآمدِ سالنِ اصلی (امروز)</span><b class="a">' + fmtK(hrD.h1) + '</b></div>' +
    (lvl('hall') ? '<div class="row"><span>درآمدِ سالنِ گیم (امروز)</span><b class="a">' + fmtK(hrD.h2) + '</b></div>' : '') +
    (lvl('vipHall') ? '<div class="row"><span>درآمدِ سالنِ VIP (امروز)</span><b class="a">' + fmtK(hrD.vip) + '</b></div>' : '') +
    (lvl('console') ? '<div class="row"><span>درآمدِ گوشه‌ی کنسول (امروز)</span><b class="a">' + fmtK(G.dayStats.consoleRev || 0) + '</b></div>' : '') +
    '<div class="row"><span>میانگینِ امتیازِ ' + faNum(Save.d.reviews.length) + ' نظر</span><b class="a">' + faF1(ra) + ' / ۵ ★</b></div>' +
    Save.d.reviews.slice(0, 4).map(rv =>
      '<div class="row"><span>' + '★'.repeat(rv.s) + '☆'.repeat(5 - rv.s) + ' <small style="color:#7d8894">' + (rv.n ? rv.n + ' · ' : '') + (KINDS[rv.k] && KINDS[rv.k].t ? KINDS[rv.k].t : 'مشتری') + '</small></span><b style="font-size:10px;color:#cfd8e0">' + rv.txt + '</b></div>'
    ).join('');
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
  /* فروشِ میزِ اضافی + بازخرید */
  const sellable = [];
  for(let i = 4; i < MAX_SLOTS; i++) if(deskOn(i) && !G.systems[i].kind) sellable.push(i);
  /* کارمندان + تجربه */
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

/* ================= ماموریت‌ها ================= */
function openQuests(){
  renderQuests();
  $('quests').hidden = false;
}
function renderQuests(){
  $('qLevel').textContent = 'سطح ' + faNum(G.level) + ' — ' + titleFor(G.level);
  const need = xpNext(G.level);
  $('qSub').innerHTML = G.level >= 10
    ? 'به سقفِ افسانه رسیدی — حالا فقط شهرت و میراث بالا می‌رود.'
    : 'XP تا سطح بعد: ' + faNum(G.xp) + ' / ' + faNum(need);
  const ql = $('questList');
  ql.innerHTML = '';
  for(const id of Save.d.missions){
    const m = MISSION_BY_ID[id];
    if(!m) continue;
    const v = missionValue(m);
    const done = v >= m.goal;
    const row = document.createElement('div');
    row.className = 'urow' + (done ? ' done' : '');
    row.innerHTML =
      '<div class="uico">' + m.icon + '</div>' +
      '<div class="ubody"><div class="uname">' + m.t + '</div>' +
      '<div class="ueff">' + faNum(Math.min(v, m.goal)) + ' / ' + faNum(m.goal) + ' · پاداش ' + fmtK(m.r) + '</div></div>' +
      '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:' + (done ? 'var(--green)' : 'var(--dim)') + '">' + (done ? '✓ آماده' : 'در جریان') + '</div>';
    ql.appendChild(row);
  }
  const st = G.runStats;
  const cs = cafeStars();
  const rep = [
    ['رتبه در محله', '№' + faNum(cafeRank()) + ' از ۹۸', 'a'],
    ['ستاره‌های کافه', '★'.repeat(cs) + '☆'.repeat(5 - cs), 'a'],
    ['مجموع مشتریِ راضی', faNum(st.served), ''],
    ['مجموع درآمد', fmtK(st.revenue), 'g'],
    ['بهترین روز', fmtK(st.bestDay), ''],
    ['چای سرو‌شده', faNum(st.teas), ''],
    ['اسنک سرو‌شده', faNum(st.snacks), ''],
    ['لَن‌پارتیِ موفق', faNum(st.lans), ''],
    ['پتِ گربه', faNum(st.catPats) + ' 😻', ''],
  ];
  $('reportList').innerHTML = rep.map(r => '<div class="row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + '</b></div>').join('');
  $('crownList').innerHTML = CROWN.map(c => {
    const v = clamp(c.p(), 0, 1);
    return '<div class="clRow"><small>' + (v >= 1 ? '✅ ' : '') + c.t + '</small>' +
      '<div class="clBar"><i style="width:' + Math.round(v * 100) + '%"></i></div>' +
      '<b>' + faNum(Math.round(v * 100)) + '٪</b></div>';
  }).join('');
  /* ماموریتِ هفتگی */
  const wm = MISSIONS_W.find(m => !Save.d.mWDone.includes(m.id)) || MISSIONS_W[0];
  $('weekMission').innerHTML = '<div class="urow"><div class="uico">' + wm.icon + '</div>' +
    '<div class="ubody"><div class="uname">' + wm.t + '</div><div class="ueff">پاداشِ ' + fmtK(wm.r) + ' — هنگامِ پرداختِ اجاره داوری می‌شود</div></div>' +
    '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:var(--cyan)">هفتگی</div></div>';
  /* اهدافِ بلندمدت */
  $('ltList').innerHTML = MISSIONS_LT.map(m => {
    const done = Save.d.ltDone.includes(m.id);
    return '<div class="urow"><div class="uico">' + (done ? '✅' : m.icon) + '</div>' +
      '<div class="ubody"><div class="uname">' + m.t + '</div><div class="ueff">پاداشِ ' + fmtK(m.r) + '</div></div>' +
      '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:' + (done ? 'var(--green)' : 'var(--dim)') + '">' + (done ? '✓' : '—') + '</div></div>';
  }).join('');
  const al = $('achList');
  al.innerHTML = '';
  for(const a of ACH){
    const got = Save.d.ach.includes(a.id);
    const row = document.createElement('div');
    row.className = 'urow';
    row.style.opacity = got ? '1' : '.45';
    row.innerHTML =
      '<div class="uico">' + (got ? '🏆' : '🔒') + '</div>' +
      '<div class="ubody"><div class="uname">' + a.t + '</div>' +
      '<div class="ueff">شهرت +' + faNum(a.fame) + '</div></div>' +
      '<div class="ubuy" style="border-color:rgba(255,255,255,.15);color:' + (got ? 'var(--amber)' : 'var(--dim)') + '">' + (got ? '✓' : '—') + '</div>';
    al.appendChild(row);
  }
}

/* ================= دکمه‌ها ================= */
function syncSoundBtn(){
  $('btnSound').classList.toggle('on', Save.d.sound);
  $('btnSound').textContent = Save.d.sound ? '🔈' : '🔇';
}
function refreshMenu(){
  const s = Save.d;
  const hasRun = s.day > 1 || s.week > 1 || s.money > 0;
  $('btnCont').hidden = !hasRun;
  if(hasRun){
    $('btnCont').textContent = 'ادامه — هفته ' + faNum(s.week) + ' روز ' + faNum(s.day) + ' · ' + fmtK(s.money);
  }
  $('btnPrem').textContent = '🪙 پرمیوم' + (s.coins ? ' — ' + faNum(s.coins) + ' سکه' : '');
  const fame = s.fame || 40, lv = Math.min(10, s._level || 1);
  const stars = clamp(Math.round(fame / 20), 1, 5);
  const rank = s.crowned ? 1 : Math.max(2, 99 - Math.round(fame) - 2 * ((s.stats && s.stats.weeksPaid) || 0) - 2 * lv);
  const st = [
    ['سطح ' + faNum(lv), titleFor(lv)],
    ['★'.repeat(stars) + '☆'.repeat(5 - stars), 'اعتبارِ کافه'],
    [faNum(s.coins || 0) + ' 🪙', 'سکه'],
    ['№' + faNum(rank), 'رتبه در محله'],
  ];
  $('statStrip').innerHTML = st.map(x => '<div><b>' + x[0] + '</b><small>' + x[1] + '</small></div>').join('');
  const pct = Math.round(crownPct() * 100);
  $('crownPct').textContent = faNum(pct) + '٪';
  $('crownRing').style.background = 'conic-gradient(#ffd75f 0 ' + pct + '%, rgba(255,255,255,.08) ' + pct + '% 100%)';
  $('crownNext').textContent = s.crowned ? 'تاج بر سر است — افسانه‌ی محله!' : 'هدفِ بعدی: ' + crownNext();
  const lp = 0.06 * ((s.stats && s.stats.weeksPaid) || 0);
  $('menuLegacy').textContent = lp > 0
    ? '👑 میراث: +' + faF1(lp * 100) + '٪ درآمد · دستاورد: ' + faNum(s.ach.length) + '/' + faNum(ACH.length)
    : '';
}
function goMenu(){
  G.scene = 'menu';
  G.cam.x = 0; G.cam.target = 0;
  persist();
  ['modal','shop','quests','summary','weekend','gameover','pause','dash'].forEach(id => $(id).hidden = true);
  $('cornerL').hidden = true;
  $('menu').hidden = false;
  refreshMenu();
}
function bindUI(){
  $('btnStart').onclick = () => { Sfx.init(); Sfx.resume(); Sfx.tickS(); newGame(false); };
  $('btnCont').onclick = () => { Sfx.init(); Sfx.resume(); Sfx.tickS();
    G.week = Save.d.week; G.day = Save.d.day; G.money = Save.d.money; G.fame = Save.d.fame; G.xp = Save.d.xp;
    G.runStats = Save.d.stats;
    G.level = Math.max(1, Math.min(10, Save.d._level || 1));
    startDay(); };
  $('btnHow').onclick = () => {
    const el = $('menuLegacy');
    if(el.dataset.how === '1'){ el.dataset.how = '0'; refreshMenu(); return; }
    el.dataset.how = '1';
    el.style.color = '#7d8894';
    el.innerHTML = 'میزها را با اسلایدرِ زیرِ هر میز پهنای باند بده — نیازِ هر مشتری با خطِ کوچک روی ریل نشان داده شده.' +
      '<br>حلقه‌ی دور سر = صبر: سبز امن، قرمز خطر. ☕ روی سر مشتری = چای (انعام + آرامش).' +
      '<br>⚠ ویروس = لمسِ مانیتور. هر روز ۳ تصمیمِ اخلاقی؛ رشوه امشب راحت است، بازرسِ فردا سختیگیر.' +
      '<br>هدف هر هفته: پرداخت اجاره. ارتقاها می‌مانند و کافه را هفته‌به‌هفته افسانه می‌کنند.';
    Sfx.tickS();
  };
  document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    if(!$('shop').hidden){ Sfx.tickS(); hideFade('shop'); return; }
    if(!$('dash').hidden){ Sfx.tickS(); hideFade('dash'); return; }
    if(G.userPaused && !$('pause').hidden){ G.userPaused = false; hideFade('pause'); return; }
  });
  $('btnPause').onclick = () => { Sfx.tickS(); G.userPaused = true; $('pause').hidden = false; };
  $('btnResume').onclick = () => { Sfx.tickS(); G.userPaused = false; hideFade('pause'); };
  $('btnSaveMan').onclick = () => { Sfx.tickS(); persist(); toast('💾 بازی ذخیره شد', 'amber'); };
  $('btnToMenu').onclick = () => { G.userPaused = false; goMenu(); };
  $('btnSound').onclick = () => {
    Save.d.sound = !Save.d.sound; Save.save(); syncSoundBtn();
    Sfx.init(); Sfx.resume(); if(Save.d.sound) Sfx.tickS(); else Sfx.stopMusic();
  };
  $('volS').value = Math.round((Save.d.volS !== undefined ? Save.d.volS : 0.8) * 100);
  $('volM').value = Math.round((Save.d.volM !== undefined ? Save.d.volM : 0.5) * 100);
  $('volS').oninput = e => { Sfx.setVolS(+e.target.value / 100); };
  $('volM').oninput = e => { Sfx.setVolM(+e.target.value / 100); if(Save.d.music && Save.d.sound) Sfx.startMusic(); };
  $('shopClose').onclick = () => {
    hideFade('shop');
    if(shopFrom === 'weekend'){ shopFrom = null; showWeekend(); }
  };
  $('questClose').onclick = () => { hideFade('quests'); };
  $('dashClose').onclick = () => { Sfx.tickS(); hideFade('dash'); };
  $('tutSkip').onclick = () => { Sfx.tickS(); tutI = TUT.length; finishTut(); };
  $('btnPrem').onclick = () => { Sfx.init(); Sfx.resume(); Sfx.tickS(); openPremium(); };
  $('prClose').onclick = () => { Sfx.tickS(); hideFade('premium'); };
  $('crownClose').onclick = () => { Sfx.tickS(); hideFade('crown'); };
  const canOpenRun = () => Save.d.day > 1 || Save.d.week > 1 || Save.d.money > 0;
  $('btnShop2').onclick = () => { Sfx.tickS(); if(!canOpenRun()){ toast('اول کافه را باز کن — یک روز کار کن'); return; } G.money = Save.d.money; openShop(); };
  $('btnQuests2').onclick = () => { Sfx.tickS(); if(!canOpenRun()){ toast('اول کافه را باز کن — یک روز کار کن'); return; } openQuests(); };
  $('sumNext').onclick = () => { Sfx.tickS(); nextDay(); };
  $('wkPay').onclick = () => { Sfx.tickS(); payRent(); };
  $('wkShop').onclick = () => {
    Sfx.tickS();
    if($('wkShop').dataset.mode === 'give'){ gameOver(); return; }
    $('weekend').hidden = true; openShop('weekend');
  };
  $('goRestart').onclick = () => { Sfx.tickS(); restartWithLegacy(); };
  document.addEventListener('visibilitychange', () => {
    if(document.hidden && G.scene === 'day'){ G.userPaused = true; $('pause').hidden = false; persist(); }
  });
  window.addEventListener('beforeunload', () => { try{ persist(); }catch(e){} });
}

/* ================= آموزشِ تعاملی ================= */
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

/* ================= ذخیره‌ی کم‌تواتر ================= */
let saveTmr = null;
function saveSoon(){
  if(saveTmr) return;
  saveTmr = setTimeout(() => { saveTmr = null; persist(); }, 2000);
}

/* ================= حلقه‌ی اصلی ================= */
let last = 0, frames = 0;
function frame(ts){
  const rdt = clamp((ts - last) / 1000, 0, 0.05);
  last = ts;
  const dt = rdt * G.ts;
  frames++;
  const running = G.scene === 'day' && !G.paused && !G.userPaused && !G.frozen && !anyModalOpen();
  if(document.hidden){ last = ts; requestAnimationFrame(frame); return; }
  if(G.scene === 'day'){ try{ tickTutorial(rdt); }catch(e){} }
  if(running){
    frames % 600 === 0 && saveSoon();
    try{ tick(dt); }catch(e){ console.error('tick', e); }
  } else if(G.scene === 'menu'){
    // کافه‌ی زنده پشت منو
    G.t += dt;
    try{ tickAmbient(dt); tickParticles(dt); }catch(e){}
  }
  try{ render(rdt); }catch(e){ console.error('render', e); }
  requestAnimationFrame(frame);
}

/* ================= شروع ================= */
function init(){
  Save.load();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try{ buildBG(); }catch(e){} });
  if(Save.d.seenTut){ tutI = TUT.length; }
  G.runStats = Save.d.stats;
  applySkin();
  G.level = Math.max(1, Math.min(10, Save.d._level || 1));
  G.week = Save.d.week; G.day = Save.d.day; G.money = Save.d.money; G.fame = Save.d.fame; G.xp = Save.d.xp;
  Sfx.init();
  if(Sfx.sfxG) Sfx.sfxG.gain.value = Save.d.volS !== undefined ? Save.d.volS : 0.8;
  if(Sfx.musG) Sfx.musG.gain.value = (Save.d.volM !== undefined ? Save.d.volM : 0.5) * 0.55;
  syncSoundBtn();
  bindUI();
  resize();
  refreshMenu();
  G.slots = cafeCapacity();
  buildAmbient(); // کافه از همان منو زنده است
  requestAnimationFrame(frame);
}
document.addEventListener('DOMContentLoaded', init);
</script>
</body>
</html>
