# -*- coding: utf-8 -*-
# patch16 — فازِ ۲ (محیط + نور): دستگاهِ فروشِ خودکار، پوسترهای سالن۲، وینیتِ کف،
# فنِ RGB چرخانِ کیس، لیوانِ چای هنگامِ نوشیدن، تینتِ زمانِ روز، شدتِ نورِ شبانه
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:80])
    return t.replace(old, new, 1)

p = rd('p4_scene.js')

# ---- ۱) دستگاهِ فروشِ خودکار — بعد از اسنک‌بار در bg ----
p = rep(p, """  g.fillText('اسنک‌بار', 322, 258);""",
"""  g.fillText('اسنک‌بار', 322, 258);

  /* ---- دستگاهِ فروشِ خودکار ---- */
  const vmX = 770, vmY = 250;
  g.fillStyle = 'rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(vmX, vmY + 2, 22, 4, 0, 0, TAU); g.fill();
  g.fillStyle = '#101820';
  rr(g, vmX - 19, vmY - 58, 38, 58, 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1.2;
  rr(g, vmX - 19, vmY - 58, 38, 58, 4); g.stroke();
  g.fillStyle = '#0a0f16';
  rr(g, vmX - 15, vmY - 53, 24, 34, 2); g.fill();
  const vmCols = ['#ff5fa2', '#4cff9e', '#59c2ff', '#f2c14e', '#c08aff'];
  for(let rI = 0; rI < 3; rI++) for(let cI = 0; cI < 3; cI++){
    g.fillStyle = vmCols[(rI * 3 + cI) % 5];
    g.globalAlpha = 0.8;
    g.fillRect(vmX - 12 + cI * 7.5, vmY - 50 + rI * 10, 5, 8);
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(140,220,255,.14)';
  rr(g, vmX - 15, vmY - 53, 24, 34, 2); g.fill();
  g.fillStyle = '#0d1420';
  rr(g, vmX + 11, vmY - 46, 6, 16, 1.5); g.fill();
  g.fillStyle = pcol('g',.75);
  g.fillRect(vmX + 13, vmY - 43, 2.4, 2.4);
  g.fillStyle = '#05080c';
  rr(g, vmX - 13, vmY - 14, 22, 8, 1.5); g.fill();
  g.font = "bold 6.5px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = '#8a95a2';
  g.fillText('فروشِ خودکار', vmX, vmY + 8);""", 'vending')

# ---- ۲) پوسترهای بیشترِ دیوارِ سالن۲/VIP ----
p = rep(p, """  poster(g, 62, 54, 22, 30, hexk('p'));
  poster(g, 248, 54, 22, 30, hexk('c'));""",
"""  poster(g, 62, 54, 22, 30, hexk('p'));
  poster(g, 248, 54, 22, 30, hexk('c'));
  poster(g, 560, 54, 22, 30, hexk('a'));
  poster(g, 614, 54, 22, 30, hexk('g'));
  poster(g, 700, 54, 22, 30, hexk('p'));""", 'posters')

# ---- ۳) وینیتِ کف — بعد از کاشی‌ها ----
p = rep(p, """      if(r1 > 0.94){
        g.fillStyle = pcol('g',.04);
        g.fillRect(x + 6, y + 5, 23, 10);
      }
    }
  }""",
"""      if(r1 > 0.94){
        g.fillStyle = pcol('g',.04);
        g.fillRect(x + 6, y + 5, 23, 10);
      }
    }
  }

  /* ---- وینیتِ ملایمِ کف ---- */
  const vgr = g.createRadialGradient(WORLD_W / 2, 320, 170, WORLD_W / 2, 320, 500);
  vgr.addColorStop(0, 'rgba(0,0,0,0)');
  vgr.addColorStop(1, 'rgba(0,0,0,.3)');
  g.fillStyle = vgr;
  g.fillRect(0, 124, WORLD_W, VH - 124);""", 'vignette')

# ---- ۴) فنِ RGB چرخان در کیس ----
p = rep(p, """  if(occupied){
    ctx.fillStyle = s.virus ? '#ff4d5e' : (Math.sin(G.t * 4 + i) > 0 ? hexk('g') : pcol('g',.3));
    ctx.fillRect(x + 21, y + 19, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(x + 20, y + 26, 5, 1.4);
  }""",
"""  if(occupied){
    ctx.fillStyle = s.virus ? '#ff4d5e' : (Math.sin(G.t * 4 + i) > 0 ? hexk('g') : pcol('g',.3));
    ctx.fillRect(x + 21, y + 17, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(x + 20, y + 26, 5, 1.4);
    /* فنِ RGB چرخان */
    const fh = Math.floor((G.t * 50 + i * 40) % 360);
    ctx.strokeStyle = 'hsla(' + fh + ',90%,62%,.75)'; ctx.lineWidth = 1.1;
    ctx.save(); ctx.translate(x + 22.5, y + 23.5); ctx.rotate(G.t * 7 + i);
    ctx.beginPath(); ctx.moveTo(-2.6, 0); ctx.lineTo(2.6, 0); ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.6); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'hsla(' + fh + ',90%,60%,.35)';
    ctx.beginPath(); ctx.arc(x + 22.5, y + 23.5, 2.9, 0, TAU); ctx.stroke();
  }""", 'casefan')

# ---- ۵) لیوانِ چای روی میز هنگامِ نوشیدن ----
p = rep(p, """  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */""",
"""  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* لیوانِ چای هنگامِ نوشیدن */
  if(s.person && s.person.anim === 'drink'){
    ctx.fillStyle = '#f2c14e';
    rr(x - 20, y + 3.5, 5, 6, 1.4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 0.8;
    rr(x - 20, y + 3.5, 5, 6, 1.4); ctx.stroke();
  }
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */""", 'cup')

# ---- ۶) شدتِ نورِ شبانه در putGlow ----
p = rep(p, """function putGlow(x, y, r, color, alpha){
  ctx.globalAlpha = alpha;""",
"""function putGlow(x, y, r, color, alpha){
  ctx.globalAlpha = Math.min(1, alpha * (G.glowMul || 1));""", 'glowmul')

# ---- ۷) تینتِ زمانِ روز در drawScene + مقدارِ اولیه‌ی glowMul ----
p = rep(p, """function drawScene(){
  ctx.save();""",
"""function drawScene(){
  ctx.save();
  const dfrG = clamp(G.t / DAY_LEN, 0, 1);
  G.glowMul = dfrG < 0.22 ? 0.9 : dfrG < 0.62 ? 0.75 : dfrG < 0.85 ? 1.0 : 1.25;""", 'glowmul-set')

p = rep(p, """  drawParticles();
  drawFloaters();
  ctx.restore();
}""",
"""  drawParticles();
  drawFloaters();
  /* تینتِ محیطیِ زمانِ روز — صبحِ طلایی/روزِ روشن/عصرِ گرم/شبِ آبی */
  const dfr = clamp(G.t / DAY_LEN, 0, 1);
  const tint = dfr < 0.22 ? '255,228,190,0.05' : dfr < 0.62 ? '205,228,255,0.035' : dfr < 0.85 ? '255,172,110,0.075' : '70,100,190,0.13';
  ctx.fillStyle = 'rgba(' + tint + ')';
  ctx.fillRect(G.cam.x - 10, -20, VW / (G.zoom || 1) + 20, VH + 40);
  ctx.restore();
}""", 'daytint')

wr('p4_scene.js', p)
print('patch16 done')
