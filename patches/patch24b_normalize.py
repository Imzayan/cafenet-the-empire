# -*- coding: utf-8 -*-
# patch24b — نرمال‌سازیِ p4 پس از دو اجرای ناقص + تکمیلِ p3 (همه‌ی مراحل idempotent)
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)

p = rd('src/p4_scene.js')

# ---- جمعِ تو در توهای کف ----
NEST_F = """  } else if(typeof ART !== 'undefined' && ART.ok && ART.floor(g, stg)){
    /* کفِ تایلی از Tile Set پیکسل‌آرت — هم‌_grid با شبکه‌ی قبلی */
  } else if(typeof ART !== 'undefined' && ART.ok && ART.floor(g, stg)){
    /* کفِ تایلی از Tile Set پیکسل‌آرت — هم‌_grid با شبکه‌ی قبلی */
  } else"""
SINGLE_F = """  } else if(typeof ART !== 'undefined' && ART.ok && ART.floor(g, stg)){
    /* کفِ تایلی از Tile Set پیکسل‌آرت — هم‌_grid با شبکه‌ی قبلی */
  } else"""
while NEST_F in p:
    p = p.replace(NEST_F, SINGLE_F, 1)

# ---- جمعِ تو در توهای دیوار ----
NEST_W = """  } else if(typeof ART !== 'undefined' && ART.ok && ART.wall(g, wallLv)){
    /* دیوارِ تایلی از Tile Set */
  } else if(typeof ART !== 'undefined' && ART.ok && ART.wall(g, wallLv)){
    /* دیوارِ تایلی از Tile Set */
  } else"""
SINGLE_W = """  } else if(typeof ART !== 'undefined' && ART.ok && ART.wall(g, wallLv)){
    /* دیوارِ تایلی از Tile Set */
  } else"""
while NEST_W in p:
    p = p.replace(NEST_W, SINGLE_W, 1)

# گاردهای تکراری (اگر اجرای دوم نرسیده بود)
if 'ART.renderFx(ctx, G.dt' not in p:
    OLD_TAIL = """    ctx.globalAlpha = 1;
  }
}
function drawFloaters(){"""
    NEW_TAIL = """    ctx.globalAlpha = 1;
  }
  if(typeof ART !== 'undefined' && ART.ok) ART.renderFx(ctx, G.dt || 1 / 60);
}
function drawFloaters(){"""
    assert OLD_TAIL in p, 'tail missing'
    p = p.replace(OLD_TAIL, NEW_TAIL, 1)
if 'G.dt = dt || 1 / 60;' not in p:
    OLD_R = "function render(dt){\n  ctx.setTransform(1, 0, 0, 1, 0, 0);"
    NEW_R = "function render(dt){\n  G.dt = dt || 1 / 60;\n  ctx.setTransform(1, 0, 0, 1, 0, 0);"
    assert OLD_R in p, 'render missing'
    p = p.replace(OLD_R, NEW_R, 1)

wr('src/p4_scene.js', p)
print('p4 normalized:',
      'floor-nested', NEST_F[:30] in p,
      '| cust-ART', p.count("ART.hasChar(c.kind)"),
      '| staff-ART', p.count("ART.hasChar(c.type)"),
      '| coin-ART', p.count("ART.fxFrame(ctx, 'coin'"),
      '| star-ART', p.count("ART.fxFrame(ctx, 'sparkle'"),
      '| dt', p.count('G.dt = dt'))

# ---- p3_sim ----
p3 = rd('src/p3_sim.js')
if 'ART.ring(WORLD_W' not in p3:
    OLD_L = """    toast('⬆ سطح ' + faNum(G.level) + ' — ' + titleFor(G.level));
    addCoins(1, 'سطحِ تازه');
    Sfx.levelup();"""
    NEW_L = OLD_L + """
    if(typeof ART !== 'undefined' && ART.ok) ART.ring(WORLD_W / 2, VH / 2 - 40);"""
    assert OLD_L in p3, 'levelup missing'
    p3 = p3.replace(OLD_L, NEW_L, 1)
if 'ART.sparkle' not in p3:
    OLD_B = "  c.bob += dt * 10;"
    NEW_B = OLD_B + "\n  if(typeof ART !== 'undefined' && ART.ok && Math.random() < dt * 0.12) ART.sparkle(c.x + rnd(-6, 6), c.y - rnd(4, 16)); // جرقه‌ی ظریفِ راه‌رفتن"
    assert OLD_B in p3, 'bob missing'
    p3 = p3.replace(OLD_B, NEW_B, 1)
wr('src/p3_sim.js', p3)
print('p3 done:', p3.count('ART.ring'), p3.count('ART.sparkle'))

# ---- build.sh ----
b = rd('src/build.sh')
if 'p9_assets.js' not in b:
    assert 'cat p1_head.html p2_core.js p3_sim.js' in b
    b = b.replace('cat p1_head.html p2_core.js p3_sim.js', 'cat p1_head.html p2_core.js p9_assets.js p3_sim.js', 1)
    wr('src/build.sh', b)
print('build.sh has p9:', 'p9_assets.js' in rd('src/build.sh'))
