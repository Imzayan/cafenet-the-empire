# -*- coding: utf-8 -*-
# patch20 — فازِ ۴: فروشگاه و پیشرفت — پوسته‌های تازه + بتل‌پس + اتصالِ p8
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:70])
    return t.replace(old, new, 1)

# ================= p1_head — پوسته‌ها + DOM + CSS =================
p = rd('src/p1_head.html')
if 'data-skin="cyber"' not in p:
    p = rep(p, """body[data-skin="violet"]{--green:#b38cff;--pink:#ff6fd8;--cyan:#8ea8ff;--amber:#c9a5ff;--red:#ff5f9e;
  --grad:linear-gradient(135deg, rgba(179,140,255,.16), rgba(255,111,216,.1))}""",
"""body[data-skin="violet"]{--green:#b38cff;--pink:#ff6fd8;--cyan:#8ea8ff;--amber:#c9a5ff;--red:#ff5f9e;
  --grad:linear-gradient(135deg, rgba(179,140,255,.16), rgba(255,111,216,.1))}
body[data-skin="cyber"]{--green:#2ee6c8;--pink:#ff2fb3;--cyan:#38e1ff;--amber:#f7b32b;--red:#ff4d6d;
  --grad:linear-gradient(135deg, rgba(46,230,200,.16), rgba(255,47,179,.1))}
body[data-skin="forest"]{--green:#7fd66b;--pink:#c9e265;--cyan:#a8d8b9;--amber:#e3c567;--red:#e2703a;
  --grad:linear-gradient(135deg, rgba(127,214,107,.16), rgba(201,226,101,.1))}
body[data-skin="sunset"]{--green:#ffb347;--pink:#ff6e7f;--cyan:#ffd29d;--amber:#ff9e5e;--red:#e34f5f;
  --grad:linear-gradient(135deg, rgba(255,179,71,.18), rgba(255,110,127,.12))}
body[data-skin="mono"]{--green:#d8dde6;--pink:#c3cad6;--cyan:#e8edf5;--amber:#cbd2dd;--red:#9aa3b2;
  --grad:linear-gradient(135deg, rgba(216,221,230,.14), rgba(195,202,214,.08))}""", 'skins')
    p = rep(p, """      <div id="prList"></div>
      <button class="closeX" id="prClose">بستن</button>""",
"""      <div id="prList"></div>
      <div id="prShopBox" class="prBox"></div>
      <div id="prPassBox" class="prBox"></div>
      <div class="prEnv">محیطِ خرید: <b id="prEnv" style="direction:ltr">—</b> · پرداختِ واقعی انجام نمی‌شود <button class="nbtn ghost" id="btnIapTest" style="padding:6px 12px">▶ خودآزماییِ provider</button></div>
      <button class="closeX" id="prClose">بستن</button>""", 'prdom')
    p = rep(p, """  .lbHead i,.lbRow i{font-style:normal;min-width:56px;text-align:left}
  .lbHead i{color:var(--dim)}
  .lbRow i{color:var(--ink)}
</style>""",
"""  .lbHead i,.lbRow i{font-style:normal;min-width:56px;text-align:left}
  .lbHead i{color:var(--dim)}
  .lbRow i{color:var(--ink)}
  /* فازِ ۴ — فروشگاه و پیشرفت */
  .prBox{border:1px solid var(--line);border-radius:12px;padding:10px;margin:10px 0 0}
  .prTitle{font-size:14px;font-weight:700;color:var(--amber);margin-bottom:6px}
  .prEnv{font-size:11px;color:var(--dim);margin-top:12px;text-align:center}
  .prEnv b{color:var(--cyan)}
  .coinRow{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
  .coinRow:last-child{border-bottom:none}
  .passBar{height:10px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden;margin:8px 0 4px}
  .passBar i{display:block;height:100%;background:linear-gradient(90deg,var(--amber),var(--green));border-radius:6px}
  .tierGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px}
  .tier{padding:8px 2px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--ink);font-size:13px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:1px}
  .tier small{font-size:10px;font-weight:400;color:var(--dim)}
  .tier.ready{border-color:var(--amber);color:var(--amber);animation:tpulse 1.6s ease-in-out infinite}
  .tier.claimed{opacity:.45}
  .tier.locked{opacity:.55}
  @keyframes tpulse{0%,100%{box-shadow:0 0 0 0 rgba(255,215,95,.35)}50%{box-shadow:0 0 0 5px rgba(255,215,95,0)}}
</style>""", 'css')
wr('src/p1_head.html', p); print('p1 OK')

# ================= p2_core — ذخیره =================
p = rd('src/p2_core.js')
if 'pass: null,' not in p:
    p = rep(p, "      parts: null,               // فازِ ۳-ب — {cpu,gpu,ram,mon} برای هر میز",
"""      parts: null,               // فازِ ۳-ب — {cpu,gpu,ram,mon} برای هر میز
      pass: null,                // فازِ ۴ — بتل‌پسِ فصلی {season,xp,tier,claimed}""", 'defaults')
    p = rep(p, "        if(p.branch && typeof p.branch === 'object') this.d.branch = { owned: !!p.branch.owned, lvl: clamp(Math.floor(+p.branch.lvl || 0), 0, 3), mgr: typeof p.branch.mgr === 'string' ? p.branch.mgr : null, last: Math.max(0, +p.branch.last || 0) };",
"""        if(p.branch && typeof p.branch === 'object') this.d.branch = { owned: !!p.branch.owned, lvl: clamp(Math.floor(+p.branch.lvl || 0), 0, 3), mgr: typeof p.branch.mgr === 'string' ? p.branch.mgr : null, last: Math.max(0, +p.branch.last || 0) };
        if(p.pass && typeof p.pass === 'object') this.d.pass = { season: clamp(Math.floor(+p.pass.season) || 1, 1, 999), xp: Math.max(0, Math.floor(+p.pass.xp) || 0), tier: clamp(Math.floor(+p.pass.tier) || 0, 0, 20), claimed: Array.isArray(p.pass.claimed) ? p.pass.claimed.filter(n => n >= 1 && n <= 20).slice(0, 20) : [], prem: !!p.pass.prem };""", 'merge')
wr('src/p2_core.js', p); print('p2 OK')

# ================= p3_sim — قلابِ بتل‌پس در پایانِ روز =================
p = rd('src/p3_sim.js')
if 'passAdvance()' not in p:
    p = rep(p, "  if(typeof sendScore === 'function') sendScore(); // فازِ ۵ — لیدربورد",
"""  if(typeof passAdvance === 'function') passAdvance(); // فازِ ۴ — بتل‌پسِ فصلی
  if(typeof sendScore === 'function') sendScore(); // فازِ ۵ — لیدربورد""", 'hook')
wr('src/p3_sim.js', p); print('p3 OK')

# ================= p5_ui — پوسته‌های تازه + اتصالِ پنل‌ها =================
p = rd('src/p5_ui.js')
if "skin_cyber" not in p:
    p = rep(p, """const PREMIUM = [
  { id:'skin_gold',   t:'پوسته‌ی طلایی', d:'نئون، HUD و تمام رنگ‌های کافه طلایی می‌شوند', cost:8, type:'skin', v:'gold', icon:'🟡' },
  { id:'skin_violet', t:'پوسته‌ی بنفش',  d:'نئون و تمام رنگ‌های کافه بنفشِ رویایی می‌شوند', cost:8, type:'skin', v:'violet', icon:'🟣' },
  { id:'turbo',       t:'توربو اسلایدر', d:'دانلود و گیم ۲۵٪ سریع‌تر — برای همیشه', cost:6, type:'turbo', icon:'⚡' },
];""",
"""const PREMIUM = [
  { id:'skin_gold',   t:'پوسته‌ی طلایی', d:'نئون، HUD و تمام رنگ‌های کافه طلایی می‌شوند', cost:8, type:'skin', v:'gold', icon:'🟡' },
  { id:'skin_violet', t:'پوسته‌ی بنفش',  d:'نئون و تمام رنگ‌های کافه بنفشِ رویایی می‌شوند', cost:8, type:'skin', v:'violet', icon:'🟣' },
  { id:'skin_cyber',  t:'پوسته‌ی سایبری', d:'فیروزه‌ایِ نئونی و صورتیِ الکتریکی — حالِ تریون', cost:10, type:'skin', v:'cyber', icon:'🟢' },
  { id:'skin_forest', t:'پوسته‌ی جنگلی',  d:'سبزِ آرام و زردِ روشن — نفسِ صبحگاهی', cost:8, type:'skin', v:'forest', icon:'🟩' },
  { id:'skin_sunset', t:'پوسته‌ی غروب',   d:'نارنجیِ گرم و سرخِ پونک — آخرِ روزِ کاری', cost:8, type:'skin', v:'sunset', icon:'🟠' },
  { id:'skin_mono',   t:'پوسته‌ی مینیمال', d:'سفیدِ تک‌رنگِ خنثی — برای ذوقِ ساده‌نویسی', cost:6, type:'skin', v:'mono', icon:'⚪' },
  { id:'turbo',       t:'توربو اسلایدر', d:'دانلود و گیم ۲۵٪ سریع‌تر — برای همیشه', cost:6, type:'turbo', icon:'⚡' },
];""", 'premium')
    p = rep(p, "function openPremium(){ renderPremium(); $('premium').hidden = false; }",
"""function openPremium(){
  renderPremium();
  if(typeof renderCoinShop === 'function') renderCoinShop();
  if(typeof renderPass === 'function') renderPass();
  try{ $('prEnv').textContent = IAP.env(); }catch(e){}
  $('premium').hidden = false;
}""", 'openprem')
    p = rep(p, "  $('prClose').onclick = () => { Sfx.tickS(); hideFade('premium'); };",
"""  $('prClose').onclick = () => { Sfx.tickS(); hideFade('premium'); };
  $('btnIapTest').onclick = () => { Sfx.tickS(); iapSelfTest(); };""", 'bind')
wr('src/p5_ui.js', p); print('p5 OK')

# ================= build.sh — ماژولِ هشتم =================
p = rd('src/build.sh')
if 'p8_store.js' not in p:
    p = p.replace("cat p1_head.html p2_core.js p3_sim.js p4_scene.js p6_story.js p7_online.js p5_ui.js",
                  "cat p1_head.html p2_core.js p3_sim.js p4_scene.js p6_story.js p7_online.js p8_store.js p5_ui.js")
    p = p.replace("# ساختِ cafnet.html از ۷ ماژولِ سورس (۵ هسته + روایت + آنلاین)",
                  "# ساختِ cafnet.html از ۸ ماژولِ سورس (۵ هسته + روایت + آنلاین + فروشگاه)")
wr('src/build.sh', p); print('build OK')
print('patch20 done')
