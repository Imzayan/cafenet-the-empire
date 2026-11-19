# -*- coding: utf-8 -*-
# پچ ۹ — صحنه: زوم + VIP/pcTier روی میزها + محیطِ حرفه‌ای + ساعتِ واقعی + تبِ سوم
import io
p = io.open('p4_scene.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) زومِ دوربین ----------
rep("""let scale = 1, ox = 0, oy = 0, dpr = 1;
let bgCanvas = null, vignCanvas = null;""",
"""let scale = 1, ox = 0, oy = 0, dpr = 1;
let bgCanvas = null, vignCanvas = null;
G.zoom = 1;
const ZC = { x: 180, y: 330 };
function setZoom(z){
  G.zoom = clamp(Math.round(z * 20) / 20, 1, 1.8);
  Sfx.tickS();
}
cv.addEventListener('wheel', e => {
  if(G.scene !== 'day') return;
  e.preventDefault();
  setZoom((G.zoom || 1) + (e.deltaY < 0 ? 0.15 : -0.15));
}, { passive: false });""")

rep("""function vxy(e){
  const r = cv.getBoundingClientRect();
  const d = cv.width / r.width;
  return { x: ((e.clientX - r.left) * d - ox) / scale, y: ((e.clientY - r.top) * d - oy) / scale };
}""",
"""function vxy(e){
  const r = cv.getBoundingClientRect();
  const d = cv.width / r.width;
  let x = ((e.clientX - r.left) * d - ox) / scale;
  let y = ((e.clientY - r.top) * d - oy) / scale;
  const z = G.zoom || 1;
  if(z !== 1){ x = ZC.x + (x - ZC.x) / z; y = ZC.y + (y - ZC.y) / z; }
  return { x, y };
}""")

# ---------- ۲) صحنه: زوم + همه‌ی میزها + floaters داخلِ دنیا ----------
rep("""function drawScene(){
  ctx.save();
  ctx.translate(-G.cam.x, 0);
  if(bgCanvas) ctx.drawImage(bgCanvas, -ox / scale - 20, -oy / scale, bgCanvas.width / scale, bgCanvas.height / scale);""",
"""function drawScene(){
  ctx.save();
  const z = G.zoom || 1;
  if(z !== 1){
    ctx.translate(ZC.x, ZC.y);
    ctx.scale(z, z);
    ctx.translate(-ZC.x, -ZC.y);
  }
  ctx.translate(-G.cam.x, 0);
  if(bgCanvas) ctx.drawImage(bgCanvas, -ox / scale - 20, -oy / scale, bgCanvas.width / scale, bgCanvas.height / scale);""")

rep("""  drawLamps();
  for(let i = 0; i < 16; i++) drawDesk(i);
  drawPrintStation();
  for(const p of G.people) if(p.type !== 'cust') drawPerson(p);
  drawQueuePeople();
  for(const p of G.people) if(p.type === 'cust') drawPerson(p);
  drawCat();
  drawStaff();
  drawParticles();
  ctx.restore();
}""",
"""  drawLamps();
  for(let i = 0; i < MAX_SLOTS; i++) drawDesk(i);
  drawPrintStation();
  for(const p of G.people) if(p.type !== 'cust') drawPerson(p);
  drawQueuePeople();
  for(const p of G.people) if(p.type === 'cust') drawPerson(p);
  drawCat();
  drawStaff();
  drawParticles();
  drawFloaters();
  ctx.restore();
}""")

rep("""  drawScene();
  if(vignCanvas) ctx.drawImage(vignCanvas, -ox / scale, -oy / scale, cv.width / scale, cv.height / scale);
  drawFloaters();
  drawComboFlame();""",
"""  drawScene();
  if(vignCanvas) ctx.drawImage(vignCanvas, -ox / scale, -oy / scale, cv.width / scale, cv.height / scale);
  drawComboFlame();""")

# ---------- ۳) میز: فروخته‌شده + VIP + pcTier + بوتِ مانیتور ----------
rep("""function drawDesk(i){
  const s = G.systems[i];
  const p = deskPos(i);
  const x = p.x, y = p.y;
  if(s.kind && !s.virus){""",
"""function drawDesk(i){
  const s = G.systems[i];
  const p = deskPos(i);
  const x = p.x, y = p.y;
  const isVip = i >= 16;
  /* میزِ فروخته‌شده — جایِ خالیِ مشخص */
  if(!deskOn(i) && i < unlockedRange()){
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(242,193,78,.4)'; ctx.lineWidth = 1;
    rr(x - 24, y - 30, 48, 46, 5); ctx.stroke();
    ctx.setLineDash([]);
    faText('فروخته‌شده', x, y - 8, 7, 'rgba(242,193,78,.5)', 'center');
    faText('از داشبورد بازخرید کن', x, y + 6, 6.5, 'rgba(255,255,255,.25)', 'center');
    ctx.globalAlpha = 1;
    return;
  }
  if(s.kind && !s.virus){""")

rep("""  const locked = i >= G.slots;
  if(locked){
    ctx.globalAlpha = 0.32;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    rr(x - 24, y - 30, 48, 46, 5); ctx.stroke();
    ctx.setLineDash([]);
    drawIcon('lock', x, y - 8, 5, 'rgba(255,255,255,.45)');
    faText('ارتقا', x, y + 6, 7.5, 'rgba(255,255,255,.35)', 'center');
    ctx.globalAlpha = 1;
    return;
  }""",
"""  const locked = i >= unlockedRange();
  if(locked){
    ctx.globalAlpha = 0.32;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = isVip ? 'rgba(255,215,95,.4)' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    rr(x - 24, y - 30, 48, 46, 5); ctx.stroke();
    ctx.setLineDash([]);
    drawIcon('lock', x, y - 8, 5, isVip ? 'rgba(255,215,95,.5)' : 'rgba(255,255,255,.45)');
    faText(isVip ? 'سالن VIP' : 'ارتقا', x, y + 6, 7.5, isVip ? 'rgba(255,215,95,.4)' : 'rgba(255,255,255,.35)', 'center');
    ctx.globalAlpha = 1;
    return;
  }
  const ptier = lvl('pcTier');""")

# صندلیِ گیمینگ + فرشِ VIP زیر میز
rep("""  /* پایه‌ی میز */
  ctx.fillStyle = '#1a2330';
  rr(x - 25, y + 13, 50, 12, 2); ctx.fill();""",
"""  if(isVip){
    ctx.fillStyle = 'rgba(255,215,95,.06)';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 40, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,95,.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 18, 40, 12, 0, 0, TAU); ctx.stroke();
  }
  if(ptier >= 2 && !occupied){
    const cc = isVip ? '#c9a24a' : (i % 2 ? '#c0304a' : '#2a5ac0');
    ctx.fillStyle = cc;
    rr(x - 12, y - 44, 24, 40, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    rr(x - 9, y - 42, 18, 10, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
    rr(x - 12, y - 44, 24, 40, 8); ctx.stroke();
  }
  if(ptier >= 1){
    const hue = Math.floor((G.t * 40 + i * 80) % 360);
    ctx.strokeStyle = 'hsla(' + hue + ',90%,60%,.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 24, y + 12.5); ctx.lineTo(x + 24, y + 12.5); ctx.stroke();
  }
  /* پایه‌ی میز */
  ctx.fillStyle = '#1a2330';
  rr(x - 25, y + 13, 50, 12, 2); ctx.fill();""")

# مانیتور: روشن‌شدن + قابِ VIP
rep("""  putGlow(x, y - 14, 24, color, 0.14);
  ctx.fillStyle = '#212b3a';
  rr(x - 21, y - 28, 42, 28, 3); ctx.fill();
  ctx.strokeStyle = s.virus ? 'rgba(255,77,94,.8)' : 'rgba(255,255,255,.16)';
  ctx.lineWidth = 1.2;
  rr(x - 21, y - 28, 42, 28, 3); ctx.stroke();""",
"""  putGlow(x, y - 14, 24 + (ptier >= 3 ? 6 : 0), color, 0.14 + (s.vipDesk ? 0.06 : 0));
  ctx.fillStyle = s.vipDesk ? '#2d2a1e' : '#212b3a';
  rr(x - 21, y - 28, 42, 28, 3); ctx.fill();
  ctx.strokeStyle = s.virus ? 'rgba(255,77,94,.8)' : (s.vipDesk ? 'rgba(255,215,95,.5)' : 'rgba(255,255,255,.16)');
  ctx.lineWidth = s.vipDesk ? 1.6 : 1.2;
  rr(x - 21, y - 28, 42, 28, 3); ctx.stroke();
  if(s.vipDesk) faText('VIP', x + 15, y - 25, 5.5, 'rgba(255,215,95,.7)', 'center', true);""")

rep("""  ctx.fillStyle = '#0d1420';
  rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */""",
"""  ctx.fillStyle = '#0d1420';
  rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
  /* روشن‌شدنِ نرمِ مانیتور هنگامِ نشستن */
  if(s.bootT > 0){
    ctx.fillStyle = 'rgba(5,9,14,' + clamp(s.bootT / 0.45, 0, 0.9).toFixed(2) + ')';
    rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
    if(Math.sin(G.t * 30) > 0){ ctx.fillStyle = hexk('c'); ctx.fillRect(x + 14, y - 23, 2, 2); }
  }
  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */""")

# ---------- ۴) پس‌زمینه: مرحله‌ی بصری + ابزارهای تازه ----------
rep("""  /* ---- کفِ کاشی ---- */
  for(let j = 0; j < 14; j++){
    const y = 124 + j * 21;
    for(let i = 0; i < 18; i++){
      const x = i * 36;
      const r1 = sRand(i, j);
      let c = '#13171f';
      if(r1 > 0.84) c = '#1a212b';
      else if(r1 > 0.5) c = '#161c25';
      g.fillStyle = c;""",
"""  /* ---- کفِ کاشی — با مرحله‌ی پیشرفت روشن‌تر و گران‌تر ---- */
  const stg = (typeof envStage === 'function') ? envStage() : 0;
  const FL = [
    ['#10141b', '#13171f', '#12161f'],
    ['#12161e', '#161c25', '#141923'],
    ['#151a23', '#1a212b', '#171d27'],
    ['#1a202b', '#202733', '#1d242f'],
    ['#1f2632', '#262e3c', '#232a37'],
  ][stg];
  for(let j = 0; j < 14; j++){
    const y = 124 + j * 21;
    for(let i = 0; i < Math.ceil(WORLD_W / 36); i++){
      const x = i * 36;
      const r1 = sRand(i, j);
      let c = FL[2];
      if(r1 > 0.84) c = FL[1];
      else if(r1 > 0.5) c = FL[0];
      g.fillStyle = c;""")

rep("""  /* ---- سالن دوم: طاقِ ورودی + دکور ---- */
  g.fillStyle = '#161c26';
  g.fillRect(354, 48, 16, 92);""",
"""  /* ---- تابلوی قیمت‌ها بالای کانتر ---- */
  g.fillStyle = '#141b24';
  rr(g, 14, 58, 50, 26, 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
  rr(g, 14, 58, 50, 26, 4); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)';
  g.beginPath(); g.moveTo(24, 58); g.lineTo(24, 52); g.moveTo(54, 58); g.lineTo(54, 52); g.stroke();
  g.font = "bold 6.5px Tahoma"; g.textAlign = 'center';
  g.fillStyle = 'rgba(242,193,78,.85)';
  g.fillText('اینترنت ' + fmtK(44000) + ' · گیم ' + fmtK(34000), 39, 68);
  g.fillStyle = 'rgba(255,255,255,.45)';
  g.fillText('چاپ ' + fmtK(27000) + ' · چای ' + fmtK(18000), 39, 78);
  /* ---- دوربینِ مداربسته ---- */
  g.fillStyle = '#232c38';
  rr(g, 138, 52, 14, 8, 2); g.fill();
  g.beginPath(); g.moveTo(152, 55); g.lineTo(160, 58); g.lineTo(152, 61); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
  g.strokeRect(138, 52, 14, 8);
  /* ---- کولرِ دیواری ---- */
  g.fillStyle = '#1d2530';
  rr(g, 630, 52, 30, 16, 3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
  rr(g, 630, 52, 30, 16, 3); g.stroke();
  for(let k = 0; k < 4; k++){ g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(633, 55 + k * 3, 24, 1.2); }
  /* ---- تابلوی خروج ---- */
  g.fillStyle = 'rgba(46,160,90,.85)';
  rr(g, 318, 79, 32, 9, 3); g.fill();
  g.font = "bold 6.5px Tahoma"; g.textAlign = 'center';
  g.fillStyle = '#eafff3';
  g.fillText('خروج', 334, 86);
  /* ---- سالن دوم: طاقِ ورودی + دکور ---- */
  g.fillStyle = '#161c26';
  g.fillRect(354, 48, 16, 92);""")

rep("""  /* ---- ماشینِ فروشِ خودکار ---- */
  g.fillStyle = 'rgba(16,20,26,.95)';
  rr(g, 584, 214, 50, 62, 7); g.fill();""",
"""  /* ---- سالن VIP: طاقِ طلایی + فرش ---- */
  if(lvl('vipHall') >= 1){
    g.fillStyle = '#191d2b';
    g.fillRect(652, 48, 16, 92);
    g.fillStyle = 'rgba(255,215,95,.14)';
    g.fillRect(652, 48, 2.5, 92);
    g.strokeStyle = 'rgba(255,215,95,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(660, 48); g.quadraticCurveTo(660, 130, 660, 140); g.stroke();
    g.fillStyle = '#12151f';
    rr(g, 640, 126, 44, 17, 4); g.fill();
    g.strokeStyle = 'rgba(255,215,95,.55)'; g.lineWidth = 1;
    rr(g, 640, 126, 44, 17, 4); g.stroke();
    g.font = "bold 7.5px Tahoma"; g.textAlign = 'center';
    g.fillStyle = '#ffd75f';
    g.fillText('سالن VIP', 662, 138);
    g.fillStyle = 'rgba(255,215,95,.05)';
    rr(g, 668, 148, 148, 220, 10); g.fill();
    g.strokeStyle = 'rgba(255,215,95,.16)'; g.lineWidth = 1.4;
    rr(g, 668, 148, 148, 220, 10); g.stroke();
    plant(g, 682, 130);
    plant(g, 806, 130);
    putGlowDyn = null;
  }
  /* ---- راه‌راهِ RGBِ کف — مرحله‌ی گیمینگ ---- */
  if(stg >= 2){
    for(const ry of [126, 468]){
      g.fillStyle = 'rgba(120,120,255,.05)';
      g.fillRect(0, ry, WORLD_W, 2);
    }
  }
  /* ---- ماشینِ فروشِ خودکار ---- */
  g.fillStyle = 'rgba(16,20,26,.95)';
  rr(g, 584, 214, 50, 62, 7); g.fill();""")

rep("""  g.fillStyle = '#060709';
  g.fillRect(-ox/scale, -oy/scale, (WORLD_W + 2 * M + 2 * ox / scale) * 1.2, VH * 3);
  g.fillStyle = '#0a0c10';
  g.fillRect(0, 0, WORLD_W, VH);""",
"""  g.fillStyle = '#060709';
  g.fillRect(-ox/scale, -oy/scale, (WORLD_W + 2 * M + 2 * ox / scale) * 1.2, VH * 3);
  g.fillStyle = '#0a0c10';
  g.fillRect(0, 0, WORLD_W, VH);
  var putGlowDyn = null;""")

# ---------- ۵) ساعتِ واقعی ----------
rep("""function drawClockHands(){
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  const ma = G.t * 0.5 % TAU;
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ma) * 5.4, 64 - Math.cos(ma) * 5.4); ctx.stroke();
  const ha = G.t * 0.02 % TAU;
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ha) * 3.4, 64 - Math.cos(ha) * 3.4); ctx.stroke();
}""",
"""function drawClockHands(){
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  const frac = clamp(G.t / DAY_LEN, 0, 1);
  const ma = frac * TAU;                 // عقربه‌ی دقیقه — یک دور در روز
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ma) * 5.4, 64 - Math.cos(ma) * 5.4); ctx.stroke();
  const ha = (10 + frac * 10) / 12 * TAU; // ۱۰ صبح تا ۸ شب
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ha) * 3.4, 64 - Math.cos(ha) * 3.4); ctx.stroke();
}""")

# ---------- ۶) تب‌های سه‌گانه + دکمه‌های زوم ----------
rep("""function drawTabs(){
  if(lvl('hall') < 1) return;
  const y = 446, h = 24;
  const defs = [
    { id:'tabA', x: 16,  w: 78, t: '🖥 سالن ۱', on: G.cam.target < (WORLD_W - VW) / 2 },
    { id:'tabB', x: 100, w: 78, t: '🏛 سالن ۲', on: G.cam.target >= (WORLD_W - VW) / 2 },
  ];
  for(const d of defs){""",
"""function drawTabs(){
  if(lvl('hall') < 1 && lvl('vipHall') < 1) return;
  const y = 446, h = 24;
  const defs = [
    { id:'tabA', x: 16,  w: 74, t: '🖥 سالن ۱', on: G.cam.target < 140 },
    { id:'tabB', x: 94,  w: 74, t: '🏛 سالن ۲', on: G.cam.target >= 140 && G.cam.target < WORLD_W - VW - 60, need: lvl('hall') >= 1, tgt: 280 },
    { id:'tabC', x: 172, w: 74, t: '💎 VIP',   on: G.cam.target >= WORLD_W - VW - 60, need: lvl('vipHall') >= 1, tgt: WORLD_W - VW },
  ].filter(d => d.need !== false);
  for(const d of defs){""")

rep("""    faText(d.t, d.x + d.w / 2, y + 8, 9, d.on ? '#cfe4ff' : '#7d8894', 'center', true);
    HIT.list.push({ x: d.x, y, w: d.w, h, id: d.id });
  }
}""",
"""    faText(d.t, d.x + d.w / 2, y + 8, 9, d.on ? '#cfe4ff' : '#7d8894', 'center', true);
    HIT.list.push({ x: d.x, y, w: d.w, h, id: d.id });
  }
}
function tabTarget(id){
  if(id === 'tabA') return 0;
  if(id === 'tabB') return 280;
  return WORLD_W - VW;
}""")

rep("""  if(G.cam.x < maxCam - 2){
    const a = (0.35 + 0.25 * Math.sin(G.t * 3 + 2)).toFixed(2);
    faText('›', 344, y, 26, 'rgba(255,255,255,' + a + ')', 'center', true);
    HIT.list.push({ x: 328, y: y - 26, w: 30, h: 52, id: 'panR' });
  }
}""",
"""  if(G.cam.x < maxCam - 2){
    const a = (0.35 + 0.25 * Math.sin(G.t * 3 + 2)).toFixed(2);
    faText('›', 344, y, 26, 'rgba(255,255,255,' + a + ')', 'center', true);
    HIT.list.push({ x: 328, y: y - 26, w: 30, h: 52, id: 'panR' });
  }
  /* دکمه‌های زوم — سمتِ چپ، بالای فلشِ پن */
  const zx = 4, zy1 = 206, zy2 = 240;
  for(const zb of [{ id:'zin', y: zy1, t:'＋' }, { id:'zout', y: zy2, t:'－' }]){
    ctx.fillStyle = 'rgba(12,15,19,.78)';
    rr(zx, zb.y, 28, 28, 9); ctx.fill();
    ctx.strokeStyle = (G.zoom || 1) > 1 ? pcol('c',.6) : 'rgba(255,255,255,.14)';
    rr(zx, zb.y, 28, 28, 9); ctx.stroke();
    faText(zb.t, zx + 14, zb.y + 14, 14, (G.zoom || 1) > 1 ? '#9fd8ff' : '#7d8894', 'center', true);
    HIT.list.push({ x: zx, y: zb.y, w: 28, h: 28, id: zb.id });
  }
}""")

# ---------- ۷) چیپِ رویدادهای تازه ----------
rep("""    const names = { outage:'⚡ قطعی شبکه', virus:'⚠ ویروس', rush:'🌀 شلوغی', sponsor:'🟢 اسپانسر ×۱٫۵',
      fest:'🎪 جشنواره', tour:'🎮 مسابقات', celeb:'🌟 مشهور', breakdown:'🔧 خرابی' };
    const colors = { outage:hexk('p'), virus:'#ff4d5e', rush:hexk('a'), sponsor:hexk('g'),
      fest:hexk('a'), tour:hexk('p'), celeb:hexk('a'), breakdown:'#ff4d5e' };""",
"""    const names = { outage:'⚡ قطعی شبکه', virus:'⚠ ویروس', rush:'🌀 شلوغی', sponsor:'🟢 اسپانسر ×۱٫۵',
      fest:'🎪 جشنواره', tour:'🎮 مسابقات', celeb:'🌟 مشهور', breakdown:'🔧 خرابی', netfault:'🌐 اختلالِ شبکه' };
    const colors = { outage:hexk('p'), virus:'#ff4d5e', rush:hexk('a'), sponsor:hexk('g'),
      fest:hexk('a'), tour:hexk('p'), celeb:hexk('a'), breakdown:'#ff4d5e', netfault:'#ff9d5c' };""")

io.open('p4_scene.js', 'w', encoding='utf-8').write(p)
print('patch9 scene OK')
