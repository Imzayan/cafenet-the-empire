# -*- coding: utf-8 -*-
# patch24 — اتصالِ دارایی‌های پیکسل‌آرت به رندر (کاملاً افزودنی، با fallbackِ برداری)
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:80])
    return t.replace(old, new, 1)

# ================= build.sh — ماژولِ نهم =================
p = rd('src/build.sh')
if 'p9_assets.js' not in p:
    p = rep(p, "cat p1_head.html p2_core.js p3_sim.js", "cat p1_head.html p2_core.js p9_assets.js p3_sim.js", 'buildcat')
wr('src/build.sh', p); print('build OK')

# ================= p4_scene — کفِ تایلی =================
p = rd('src/p4_scene.js')
OLD_FLOOR = """  for(let j = 0; j < 14; j++){
    const y = 124 + j * 21;
    for(let i = 0; i < Math.ceil(WORLD_W / 36); i++){
      const x = i * 36;
      const r1 = sRand(i, j);
      let c = FL[2];
      if(r1 > 0.84) c = FL[1];
      else if(r1 > 0.5) c = FL[0];
      g.fillStyle = c;
      g.fillRect(x, y, 35, 20);
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1;
      g.strokeRect(x, y, 35, 20);
      if(r1 > 0.94){
        g.fillStyle = pcol('g',.04);
        g.fillRect(x + 6, y + 5, 23, 10);
      }
    }
  }"""
NEW_FLOOR = """  if(typeof ART !== 'undefined' && ART.ok && ART.floor(g, stg)){
    /* کفِ تایلی از Tile Set پیکسل‌آرت — هم‌_grid با شبکه‌ی قبلی */
  } else """ + OLD_FLOOR
p = rep(p, OLD_FLOOR, NEW_FLOOR, 'floor')

# ================= p4_scene — دیوارِ تایلی =================
OLD_WALL = """  g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1;
  for(let y = 56; y < 124; y += 9){
    g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD_W, y); g.stroke();
    for(let x = (y % 18 < 9 ? 12 : 24); x < WORLD_W; x += 26){
      g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x, y); g.stroke();
    }
  }"""
NEW_WALL = """  if(typeof ART !== 'undefined' && ART.ok && ART.wall(g, wallLv)){
    /* دیوارِ تایلی از Tile Set */
  } else """ + OLD_WALL
p = rep(p, OLD_WALL, NEW_WALL, 'wall')

# ================= p4_scene — کاراکترِ مشتری =================
OLD_CUST = """  if(c.type === 'cust'){
    if(c.state === 'sit') return; // داخلِ drawDesk کشیده می‌شود
    const K = KINDS[c.kind];
    const color = K ? rgb(K.color) : '#8a94a0';
    drawFigure(c.x, c.y + 9, {
      shirt: c.shirt || color, hair: c.hair, H: 23,
      skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: c.wMul,
      walking: true, walkPh: c.bob,
      pose: c.anim || null, animT: c.animT,
    });
    if(c.state === 'angry'){
      ctx.globalAlpha = 0.7;
      drawIcon('game', c.x, c.y - 20, 5, '#ff4d5e');
      ctx.globalAlpha = 1;
    }
  } else {"""
NEW_CUST = """  if(c.type === 'cust'){
    if(c.state === 'sit') return; // داخلِ drawDesk کشیده می‌شود
    const K = KINDS[c.kind];
    if(typeof ART !== 'undefined' && ART.ok && ART.hasChar(c.kind) && !c.anim){
      /* اسپرایتِ پیکسل‌آرتِ راه‌رفتن — fallbackِ کامل به برداری */
      const moving = c.state === 'walk' || c.state === 'angry' || c.state === 'leave';
      ART.blitChar(ctx, c.kind, c.dir || 1, c.bob, !moving, c.x, c.y + 9, 23 * (c.hMul || 1));
      if(c.state === 'angry') ART.uiIcon(ctx, 'angry', c.x, c.y - 20, 10);
    } else {
      const color = K ? rgb(K.color) : '#8a94a0';
      drawFigure(c.x, c.y + 9, {
        shirt: c.shirt || color, hair: c.hair, H: 23,
        skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: c.wMul,
        walking: true, walkPh: c.bob,
        pose: c.anim || null, animT: c.animT,
      });
      if(c.state === 'angry'){
        ctx.globalAlpha = 0.7;
        drawIcon('game', c.x, c.y - 20, 5, '#ff4d5e');
        ctx.globalAlpha = 1;
      }
    }
  } else {"""
p = rep(p, OLD_CUST, NEW_CUST, 'cust')

# ================= p4_scene — کارمندانِ متحرک =================
OLD_STAFF = """  if(c.type === 'clean' || c.type === 'tech'){
    drawFigure(c.x, c.y + 9, {
      shirt: c.type === 'clean' ? '#4a6b55' : '#3e556b', hair: c.hair, H: 22,
      skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: 1,
      walking: true, walkPh: c.bob,
    });
    faText(c.type === 'clean' ? '🧹' : '🔧', c.x + (c.dir > 0 ? 9 : -9), c.y - 6, 8, '#dfe6ec', 'center');"""
NEW_STAFF = """  if(c.type === 'clean' || c.type === 'tech'){
    if(typeof ART !== 'undefined' && ART.ok && ART.hasChar(c.type)){
      ART.blitChar(ctx, c.type, c.dir || 1, c.bob, false, c.x, c.y + 9, 22 * (c.hMul || 1));
    } else {
      drawFigure(c.x, c.y + 9, {
        shirt: c.type === 'clean' ? '#4a6b55' : '#3e556b', hair: c.hair, H: 22,
        skin: c.skin, hairStyle: c.hairStyle, hMul: c.hMul, wMul: 1,
        walking: true, walkPh: c.bob,
      });
    }
    faText(c.type === 'clean' ? '🧹' : '🔧', c.x + (c.dir > 0 ? 9 : -9), c.y - 6, 8, '#dfe6ec', 'center');"""
p = rep(p, OLD_STAFF, NEW_STAFF, 'staff')

# ================= p4_scene — ذراتِ اسپرایتی (جایگزینِ گاردِدار، بدونِ حذفِ برداری) =================
p = rep(p, """    if(p.type === 'coin'){
      ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
      ctx.fillStyle = hexk('g');
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.8, 0, TAU); ctx.fill();
    }""",
"""    if(p.type === 'coin'){
      ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
      if(typeof ART !== 'undefined' && ART.ok && ART.fxFrame(ctx, 'coin', p.x, p.y, 1 - p.life / 0.8, 0.8)){
        // اسپرایتِ چرخشِ سکه
      } else {
        ctx.fillStyle = hexk('g');
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.8, 0, TAU); ctx.fill();
      }
    }""", 'coin-part')
p = rep(p, """    } else if(p.type === 'star'){
      ctx.globalAlpha = clamp(p.life * 1.6, 0, 1);
      ctx.fillStyle = hexk('a');
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill();
    }""",
"""    } else if(p.type === 'star'){
      ctx.globalAlpha = clamp(p.life * 1.6, 0, 1);
      if(typeof ART !== 'undefined' && ART.ok && ART.fxFrame(ctx, 'sparkle', p.x, p.y, 1 - p.life / 0.5, 0.7)){
        // اسپرایتِ جرقه
      } else {
        ctx.fillStyle = hexk('a');
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill();
      }
    }""", 'star-part')
p = rep(p, """    ctx.globalAlpha = 1;
  }
}
function drawFloaters(){""",
"""    ctx.globalAlpha = 1;
  }
  if(typeof ART !== 'undefined' && ART.ok) ART.renderFx(ctx, G.dt || 1 / 60);
}
function drawFloaters(){""", 'fx-tail')

# ================= p4_scene — dt برای افکت‌ها =================
p = rep(p, "function render(dt){\n  ctx.setTransform(1, 0, 0, 1, 0, 0);",
        "function render(dt){\n  G.dt = dt || 1 / 60;\n  ctx.setTransform(1, 0, 0, 1, 0, 0);", 'dt')

wr('src/p4_scene.js', p); print('p4 OK')

# ================= p3_sim — حلقه‌ی سطح‌بالا با افکتِ اسپرایتی =================
p = rd('src/p3_sim.js')
p = rep(p, """    toast('⬆ سطح ' + faNum(G.level) + ' — ' + titleFor(G.level));
    addCoins(1, 'سطحِ تازه');
    Sfx.levelup();""",
"""    toast('⬆ سطح ' + faNum(G.level) + ' — ' + titleFor(G.level));
    addCoins(1, 'سطحِ تازه');
    Sfx.levelup();
    if(typeof ART !== 'undefined' && ART.ok) ART.ring(WORLD_W / 2, VH / 2 - 40);""", 'levelup-ring')
p = rep(p, "  c.bob += dt * 10;", "  c.bob += dt * 10;\n  if(typeof ART !== 'undefined' && ART.ok && Math.random() < dt * 0.12) ART.sparkle(c.x + rnd(-6, 6), c.y - rnd(4, 16)); // جرقه‌ی ظریفِ راه‌رفتن", 'bob-sparkle')
wr('src/p3_sim.js', p); print('p3 OK')

# ================= build.sh متنِ سرصفحه =================
p = rd('src/build.sh')
p = p.replace('# ساختِ cafnet.html از ۸ ماژولِ سورس (۵ هسته + روایت + آنلاین + فروشگاه)',
              '# ساختِ cafnet.html از ۹ ماژولِ سورس (۵ هسته + روایت + آنلاین + فروشگاه + دارایی‌ها)')
wr('src/build.sh', p)
print('patch24 done')
