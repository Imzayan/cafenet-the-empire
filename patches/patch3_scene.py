# -*- coding: utf-8 -*-
# پچ ۳ — صحنه: انیمیشن طبیعی + سلامت روی میز + دکور + ۴ دکمه
import io
p = io.open('p4_scene.js', encoding='utf-8').read()

def rep(old, new, n=1):
    global p
    assert old in p, 'MISSING: ' + old[:80]
    p = p.replace(old, new, n)

# ---------- ۱) فیگور: تایپ، لرزشِ عصبی، تعادلِ سر ----------
rep("""function drawFigure(cx, baseY, o){
  const H = o.H || 22;
  let hipY = baseY - H * 0.42;
  if(o.drop > 0) hipY -= Math.sin(clamp(o.drop / 0.45, 0, 1) * Math.PI) * 5;
  const headR = H * 0.3;
  const headY = hipY - H * 0.62;""",
"""function drawFigure(cx, baseY, o){
  const H = o.H || 22;
  let hipY = baseY - H * 0.42;
  if(o.drop > 0) hipY -= Math.sin(clamp(o.drop / 0.45, 0, 1) * Math.PI) * 5;
  const headR = H * 0.3;
  let headY = hipY - H * 0.62;
  if(o.typing){ // تعادلِ طبیعیِ سر و بدن هنگامِ کار
    cx += Math.sin(G.t * 1.7 + (o.ph || 0)) * 0.5;
    headY += Math.sin(G.t * 2.6 + (o.ph || 0)) * 0.5;
  }
  if(o.shakeX) cx += o.shakeX;""")

# بازوهای تایپ‌زننده — داخلِ drawFigure برای نشسته‌ها
rep("""  if(o.apron){
    ctx.fillStyle = 'rgba(10,14,18,.55)';
    rr(cx - 4, hipY - H * 0.4, 8, H * 0.42, 2); ctx.fill();
  }""",
"""  if(o.apron){
    ctx.fillStyle = 'rgba(10,14,18,.55)';
    rr(cx - 4, hipY - H * 0.4, 8, H * 0.42, 2); ctx.fill();
  }
  if(o.typing && o.arms !== false){
    const jit = Math.sin(G.t * 13 + (o.ph || 0)) * 1.1;
    const jit2 = Math.sin(G.t * 13 + (o.ph || 0) + 2.1) * 1.1;
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4.6, hipY - H * 0.18); ctx.lineTo(cx - 6.6, hipY + H * 0.2 + jit); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4.6, hipY - H * 0.18); ctx.lineTo(cx + 6.8, hipY + H * 0.2 + jit2); ctx.stroke();
  }""")

# ---------- ۲) drawDesk: انیمیشنِ نشسته + نشانگرهای شخصیت + سلامت ----------
rep("""    drawFigure(x, y - 10, { shirt: c.shirt, hair: c.hair, H: 26, seated: true, drop: c.sitT });
    const frac = clamp(c.patience / c.patMax, 0, 1);
    drawRing(x, y - 38, 14, frac, null, 3);""",
"""    const frac0 = clamp(c.patience / c.patMax, 0, 1);
    const angry = frac0 < 0.25;
    drawFigure(x, y - 10, {
      shirt: c.shirt, hair: c.hair, H: 26, seated: true, drop: c.sitT,
      typing: s.kind !== 'print' && !s.virus && s.rebootT <= 0 && eff2(s),
      ph: i * 1.7,
      shakeX: angry && s.kind !== 'print' ? Math.sin(G.t * 30) * 1.4 : 0,
    });
    const frac = frac0;
    drawRing(x, y - 38, 14, frac, null, 3);
    if(c.regular) faText('♥', x - 17, y - 52, 7, pcol('p',.9), 'center', true);
    if(KINDS[s.kind] && KINDS[s.kind].payMulC >= 1.8) faText('💰', x - 17, y - 60, 7.5, hexk('a'), 'center');""")

# دست‌ها روی لبه‌ی مانیتور — بعد از ترسیمِ مانیتور
rep("""  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();

  if(s.virus){""",
"""  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */
  if(s.person && s.person.state === 'sit' && s.kind !== 'print' && !s.virus && s.rebootT <= 0){
    const j1 = Math.sin(G.t * 13 + i * 1.7) * 1.1, j2 = Math.sin(G.t * 13 + i * 1.7 + 2.1) * 1.1;
    ctx.strokeStyle = s.person.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 4.6, y - 16); ctx.lineTo(x - 7, y - 9 + j1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 4.6, y - 16); ctx.lineTo(x + 7.2, y - 9 + j2); ctx.stroke();
  }
  /* نوارِ سلامتِ تجهیزات */
  const hpv = sysHp(i);
  if(hpv < 100){
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    rr(x - 15, y - 31, 30, 2.4, 1.2); ctx.fill();
    ctx.fillStyle = ringColor(hpv / 100);
    rr(x - 15, y - 31, Math.max(1.5, 30 * hpv / 100), 2.4, 1.2); ctx.fill();
    if(hpv < 40 && Math.sin(G.t * 4) > 0.3) faText('🔧', x + 21, y - 30, 7.5, hexk('a'), 'center');
  }

  if(s.virus){""")

# محتوای مانیتور بر اساس vis (انواع تازه)
rep("""  const starving = s.kind !== 'print' && s.alloc < s.need;
  const allocCol = starving ? '#ff4d5e' : '#e9eef2';
  if(s.kind === 'dl'){""",
"""  const starving = s.kind !== 'print' && s.alloc < s.need;
  const allocCol = starving ? '#ff4d5e' : '#e9eef2';
  const vis = KINDS[s.kind] ? (KINDS[s.kind].vis || s.kind) : s.kind;
  if(vis === 'dl'){""")
rep("""  } else if(s.kind === 'game'){
    ctx.fillStyle = pcol('p',.85);
    rr(x - 15, y - 10, 30 * clamp(1 - s.progress, 0, 1), 3, 1.5); ctx.fill();
    ctx.fillStyle = pcol('c',.8);
    rr(x - 15, y - 4, 30 * clamp(s.progress, 0, 1), 2.5, 1.25); ctx.fill();
    if(Math.sin(G.t * 6 + i) > 0){
      ctx.fillStyle = hexk('p');
      ctx.beginPath(); ctx.arc(x + 10, y - 7, 1.6, 0, TAU); ctx.fill();
    }
  } else if(s.kind === 'chat'){""",
"""  } else if(vis === 'game'){
    ctx.fillStyle = pcol('p',.85);
    rr(x - 15, y - 10, 30 * clamp(1 - s.progress, 0, 1), 3, 1.5); ctx.fill();
    ctx.fillStyle = pcol('c',.8);
    rr(x - 15, y - 4, 30 * clamp(s.progress, 0, 1), 2.5, 1.25); ctx.fill();
    if(Math.sin(G.t * 6 + i) > 0){
      ctx.fillStyle = hexk('p');
      ctx.beginPath(); ctx.arc(x + 10, y - 7, 1.6, 0, TAU); ctx.fill();
    }
  } else if(vis === 'chat'){""")

# helper eff2 — میزِ در حالِ کارِ واقعی
rep("""function drawDesk(i){""",
"""function eff2(s){
  return s.alloc > 0 || s.kind === 'chat';
}
function drawDesk(i){""", 1)

# ---------- ۳) صف: آیکونِ درستِ انواع ----------
rep("""    drawIcon(c.kind, c.x - 14, c.y - 16, 4.5, rgb(KINDS[c.kind].color));""",
"""    const KQ = KINDS[c.kind];
    drawIcon(KQ.icon || c.kind, c.x - 14, c.y - 16, 4.5, rgb(KQ.color));""")

# ---------- ۴) چهار دکمه‌ی پایین: داشبورد اضافه ----------
rep("""function drawButtons(){
  const y = 512, h = 44;
  HIT.list = [];
  const b1 = { x: 16, y, w: 110, h, id: 'shop' };
  btnBox(b1, '🛠', 'ارتقای کافه', hexk('g'));
  HIT.list.push(b1);
  const b2 = { x: 134, y, w: 110, h, id: 'quests' };
  btnBox(b2, '✦', 'ماموریت', hexk('a'));
  HIT.list.push(b2);
  const ready = G.teaCd <= 0;
  const f = ready ? 1 : 1 - G.teaCd / teaCdMax();
  const b3 = { x: 252, y, w: 92, h, id: 'tea' };
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b3.x, b3.y, b3.w, b3.h, 12); ctx.fill();
  ctx.strokeStyle = ready ? pcol('a',.7) : 'rgba(255,255,255,.12)';
  rr(b3.x, b3.y, b3.w, b3.h, 12); ctx.stroke();
  if(!ready){
    ctx.fillStyle = pcol('a',.12);
    rr(b3.x, b3.y, b3.w, b3.h, 12); ctx.fill();
  }
  faText('☕', b3.x + b3.w/2, b3.y + 12, 13, ready ? hexk('a') : '#525c66', 'center', true);
  faText(ready ? 'چایِ داغ آماده' : 'دم‌کشیدن…', b3.x + b3.w/2, b3.y + 30, 8.5, ready ? hexk('a') : '#7d8894', 'center');
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  rr(b3.x + 8, b3.y + b3.h - 6, b3.w - 16, 2.5, 1); ctx.fill();
  ctx.fillStyle = ready ? hexk('a') : pcol('a',.35);
  rr(b3.x + b3.w - 8 - (b3.w - 16) * f, b3.y + b3.h - 6, (b3.w - 16) * f, 2.5, 1); ctx.fill();
  tapGlow(b3, hexk('a'));
  HIT.list.push(b3);
}""",
"""function drawButtons(){
  const y = 512, h = 44;
  HIT.list = [];
  const b1 = { x: 16, y, w: 77, h, id: 'shop' };
  btnBox(b1, '🛠', 'ارتقا', hexk('g'));
  HIT.list.push(b1);
  const b2 = { x: 100, y, w: 77, h, id: 'quests' };
  btnBox(b2, '✦', 'ماموریت', hexk('a'));
  HIT.list.push(b2);
  const b3 = { x: 184, y, w: 77, h, id: 'dash' };
  btnBox(b3, '📊', 'داشبورد', hexk('c'));
  HIT.list.push(b3);
  const ready = G.teaCd <= 0;
  const f = ready ? 1 : 1 - G.teaCd / teaCdMax();
  const b4 = { x: 268, y, w: 76, h, id: 'tea' };
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.fill();
  ctx.strokeStyle = ready ? pcol('a',.7) : 'rgba(255,255,255,.12)';
  rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.stroke();
  if(!ready){
    ctx.fillStyle = pcol('a',.12);
    rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.fill();
  }
  faText('☕', b4.x + b4.w/2, b4.y + 12, 13, ready ? hexk('a') : '#525c66', 'center', true);
  faText(ready ? 'چای آماده' : 'دم‌کشیدن…', b4.x + b4.w/2, b4.y + 30, 8.5, ready ? hexk('a') : '#7d8894', 'center');
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  rr(b4.x + 8, b4.y + b4.h - 6, b4.w - 16, 2.5, 1); ctx.fill();
  ctx.fillStyle = ready ? hexk('a') : pcol('a',.35);
  rr(b4.x + b4.w - 8 - (b4.w - 16) * f, b4.y + b4.h - 6, (b4.w - 16) * f, 2.5, 1); ctx.fill();
  tapGlow(b4, hexk('a'));
  HIT.list.push(b4);
}""")

rep("""function btnBox(b, icon, label, color){
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.stroke();
  putGlow(b.x + b.w/2, b.y + 14, 18, color, 0.18);
  faText(icon, b.x + b.w/2, b.y + 14, 13, color, 'center', true);
  faText(label, b.x + b.w/2, b.y + 31, 9, '#cfd8e0', 'center');
  tapGlow(b, color);
}""",
"""function btnBox(b, icon, label, color){
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.stroke();
  putGlow(b.x + b.w/2, b.y + 14, 18, color, 0.18);
  faText(icon, b.x + b.w/2, b.y + 14, 12.5, color, 'center', true);
  faText(label, b.x + b.w/2, b.y + 31, 8.5, '#cfd8e0', 'center');
  tapGlow(b, color);
}""")

# ---------- ۵) نامِ رویدادهای تازه در چیپ ----------
rep("""    const names = { outage:'⚡ قطعی شبکه', virus:'⚠ ویروس', rush:'🌀 شلوغی', sponsor:'🟢 اسپانسر ×۱٫۵' };
    const colors = { outage:hexk('p'), virus:'#ff4d5e', rush:hexk('a'), sponsor:hexk('g') };""",
"""    const names = { outage:'⚡ قطعی شبکه', virus:'⚠ ویروس', rush:'🌀 شلوغی', sponsor:'🟢 اسپانسر ×۱٫۵',
      fest:'🎪 جشنواره', tour:'🎮 مسابقات', celeb:'🌟 مشهور', breakdown:'🔧 خرابی' };
    const colors = { outage:hexk('p'), virus:'#ff4d5e', rush:hexk('a'), sponsor:hexk('g'),
      fest:hexk('a'), tour:hexk('p'), celeb:hexk('a'), breakdown:'#ff4d5e' };""")

# ---------- ۶) دکورِ قابلِ خرید در پس‌زمینه ----------
rep("""  /* ---- دیوار ---- */
  g.fillStyle = '#171e2a';
  g.fillRect(0, 48, WORLD_W, 76);""",
"""  /* ---- دیوار — با پالتِ خریداری‌شده ---- */
  const wallLv = lvl('wall');
  const wallC = wallLv >= 2 ? '#2a2129' : wallLv >= 1 ? '#15262e' : '#171e2a';
  const wallTrim = wallLv >= 2 ? 'rgba(255,157,92,.1)' : wallLv >= 1 ? 'rgba(89,194,255,.12)' : 'rgba(255,255,255,.06)';
  g.fillStyle = wallC;
  g.fillRect(0, 48, WORLD_W, 76);""")
rep("""  g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 48, WORLD_W, 1.5);
  g.fillStyle = '#0e1117';
  g.fillRect(0, 118, WORLD_W, 6);
  g.fillStyle = 'rgba(255,255,255,.05)';
  g.fillRect(0, 118, WORLD_W, 1.2);""",
"""  g.fillStyle = wallTrim; g.fillRect(0, 48, WORLD_W, 1.5);
  g.fillStyle = '#0e1117';
  g.fillRect(0, 118, WORLD_W, 6);
  g.fillStyle = wallTrim;
  g.fillRect(0, 118, WORLD_W, 1.2);""")

rep("""    const bc = i % 3 === 0 ? '#ffd9a0' : (i % 3 === 1 ? '#9fd8ff' : '#ff9fd0');""",
"""    const bc = lvl('lamp2') >= 1 ? '#ffd9a0' : (i % 3 === 0 ? '#ffd9a0' : (i % 3 === 1 ? '#9fd8ff' : '#ff9fd0'));""")

rep("""  plant(g, 20, 244);
  plant(g, 344, 238);
  plant(g, 96, 396);""",
"""  plant(g, 20, 244);
  plant(g, 344, 238);
  plant(g, 96, 396);
  if(lvl('plant2') >= 1){
    plant(g, 6, 396);
    plant(g, 508, 396);
    plant(g, 618, 122);
  }
  if(lvl('poster2') >= 1){
    poster(g, 262, 88, 20, 26, hexk('a'));
    poster(g, 470, 88, 20, 26, hexk('g'));
    poster(g, 600, 88, 20, 26, hexk('p'));
  }""")

# بازسازیِ پس‌زمینه بعد از خریدِ دکور — از p5 صدا زده می‌شود
rep("""function drawLamps(){""",
"""function refreshDecor(){ if(typeof buildBG === 'function') buildBG(); }
function drawLamps(){""")

io.open('p4_scene.js', 'w', encoding='utf-8').write(p)
print('patch3 scene OK')
