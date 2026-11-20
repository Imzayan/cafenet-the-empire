# -*- coding: utf-8 -*-
# patch25 — فیکس‌های QA: کرشِ claimPass، هشدارِ موجودیِ منفی، مقدارِ برگشتیِ load
import io

def rd(f): return io.open(f, encoding='utf-8').read()
def wr(f, t): io.open(f, 'w', encoding='utf-8').write(t)
def rep(t, old, new, tag):
    assert old in t, 'MISSING[%s]: %s' % (tag, old[:70])
    return t.replace(old, new, 1)

# ---------- ۱) کرشِ claimPass — تیرِ ۰ یا خارج از محدوده ----------
p = rd('src/p8_store.js')
OLD = """function claimPass(i) {
  const P = passState();
  if (i > P.tier) { toast('اول این تیر را با XPِ روزها پر کن', 'red'); return; }
  if (P.claimed.includes(i)) return;
  P.claimed.push(i);
  const R = PASS_REWARDS[i - 1];
  if (R.coins) Save.d.coins += R.coins;"""
NEW = """function claimPass(i) {
  i = clamp(Math.floor(+i) || 1, 1, PASS_TIERS); // فیکسِ QA: تیرِ ۰/ناعدا کرش می‌کرد
  const P = passState();
  if (i > P.tier) { toast('اول این تیر را با XPِ روزها پر کن', 'red'); return; }
  if (P.claimed.includes(i)) return;
  const R = PASS_REWARDS[i - 1];
  if (!R) return; // فیکسِ QA: جایزه‌ی تعریف‌نشده — بدونِ کرش
  P.claimed.push(i);
  if (R.coins) Save.d.coins += R.coins;"""
p = rep(p, OLD, NEW, 'claimpass')
wr('src/p8_store.js', p); print('claimPass fix OK')

# ---------- ۲) هشدارِ موجودیِ منفی در پایانِ روز ----------
p = rd('src/p3_sim.js')
OLD2 = """  checkLT();
  checkCrown();
  G.risk = 0;
  persist();
  G.paused = true;
  showSummary();
}"""
NEW2 = """  checkLT();
  checkCrown();
  G.risk = 0;
  if(G.money < 0) toast('⚠ موجودیِ منفی شد — با وامِ بانک یا درآمدِ فردا جبران کن', 'red');
  persist();
  G.paused = true;
  showSummary();
  return true;
}"""
p = rep(p, OLD2, NEW2, 'endday-warn')
wr('src/p3_sim.js', p); print('endDay warning OK')

# ---------- ۳) load() مقدارِ برگشتیِ بولی ----------
p = rd('src/p2_core.js')
OLD3 = """    }catch(e){ this.d = this.defaults(); }
  },"""
NEW3 = """    }catch(e){ this.d = this.defaults(); }
    return !!p;
  },"""
p = rep(p, OLD3, NEW3, 'load-return')
wr('src/p2_core.js', p); print('load return OK')
print('patch25 done')
