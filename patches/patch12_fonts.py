# -*- coding: utf-8 -*-
# پچ ۱۲ — فونتِ embedded (وزیرمتن) + ایموجیِ اسپرایت‌کش + زنجیره‌ی fallback + cullingِ دوربین
import io, base64, os

FD = '/home/z/my-project/scripts/fonts/'

# ---------- ۱) embed فونت در p1 ----------
h = io.open('p1_head.html', encoding='utf-8').read()
if '@font-face' not in h:
    b64r = base64.b64encode(open(FD + 'Vazirmatn-Regular.woff2', 'rb').read()).decode()
    b64b = base64.b64encode(open(FD + 'Vazirmatn-Bold.woff2', 'rb').read()).decode()
    ff = ("@font-face{font-family:'Vazirmatn';src:url(data:font/woff2;base64," + b64r +
          ") format('woff2');font-weight:400;font-style:normal;font-display:swap}\n"
          "@font-face{font-family:'Vazirmatn';src:url(data:font/woff2;base64," + b64b +
          ") format('woff2');font-weight:700;font-style:normal;font-display:swap}\n")
    old = "body{font-family:'Vazirmatn',Tahoma,'Segoe UI',system-ui,sans-serif;"
    assert old in h, 'body rule missing'
    h = h.replace(old,
        ff + "body{font-family:'Vazirmatn',Tahoma,'Segoe UI','Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',system-ui,sans-serif;", 1)
    io.open('p1_head.html', 'w', encoding='utf-8').write(h)
    print('fonts embedded:', len(b64r) + len(b64b), 'chars')

# ---------- ۲) p4: پشته‌ی فونت + اسپرایت ایموجی ----------
p = io.open('p4_scene.js', encoding='utf-8').read()

def rep(t, old, new, n=1):
    assert old in t, 'MISSING: ' + old[:70]
    return t.replace(old, new, n)

p = rep(p, """/* ================= ابزارهای ترسیم ================= */
const glows = {};""",
"""/* ================= ابزارهای ترسیم ================= */
const FONT_STACK = "'Vazirmatn', Tahoma, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
/* اسپرایتِ کش‌شده‌ی ایموجی — جلوگیری از رسترِ گران در هر فریم */
const EM_RE = /^[\\s\\u{1F000}-\\u{1FAFF}\\u{2190}-\\u{21FF}\\u{2300}-\\u{27BF}\\u{2900}-\\u{29FF}\\u{2B00}-\\u{2BFF}\\u{FE0F}\\u{200D}]+$/u;
const _emSpr = {};
function emSprite(t, size, bold, color){
  const key = t + '|' + size + '|' + (bold ? 'b' : 'r') + '|' + color + '|' + Math.round(dpr);
  if(_emSpr[key] !== undefined) return _emSpr[key];
  try{
    const pad = Math.ceil(size * 0.45);
    const W = Math.ceil(size * (t.length * 1.15 + 1) + pad * 2);
    const H = Math.ceil(size * 1.6 + pad * 2);
    const c = document.createElement('canvas');
    c.width = Math.max(8, W * Math.round(dpr)); c.height = Math.max(8, H * Math.round(dpr));
    const g = c.getContext('2d');
    g.scale(Math.round(dpr) || 1, Math.round(dpr) || 1);
    g.font = (bold ? 'bold ' : '') + size + 'px ' + FONT_STACK;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(t, W / 2, H / 2 + 1);
    _emSpr[key] = c;
    return c;
  }catch(e){ _emSpr[key] = null; return null; }
}
const glows = {};""")

p = rep(p, """function faText(t, x, y, size, color, align, bold){
  ctx.font = (bold ? 'bold ' : '') + size + "px 'Vazirmatn', Tahoma";
  ctx.fillStyle = color; ctx.textAlign = align || 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(t, x, y);
}""",
"""function faText(t, x, y, size, color, align, bold){
  if(t && t.length <= 8 && EM_RE.test(t)){
    const s = emSprite(t, size, bold, color);
    if(s){
      ctx.save();
      if(align === 'center'){ ctx.drawImage(s, x - s.width / (2 * dpr), y - s.height / (2 * dpr), s.width / dpr, s.height / dpr); }
      else if(align === 'left'){ ctx.drawImage(s, x, y - s.height / (2 * dpr), s.width / dpr, s.height / dpr); }
      else { ctx.drawImage(s, x - s.width / dpr, y - s.height / (2 * dpr), s.width / dpr, s.height / dpr); }
      ctx.restore();
      return;
    }
  }
  ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT_STACK;
  ctx.fillStyle = color; ctx.textAlign = align || 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(t, x, y);
}""")

# فونتِ بیلدِ پس‌زمینه → پشته‌ی کامل
import re
p = re.sub(r'g\.font = "bold ([\d.]+)px Tahoma"', r'g.font = "bold \1px " + FONT_STACK', p)

p = rep(p, "ctx.font = '8.5px Tahoma';", "ctx.font = '8.5px ' + FONT_STACK;")
p = rep(p, "ctx.font = 'bold 10.5px Tahoma';", "ctx.font = 'bold 10.5px ' + FONT_STACK;")
p = rep(p, """ctx.font = "7.5px 'Vazirmatn', Tahoma";""", """ctx.font = '7.5px ' + FONT_STACK;""")

# ---------- ۳) culling: فقط آنچه در دیدِ دوربین است ----------
p = rep(p, """  drawLamps();
  for(let i = 0; i < MAX_SLOTS; i++) drawDesk(i);
  drawPrintStation();
  for(const p of G.people) if(p.type !== 'cust') drawPerson(p);
  drawQueuePeople();
  for(const p of G.people) if(p.type === 'cust') drawPerson(p);""",
"""  drawLamps();
  const z0 = G.zoom || 1;
  const visL = G.cam.x - 60, visR = G.cam.x + VW / z0 + 60;
  for(let i = 0; i < MAX_SLOTS; i++){
    const dp = deskPos(i);
    if(dp.x < visL || dp.x > visR) continue;
    drawDesk(i);
  }
  drawPrintStation();
  for(const pp of G.people) if(pp.type !== 'cust' && pp.x > visL - 10 && pp.x < visR + 10) drawPerson(pp);
  drawQueuePeople();
  for(const pp of G.people) if(pp.type === 'cust' && pp.x > visL - 14 && pp.x < visR + 14) drawPerson(pp);""")

io.open('p4_scene.js', 'w', encoding='utf-8').write(p)

# ---------- ۴) p5: بازساختِ bg بعد از آماده‌شدن فونت ----------
u = io.open('p5_ui.js', encoding='utf-8').read()
u = rep(u, """function init(){
  Save.load();""",
"""function init(){
  Save.load();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try{ buildBG(); }catch(e){} });""")
io.open('p5_ui.js', 'w', encoding='utf-8').write(u)
print('patch12 OK')
