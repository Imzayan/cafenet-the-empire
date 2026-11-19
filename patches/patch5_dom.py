# -*- coding: utf-8 -*-
# پچ ۵ — DOM/CSS: داشبورد + بانک + اسلایدر + ماموریت هفتگی + رفع OVERLAYS
import io
h = io.open('p1_head.html', encoding='utf-8').read()
u = io.open('p5_ui.js', encoding='utf-8').read()

def rep(t, old, new, n=1):
    assert old in t, 'MISSING: ' + old[:70]
    return t.replace(old, new, n)

# ---------- CSS ----------
h = rep(h, """.cbtn.on{color:var(--green);border-color:rgba(76,255,158,.4)}
</style>""",
""".cbtn.on{color:var(--green);border-color:rgba(76,255,158,.4)}

/* ---------- داشبورد ---------- */
.kpiGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}
.kpiGrid>div{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:13px;padding:9px 6px;text-align:center}
.kpiGrid b{display:block;font-size:14px;color:var(--ink)}
.kpiGrid b.g{color:var(--green)} .kpiGrid b.r{color:var(--red)} .kpiGrid b.a{color:var(--amber)}
.kpiGrid small{font-size:9px;color:#7d8894}
#dashChart{width:100%;height:64px;display:block;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:12px;margin-bottom:4px}
.sectT{font-size:12px;font-weight:800;color:var(--cyan);margin:12px 0 6px;letter-spacing:1px}
.volRow{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:12px;color:var(--dim)}
.volRow label{width:64px;flex:none}
.volRow input[type=range]{flex:1;accent-color:#4cff9e;height:22px;background:transparent}
</style>""")

# ---------- داشبورد ----------
h = rep(h, """  <!-- فروشگاه پرمیوم -->""",
"""  <!-- داشبورد مدیریتی -->
  <div id="dash" class="ov" hidden>
    <div class="card">
      <div class="shopHead"><div class="shopTitle">📊 داشبوردِ مدیریت</div><div class="shopMoney" id="dashMoney"></div></div>
      <div class="kpiGrid" id="dashKpi"></div>
      <div class="sectT">روندِ سودِ هفتگی</div>
      <canvas id="dashChart" width="300" height="64"></canvas>
      <div class="sectT">گزارشِ مالیِ امروز</div>
      <div id="dashFin"></div>
      <div class="sectT">⚔ رقبای محله</div>
      <div id="dashRivals"></div>
      <div class="sectT">📣 تبلیغات</div>
      <div id="dashAds"></div>
      <div class="sectT">🔧 تعمیراتِ لازم</div>
      <div id="dashFix"></div>
      <div class="sectT">🏷 فروشِ تجهیزاتِ اضافی</div>
      <div id="dashSell"></div>
      <div class="sectT">🧍 کارمندان</div>
      <div id="dashStaff"></div>
      <button class="closeX" id="dashClose">بستن</button>
    </div>
  </div>

  <!-- فروشگاه پرمیوم -->""")

# ---------- بانک در اجاره ----------
h = rep(h, """      <button class="nbtn" id="wkPay" style="width:100%">پرداخت اجاره — هفته‌ی بعد</button>""",
"""      <div id="bankBox"></div>
      <button class="nbtn" id="wkPay" style="width:100%">پرداخت اجاره — هفته‌ی بعد</button>""")

# ---------- ماموریت هفتگی ----------
h = rep(h, """      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">🏆 دستاورد</div></div>""",
"""      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">📅 ماموریتِ هفتگی</div></div>
      <div id="weekMission"></div>
      <div class="shopHead" style="margin-top:14px"><div class="shopTitle">🏆 دستاورد</div></div>""")

# ---------- اسلایدرهای صدا در مکث ----------
h = rep(h, """      <div class="mbtns">
        <button class="nbtn" id="btnResume">ادامه‌ی کار</button>
        <button class="nbtn ghost" id="btnToMenu">منوی اصلی (ذخیره می‌شود)</button>
      </div>""",
"""      <div class="mbtns">
        <button class="nbtn" id="btnResume">ادامه‌ی کار</button>
        <div class="volRow"><label>🔊 افکت</label><input type="range" id="volS" min="0" max="100" value="80"></div>
        <div class="volRow"><label>🎵 موسیقی</label><input type="range" id="volM" min="0" max="100" value="50"></div>
        <button class="nbtn ghost" id="btnToMenu">منوی اصلی (ذخیره می‌شود)</button>
      </div>""")

io.open('p1_head.html', 'w', encoding='utf-8').write(h)

# ---------- p5: OVERLAYS + بستنِ داشبورد + dashMoney ----------
u = rep(u, """const OVERLAYS = ['modal','shop','quests','summary','weekend','gameover','pause','menu','premium','crown'];""",
"""const OVERLAYS = ['modal','shop','quests','summary','weekend','gameover','pause','menu','premium','crown','dash'];""")
u = rep(u, """  ['modal','shop','quests','summary','weekend','gameover','pause'].forEach(id => $(id).hidden = true);""",
"""  ['modal','shop','quests','summary','weekend','gameover','pause','dash'].forEach(id => $(id).hidden = true);""")
u = rep(u, """  $('questClose').onclick = () => { hideFade('quests'); };""",
"""  $('questClose').onclick = () => { hideFade('quests'); };
  $('dashClose').onclick = () => { Sfx.tickS(); hideFade('dash'); };""")
u = rep(u, """function openDash(){ renderDash(); $('dash').hidden = false; }""",
"""function openDash(){
  $('dashMoney').textContent = 'موجودی: ' + fmtK(G.money);
  renderDash();
  $('dash').hidden = false;
}""")
io.open('p5_ui.js', 'w', encoding='utf-8').write(u)
print('patch5 dom OK')
