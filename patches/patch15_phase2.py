# -*- coding: utf-8 -*-
# patch15 — فازِ ۲ (شخصیت‌ها): SKINS/HAIRSTYLES/ANIMS، پوزهای drink/celebrate/angry/disappoint/talk/idle،
# سایه‌ی سه‌پله‌ای + rim-light، تنوعِ قد/عرض، اکسسوری (عینک/هدف‌فن)، هوک‌های شبیه‌سازی
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag, count=1):
    assert t.count(old) >= count, 'MISSING[%s]: %s' % (tag, old[:80])
    return t.replace(old, new, count)

# ================= p2_core: داده‌ی ظاهر و انیمیشن =================
p = rd('p2_core.js')
p = rep(p, "const HAIRS = ['#1a1a1a','#3a2a1a','#5a3a1a','#2a2a3a','#1a2a1a','#4a4a4a','#151515'];",
"""const HAIRS = ['#1a1a1a','#3a2a1a','#5a3a1a','#2a2a3a','#1a2a1a','#4a4a4a','#151515'];
const SKINS = ['#f2d4b4','#e0b080','#c08a58','#8a5a3a'];
const HAIRSTYLES = ['buzz','spiky','bun','long','curly','cap'];
/* جدولِ انیمیشن — متادیتای پوزها (فازِ ۲) */
const ANIMS = {
  walk:       { dur: 0 },    // پیوسته
  idle:       { dur: 3.0 },
  sit:        { dur: 1.0 },
  typing:     { dur: 1.0 },
  drink:      { dur: 2.2 },
  celebrate:  { dur: 1.6 },
  angry:      { dur: 1.0 },
  disappoint: { dur: 1.0 },
  talk:       { dur: 1.2 },
};""", 'animdata')
wr('p2_core.js', p); print('p2 OK')

# ================= p3_sim: هوک‌های پوز =================
p = rd('p3_sim.js')

# ظاهرِ هر مشتری در اسپاون
p = rep(p, """    name: pick(NAMES),
    visN: 0,""",
"""    name: pick(NAMES),
    visN: 0,
    skin: pick(SKINS), hairStyle: pick(HAIRSTYLES),
    hMul: kind === 'teen' ? 0.85 : (kind === 'rich' || kind === 'esports') ? 1.05 : 0.92 + Math.random() * 0.16,
    wMul: kind === 'teen' ? 0.9 : (kind === 'tourist' || kind === 'rich') ? 1.12 : 0.95 + Math.random() * 0.15,
    acc: (kind === 'work' || (kind === 'student' && Math.random() < 0.5)) ? 'glasses' : null,
    headset: kind === 'game' || kind === 'esports',
    anim: null, animT: 0,""", 'appear')

# نوشیدن بعد از سروِ چای/اسنک
p = rep(p, "  c.bubble = { text: wantSnack ? pick(SNACK_LINES) : pick(TEA_LINES), t: 2.2 };",
"""  c.bubble = { text: wantSnack ? pick(SNACK_LINES) : pick(TEA_LINES), t: 2.2 };
  c.anim = 'drink'; c.animT = 2.2;""", 'drink')

# جشنِ پیروزی در پایانِ نشستِ گیمرها
p = rep(p, "  customerDone(c, true);",
"""  if((s.kind === 'esports' || s.kind === 'game' || s.kind === 'teen') && Math.random() < 0.55){ c.anim = 'celebrate'; c.animT = 1.3; }
  customerDone(c, true);""", 'celebrate')

# ناامیدی وقتی صبحت رو به اتمام است
p = rep(p, "  s.patience -= drain * dt;",
"""  s.patience -= drain * dt;
  if(c.patMax && s.patience / c.patMax < 0.28 && (!c.animT || c.animT <= 0)) c.anim = 'disappoint';""", 'disappoint')

# گفتگو هنگام حبابِ تنهاگویی (کنسول و میز)
p = rep(p, "if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); }",
"if(c.bt <= 0){ c.bubble = { text: pick(SOLO), t: 2.4 }; c.bt = rnd(8, 18); c.anim = 'talk'; c.animT = 1.4; }", 'talk', 2)

# تیکِ انقضای پوز
p = rep(p, """    if(c.bubble){ c.bubble.t -= dt; if(c.bubble.t <= 0) c.bubble = null; }
  }""",
"""    if(c.bubble){ c.bubble.t -= dt; if(c.bubble.t <= 0) c.bubble = null; }
    if(c.animT > 0){ c.animT -= dt; if(c.animT <= 0) c.anim = null; }
  }""", 'animtick')

wr('p3_sim.js', p); print('p3 OK')

# ================= p4_scene: drawFigureِ جدید + فراخوانی‌ها =================
p = rd('p4_scene.js')

OLD_FIG = """function drawFigure(cx, baseY, o){
  const H = o.H || 22;
  let hipY = baseY - H * 0.42;
  if(o.drop > 0) hipY -= Math.sin(clamp(o.drop / 0.45, 0, 1) * Math.PI) * 5;
  const headR = H * 0.3;
  let headY = hipY - H * 0.62;
  if(o.typing){ // تعادلِ طبیعیِ سر و بدن هنگامِ کار
    cx += Math.sin(G.t * 1.7 + (o.ph || 0)) * 0.5;
    headY += Math.sin(G.t * 2.6 + (o.ph || 0)) * 0.5;
  }
  if(o.shakeX) cx += o.shakeX;
  if(o.walking){
    const sw = Math.sin((o.walkPh || 0) * 2) * H * 0.16;
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 2.5, hipY); ctx.lineTo(cx - 2.5 + sw, baseY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 2.5, hipY); ctx.lineTo(cx + 2.5 - sw, baseY); ctx.stroke();
  }
  ctx.fillStyle = o.shirt;
  rr(cx - 5.8, hipY - H * 0.62, 11.6, H * 0.64, 4.5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
  rr(cx - 5.8, hipY - H * 0.62, 11.6, H * 0.64, 4.5); ctx.stroke();
  if(o.apron){
    ctx.fillStyle = 'rgba(10,14,18,.55)';
    rr(cx - 4, hipY - H * 0.4, 8, H * 0.42, 2); ctx.fill();
  }
  if(o.typing && o.arms !== false){
    const jit = Math.sin(G.t * 13 + (o.ph || 0)) * 1.1;
    const jit2 = Math.sin(G.t * 13 + (o.ph || 0) + 2.1) * 1.1;
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4.6, hipY - H * 0.18); ctx.lineTo(cx - 6.6, hipY + H * 0.2 + jit); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4.6, hipY - H * 0.18); ctx.lineTo(cx + 6.8, hipY + H * 0.2 + jit2); ctx.stroke();
  }
  ctx.fillStyle = '#e2c9a8';
  ctx.beginPath(); ctx.arc(cx, headY, headR, 0, TAU); ctx.fill();
  ctx.fillStyle = o.hair || '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx, headY - 0.8, headR + 0.4, Math.PI * 0.92, Math.PI * 2.08);
  ctx.fill();
  ctx.fillRect(cx - headR - 0.4, headY - 2, headR * 2 + 0.8, 2);
}"""

NEW_FIG = """function drawFigure(cx, baseY, o){
  const H = (o.H || 22) * (o.hMul || 1);
  const BW = o.wMul || 1;
  let hipY = baseY - H * 0.42;
  if(o.drop > 0) hipY -= Math.sin(clamp(o.drop / 0.45, 0, 1) * Math.PI) * 5;
  const headR = H * 0.3;
  let headY = hipY - H * 0.62;
  const ph = o.ph || 0;
  const pose = o.pose || null;
  if((o.typing || pose === 'talk') && pose !== 'angry'){ // تعادلِ طبیعیِ سر و بدن هنگامِ کار
    cx += Math.sin(G.t * 1.7 + ph) * 0.5;
    headY += Math.sin(G.t * 2.6 + ph) * 0.5;
  }
  if(pose === 'celebrate') hipY += Math.sin(G.t * 10 + ph) * 1.6;
  if(pose === 'disappoint'){ headY += 1.8; hipY += Math.sin(G.t * 2.2 + ph) * 0.4; }
  if(pose === 'idle') hipY += Math.sin(G.t * 2.2 + ph) * 0.5;
  if(o.shakeX) cx += o.shakeX;
  const skin = o.skin || '#e2c9a8';
  if(o.walking){
    const sw = Math.sin((o.walkPh || 0) * 2) * H * 0.16;
    ctx.strokeStyle = o.pants || '#232b38'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 2.5 * BW, hipY); ctx.lineTo(cx - 2.5 * BW + sw, baseY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 2.5 * BW, hipY); ctx.lineTo(cx + 2.5 * BW - sw, baseY); ctx.stroke();
  }
  /* تنه — سایه‌ی سه‌پله‌ای + rim-light */
  const tw = 11.6 * BW;
  const torso = () => rr(cx - tw / 2, hipY - H * 0.62, tw, H * 0.64, 4.5);
  ctx.fillStyle = o.shirt; torso(); ctx.fill();
  ctx.save(); torso(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(cx - tw / 2, hipY - H * 0.62 + H * 0.36, tw, H * 0.4);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(cx + tw / 2 - 1.8, hipY - H * 0.62, 1.8, H * 0.7);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 1; torso(); ctx.stroke();
  if(o.apron){
    ctx.fillStyle = 'rgba(10,14,18,.55)';
    rr(cx - 4 * BW, hipY - H * 0.4, 8 * BW, H * 0.42, 2); ctx.fill();
  }
  /* دست‌ها — پوزِ مستقل به‌ازای هر حالت */
  ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  const arm = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  if(o.typing && o.arms !== false && !pose){
    const jit = Math.sin(G.t * 13 + ph) * 1.1, jit2 = Math.sin(G.t * 13 + ph + 2.1) * 1.1;
    arm(cx - 4.6 * BW, hipY - H * 0.18, cx - 6.6 * BW, hipY + H * 0.2 + jit);
    arm(cx + 4.6 * BW, hipY - H * 0.18, cx + 6.8 * BW, hipY + H * 0.2 + jit2);
  } else if(pose === 'drink'){
    const tA = o.animT || 2.2;
    const lift = tA > 1.9 ? clamp((2.2 - tA) / 0.3, 0, 1) : tA < 0.45 ? clamp(tA / 0.45, 0, 1) : 1;
    const hy = hipY + H * 0.2 - lift * H * 0.72;
    arm(cx + 4.6 * BW, hipY - H * 0.18, cx + 6.4 * BW, hy);
    arm(cx - 4.6 * BW, hipY - H * 0.18, cx - 6.2 * BW, hipY + H * 0.2);
    ctx.fillStyle = '#f2c14e'; rr(cx + 5.4 * BW, hy - 4, 4.4, 5, 1.2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 0.8; rr(cx + 5.4 * BW, hy - 4, 4.4, 5, 1.2); ctx.stroke();
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.2;
  } else if(pose === 'celebrate'){
    const wv = Math.sin(G.t * 9 + ph) * 1.4;
    arm(cx - 4.8 * BW, hipY - H * 0.3, cx - 8.2 * BW, hipY - H * 0.72 + wv);
    arm(cx + 4.8 * BW, hipY - H * 0.3, cx + 8.2 * BW, hipY - H * 0.72 - wv);
  } else if(pose === 'angry'){
    arm(cx - 4.6 * BW, hipY - H * 0.22, cx + 3.6 * BW, hipY + H * 0.08);
    arm(cx + 4.6 * BW, hipY - H * 0.22, cx - 3.6 * BW, hipY + H * 0.08);
  } else if(pose === 'disappoint'){
    arm(cx - 5 * BW, hipY - H * 0.26, cx - 5.6 * BW, hipY + H * 0.3);
    arm(cx + 5 * BW, hipY - H * 0.26, cx + 5.6 * BW, hipY + H * 0.3);
  } else if(pose === 'talk'){
    const g = Math.sin(G.t * 6 + ph) * 2;
    arm(cx - 4.6 * BW, hipY - H * 0.2, cx - 7.6 * BW, hipY - H * 0.42 + g);
    arm(cx + 4.6 * BW, hipY - H * 0.2, cx + 6.6 * BW, hipY + H * 0.2);
  } else if(o.walking){
    const sw = Math.sin((o.walkPh || 0) * 2) * H * 0.14;
    arm(cx - 4.8 * BW, hipY - H * 0.3, cx - 5.8 * BW, hipY - H * 0.3 + H * 0.36 - sw);
    arm(cx + 4.8 * BW, hipY - H * 0.3, cx + 5.8 * BW, hipY - H * 0.3 + H * 0.36 + sw);
  } else {
    arm(cx - 4.8 * BW, hipY - H * 0.26, cx - 5.4 * BW, hipY + H * 0.24);
    arm(cx + 4.8 * BW, hipY - H * 0.26, cx + 5.4 * BW, hipY + H * 0.24);
  }
  /* سر + استایلِ مو */
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(cx, headY, headR, 0, TAU); ctx.fill();
  const hs = o.hairStyle || 'buzz';
  const hc = o.hair || '#1a1a1a';
  if(hs === 'cap'){
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, headY, headR, Math.PI * 1.15, Math.PI * 1.85); ctx.fill();
    ctx.fillStyle = o.shirt;
    ctx.beginPath(); ctx.arc(cx, headY - headR * 0.42, headR * 1.04, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx, headY - headR * 0.55, headR * 1.9, 1.6);
  } else {
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, headY - 0.8, headR + 0.4, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
    ctx.fillRect(cx - headR - 0.4, headY - 2, headR * 2 + 0.8, 2);
    if(hs === 'spiky'){
      for(let sIdx = 0; sIdx < 3; sIdx++){
        const sx = cx - headR * 0.55 + sIdx * headR * 0.55;
        ctx.beginPath(); ctx.moveTo(sx - 1.6, headY - headR + 0.6); ctx.lineTo(sx, headY - headR - 2.4); ctx.lineTo(sx + 1.6, headY - headR + 0.6); ctx.closePath(); ctx.fill();
      }
    } else if(hs === 'bun'){
      ctx.beginPath(); ctx.arc(cx, headY - headR - 1.4, headR * 0.46, 0, TAU); ctx.fill();
    } else if(hs === 'long'){
      ctx.fillRect(cx - headR - 1.6, headY - 1.5, 2.6, headR * 1.5);
      ctx.fillRect(cx + headR - 1, headY - 1.5, 2.6, headR * 1.5);
    } else if(hs === 'curly'){
      for(let sIdx = 0; sIdx < 3; sIdx++){
        ctx.beginPath(); ctx.arc(cx - headR * 0.6 + sIdx * headR * 0.6, headY - headR - 0.6, headR * 0.4, 0, TAU); ctx.fill();
      }
    }
  }
  if(o.acc === 'glasses'){
    ctx.strokeStyle = 'rgba(226,232,238,.85)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(cx - 1.9, headY + 0.4, 1.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 1.9, headY + 0.4, 1.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 0.4, headY + 0.4); ctx.lineTo(cx + 0.4, headY + 0.4); ctx.stroke();
  }
  if(o.headset){
    ctx.strokeStyle = '#2a3542'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, headY, headR + 1.6, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    ctx.fillStyle = '#2a3542';
    rr(cx - headR - 2.6, headY - 1.6, 2.8, 4.2, 1.2); ctx.fill();
    rr(cx + headR - 0.2, headY - 1.6, 2.8, 4.2, 1.2); ctx.fill();
    if(o.typing){ ctx.fillStyle = '#59c2ff'; ctx.fillRect(cx - headR - 2, headY - 0.4, 1.2, 1.2); }
  }
}"""
p = rep(p, OLD_FIG, NEW_FIG, 'drawfigure')

# فراخوانیِ مشتریِ درحالِ راه‌رفتن — ظاهرِ کامل + پوز
p = rep(p, """    drawFigure(c.x, c.y + 9, {
      shirt: c.shirt || color, hair: c.hair, H: 23,
      walking: true, walkPh: c.bob,
    });""",
"""    drawFigure(c.x, c.y + 9, {
      shirt: c.shirt || color, hair: c.hair, H: 23,
      skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: c.wMul,
      walking: true, walkPh: c.bob,
      pose: c.anim || null, animT: c.animT,
    });""", 'walkcall')

# فراخوانیِ نشسته در میز — ظاهر + اکسسوری + پوز
p = rep(p, """    drawFigure(x, y - 10, {
      shirt: c.shirt, hair: c.hair, H: 26, seated: true, drop: c.sitT,
      typing: s.kind !== 'print' && !s.virus && s.rebootT <= 0 && eff2(s),
      ph: i * 1.7,
      shakeX: angry && s.kind !== 'print' ? Math.sin(G.t * 30) * 1.4 : 0,
    });""",
"""    drawFigure(x, y - 10, {
      shirt: c.shirt, hair: c.hair, H: 26, seated: true, drop: c.sitT,
      skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: c.wMul,
      acc: c.acc, headset: c.headset && eff2(s),
      typing: s.kind !== 'print' && !s.virus && s.rebootT <= 0 && eff2(s),
      pose: c.anim || null, animT: c.animT,
      ph: i * 1.7,
      shakeX: angry && s.kind !== 'print' ? Math.sin(G.t * 30) * 1.4 : 0,
    });""", 'sitcall')

wr('p4_scene.js', p); print('p4 OK')
print('patch15 done')
