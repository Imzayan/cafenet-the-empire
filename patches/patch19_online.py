# -*- coding: utf-8 -*-
# patch19 — فازِ ۵: اتصالِ لایه‌ی آنلاین به UI و build
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:70])
    return t.replace(old, new, 1)

# ================= p1_head — دکمه + DOM + CSS =================
p = rd('src/p1_head.html')
if 'id="onlineOv"' not in p:
    p = rep(p, "          <button class=\"nbtn ghost\" id=\"btnHow\">📜 قوانین در یک نگاه</button>",
"""          <button class="nbtn ghost" id="btnHow">📜 قوانین در یک نگاه</button>
          <button class="nbtn ghost" id="btnOnline">☁ آنلاین</button>""", 'menubtn')
    p = rep(p, "  <div class=\"mfoot\">آفلاین · لمسی · پیشرفت ذخیره می‌شود</div>",
"  <div class=\"mfoot\">آفلاین و لمسی · ذخیره‌ی محلیِ همیشگی · ☁ آنلاینِ اختیاری</div>", 'mfoot')
    p = rep(p, """  .wsBranch{border:1px solid var(--amber);border-radius:12px;padding:10px;text-align:center;margin-top:6px}
  .wsBranch .nbtn{margin-top:8px;width:100%}
</style>""",
"""  .wsBranch{border:1px solid var(--amber);border-radius:12px;padding:10px;text-align:center;margin-top:6px}
  .wsBranch .nbtn{margin-top:8px;width:100%}
  /* فازِ ۵ — آنلاین */
  .inp{width:100%;box-sizing:border-box;padding:10px 12px;margin:6px 0;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--ink);font:inherit;font-size:14px}
  .inp::placeholder{color:var(--dim)}
  .onlBox{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:10px}
  .lbHead,.lbRow{display:flex;gap:8px;align-items:center;padding:6px 4px;font-size:12px}
  .lbHead{color:var(--dim);font-size:11px}
  .lbHead span,.lbRow span{width:22px;text-align:center;flex-shrink:0}
  .lbHead b,.lbRow b{flex:1;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis}
  .lbRow.me{background:rgba(89,194,255,.12);border-radius:8px}
  .lbHead i,.lbRow i{font-style:normal;min-width:56px;text-align:left}
  .lbHead i{color:var(--dim)}
  .lbRow i{color:var(--ink)}
</style>""", 'css')
    p = rep(p, """  <!-- فازِ ۳-ب — کارگاهِ قطعات و شعبه -->
  <div id="wsOv" class="ov" hidden>""",
"""  <!-- فازِ ۵ — آنلاینِ اختیاری -->
  <div id="onlineOv" class="ov" hidden>
    <div class="card" style="max-width:380px">
      <div class="pt">☁ آنلاین</div>
      <div class="ps">اختیاری و جدای از بازیِ آفلاین — حساب، ذخیره‌ی ابری و جدولِ امتیازات. سرور: <span id="onlAddr" style="direction:ltr"></span></div>
      <div id="onlBody" style="margin:10px 0;max-height:56vh;overflow:auto"></div>
      <div class="mbtns"><button class="nbtn ghost" id="onlClose">بستن</button></div>
    </div>
  </div>

  <!-- فازِ ۳-ب — کارگاهِ قطعات و شعبه -->
  <div id="wsOv" class="ov" hidden>""", 'dom')
wr('src/p1_head.html', p); print('p1 OK')

# ================= p5_ui — بایندینگ =================
p = rd('src/p5_ui.js')
if 'btnOnline' not in p:
    p = rep(p, "  $('wsClose').onclick = () => { Sfx.tickS(); hideFade('wsOv'); };",
"""  $('wsClose').onclick = () => { Sfx.tickS(); hideFade('wsOv'); };
  $('btnOnline').onclick = () => { Sfx.tickS(); $('onlAddr').textContent = (typeof ONL !== 'undefined') ? ONL.api.replace(/^https?:\/\//, '') : 'localhost'; openOnline(); };
  $('onlClose').onclick = () => { Sfx.tickS(); hideFade('onlineOv'); };""", 'bind')
    p = rep(p, "    if(!$('wsOv').hidden){ Sfx.tickS(); hideFade('wsOv'); return; }",
"""    if(!$('wsOv').hidden){ Sfx.tickS(); hideFade('wsOv'); return; }
    if(!$('onlineOv').hidden){ Sfx.tickS(); hideFade('onlineOv'); return; }""", 'esc')
    p = rep(p, " || !$('wsOv').hidden; }", " || !$('wsOv').hidden || !$('onlineOv').hidden; }", 'modals')
wr('src/p5_ui.js', p); print('p5 OK')

# ================= p3_sim — قلابِ ارسالِ امتیاز =================
p = rd('src/p3_sim.js')
if 'sendScore()' not in p:
    p = rep(p, "  $('summary').hidden = false;\n  if(ds.angry === 0 && ds.served >= 3) Sfx.rentPaid(); else Sfx.boot();",
"  $('summary').hidden = false;\n  if(typeof sendScore === 'function') sendScore(); // فازِ ۵ — لیدربورد\n  if(ds.angry === 0 && ds.served >= 3) Sfx.rentPaid(); else Sfx.boot();", 'hook')
wr('src/p3_sim.js', p); print('p3 OK')

# ================= build.sh — ماژولِ هفتم =================
p = rd('src/build.sh')
if 'p7_online.js' not in p:
    p = p.replace("cat p1_head.html p2_core.js p3_sim.js p4_scene.js p6_story.js p5_ui.js",
                  "cat p1_head.html p2_core.js p3_sim.js p4_scene.js p6_story.js p7_online.js p5_ui.js")
    p = p.replace("# ساختِ cafnet.html از ۶ ماژولِ سورس (۵ هسته + روایت)",
                  "# ساختِ cafnet.html از ۷ ماژولِ سورس (۵ هسته + روایت + آنلاین)")
wr('src/build.sh', p); print('build OK')

# ================= .gitignore — داده‌ی سرور =================
p = rd('.gitignore')
if 'server/data' not in p:
    p += "\nserver/data/\n"
wr('.gitignore', p); print('gitignore OK')
print('patch19 done')
