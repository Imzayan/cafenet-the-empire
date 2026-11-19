# -*- coding: utf-8 -*-
# پچ ۱۱ — DOM/CSS: آموزش + فیلتر فروشگاه + بخش‌های تازه‌ی داشبورد + ماموریت بلندمدت
import io
h = io.open('p1_head.html', encoding='utf-8').read()

def rep(t, old, new, n=1):
    assert old in t, 'MISSING: ' + old[:70]
    return t.replace(old, new, n)

# ---------- CSS ----------
h = rep(h, """.volRow{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:12px;color:var(--dim)}
.volRow label{width:64px;flex:none}
.volRow input[type=range]{flex:1;accent-color:#4cff9e;height:22px;background:transparent}
</style>""",
""".volRow{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:12px;color:var(--dim)}
.volRow label{width:64px;flex:none}
.volRow input[type=range]{flex:1;accent-color:#4cff9e;height:22px;background:transparent}
.fchipRow{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.fchip{font-family:inherit;font-size:10.5px;padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.04);
  border:1px solid var(--line);color:var(--dim)}
.fchip.on{color:var(--green);border-color:rgba(76,255,158,.45);background:rgba(76,255,158,.08)}
#tut{position:absolute;left:12px;right:12px;bottom:118px;z-index:30;pointer-events:none}
#tut .tutCard{pointer-events:auto;background:linear-gradient(180deg, rgba(23,28,35,.96), rgba(14,17,22,.96));
  border:1px solid rgba(89,194,255,.4);border-radius:16px;padding:12px 14px;box-shadow:0 14px 40px rgba(0,0,0,.6)}
#tutTxt{font-size:12px;line-height:2;color:var(--ink);margin-bottom:6px}
#tutDots{font-size:10px;color:var(--cyan);letter-spacing:2px;margin-bottom:8px}
#tutSkip{font-family:inherit;font-size:10px;padding:5px 14px;border-radius:10px;background:transparent;
  border:1px solid var(--line2);color:var(--dim)}
.revStars{color:var(--amber);font-size:11px}
</style>""")

# ---------- فروشگاه: چیپ‌ها ----------
h = rep(h, """      <div class="shopSub">ارتقاها دائمی‌اند — حتی بعد از شکستِ یک هفته، با کافه‌ی نو می‌مانند.</div>
      <div id="shopList"></div>""",
"""      <div class="shopSub">ارتقاها دائمی‌اند — حتی بعد از شکستِ یک هفته، با کافه‌ی نو می‌مانند.</div>
      <div class="fchipRow" id="shopChips">
        <button class="fchip on" data-f="all">همه</button>
        <button class="fchip" data-f="equip">🖥 تجهیزات</button>
        <button class="fchip" data-f="staff">🧍 کارمندان</button>
        <button class="fchip" data-f="deco">🎨 دکور</button>
        <button class="fchip" id="shopSort">⇅ قیمت</button>
      </div>
      <div id="shopList"></div>""")

# ---------- داشبورد: تورنمنت + نظرات ----------
h = rep(h, """      <div class="sectT">⚔ رقبای محله</div>
      <div id="dashRivals"></div>""",
"""      <div class="sectT">⚔ رقبای محله</div>
      <div id="dashRivals"></div>
      <div class="sectT">🏆 مسابقاتِ گیمینگ</div>
      <div id="dashTour"></div>""")

h = rep(h, """      <div class="sectT">🧍 کارمندان</div>
      <div id="dashStaff"></div>""",
"""      <div class="sectT">🧍 کارمندان</div>
      <div id="dashStaff"></div>
      <div class="sectT">💬 نظراتِ مشتریان</div>
      <div id="dashRev"></div>""")

# ---------- ماموریت بلندمدت ----------
h = rep(h, """      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">📅 ماموریتِ هفتگی</div></div>
      <div id="weekMission"></div>""",
"""      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">📅 ماموریتِ هفتگی</div></div>
      <div id="weekMission"></div>
      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">🎯 اهدافِ بلندمدت</div></div>
      <div id="ltList"></div>""")

# ---------- آموزش ----------
h = rep(h, """  <!-- بین‌بخش روز -->
  <div id="banner" hidden>""",
"""  <!-- آموزشِ تعاملی -->
  <div id="tut" hidden>
    <div class="tutCard">
      <div id="tutDots"></div>
      <div id="tutTxt"></div>
      <button id="tutSkip">رد کردن آموزش</button>
    </div>
  </div>

  <!-- بین‌بخش روز -->
  <div id="banner" hidden>""")

io.open('p1_head.html', 'w', encoding='utf-8').write(h)

# اسکیپِ آموزش در p5
u = io.open('p5_ui.js', encoding='utf-8').read()
u = rep(u, """  $('dashClose').onclick = () => { Sfx.tickS(); hideFade('dash'); };""",
"""  $('dashClose').onclick = () => { Sfx.tickS(); hideFade('dash'); };
  $('tutSkip').onclick = () => { Sfx.tickS(); tutI = TUT.length; finishTut(); };""")
io.open('p5_ui.js', 'w', encoding='utf-8').write(u)
print('patch11 dom OK')
