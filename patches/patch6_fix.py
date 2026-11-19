# -*- coding: utf-8 -*-
# پچ ۶ — تکمیل p5 (بخشی که در پچ۵ نیمه‌کاره ماند) + راستی‌آزمایی DOM
import io
u = io.open('p5_ui.js', encoding='utf-8').read()

def rep(t, old, new, n=1):
    assert old in t, 'MISSING: ' + old[:70]
    return t.replace(old, new, n)

if "'dash'" not in u:
    u = rep(u, """const OVERLAYS = ['modal','shop','quests','summary','weekend','gameover','pause','menu','premium','crown'];""",
    """const OVERLAYS = ['modal','shop','quests','summary','weekend','gameover','pause','menu','premium','crown','dash'];""")
u = rep(u, """  ['modal','shop','quests','summary','weekend','gameover','pause'].forEach(id => $(id).hidden = true);""",
"""  ['modal','shop','quests','summary','weekend','gameover','pause','dash'].forEach(id => $(id).hidden = true);""")
if "dashClose" not in u:
    u = rep(u, """  $('questClose').onclick = () => { hideFade('quests'); };""",
    """  $('questClose').onclick = () => { hideFade('quests'); };
  $('dashClose').onclick = () => { Sfx.tickS(); hideFade('dash'); };""")
if "dashMoney" not in u:
    u = rep(u, """function openDash(){ renderDash(); $('dash').hidden = false; }""",
    """function openDash(){
  $('dashMoney').textContent = 'موجودی: ' + fmtK(G.money);
  renderDash();
  $('dash').hidden = false;
}""")
io.open('p5_ui.js', 'w', encoding='utf-8').write(u)

h = io.open('p1_head.html', encoding='utf-8').read()
for token in ['id="dash"', 'id="dashChart"', 'id="bankBox"', 'id="weekMission"', 'id="volS"', 'id="volM"', 'kpiGrid', 'volRow']:
    assert token in h, 'DOM MISSING: ' + token
print('patch6 OK — DOM verified')
