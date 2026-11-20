<script>
/* ============================================================
   کافه‌نت — لایه‌ی گرافیکِ پرمیوم (فازِ ۴ — v1.4.0)
   نورِ پویا با سوراخِ نور · سایه‌ی نرمِ آدم‌ها · مخروطِ نورِ مانیتور
   غبارِ نور · جشنِ سطحِ جدید · همه‌ی ذراتِ Pool‌شده
   بدونِ APIِ مدرن — سازگار با WebViewهای قدیمی
   ============================================================ */

window.Gfx = (function(){
  try{
    /* ---------- اسپرایت‌های از-پیش-ساخته ---------- */
    const HOLE_R = 48;
    const holeSpr = (function(){
      const c = document.createElement('canvas'); c.width = c.height = HOLE_R * 2;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(HOLE_R, HOLE_R, 2, HOLE_R, HOLE_R, HOLE_R);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.55, 'rgba(255,255,255,.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, HOLE_R * 2, HOLE_R * 2);
      return c;
    })();

    const cones = {};
    function cone(color){
      if(cones[color]) return cones[color];
      const c = document.createElement('canvas'); c.width = 48; c.height = 46;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 46);
      gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.globalAlpha = 1;
      g.beginPath();
      g.moveTo(19, 0); g.lineTo(29, 0);
      g.quadraticCurveTo(40, 26, 46, 46); g.lineTo(2, 46);
      g.quadraticCurveTo(8, 26, 19, 0);
      g.closePath(); g.fill();
      cones[color] = c;
      return c;
    }

    /* ---------- Pool عمومی (بدونِ تخصیصِ حینِ فریم) ---------- */
    function Pool(n, make){
      this.items = new Array(n);
      for(let i = 0; i < n; i++) this.items[i] = make();
      this.n = 0;
    }
    Pool.prototype.get = function(){ return this.n < this.items.length ? this.items[this.n++] : null; };
    /* flushِ امن: حذفِ درجایِ مرده‌ها با جابه‌جاییِ آخرین عضوِ زنده — بدونِ تخصیصِ آرایه‌ی جدید */
    Pool.prototype.flush = function(aliveFn){
      let i = 0;
      while(i < this.n){
        if(aliveFn(this.items[i])) { i++; continue; }
        this.n--;
        const tmp = this.items[i];
        this.items[i] = this.items[this.n];
        this.items[this.n] = tmp;
      }
    };

    /* ---------- بومِ نور (نصفِ رزولوشن) ---------- */
    const LW = Math.ceil(VW / 2), LH = Math.ceil(VH / 2), LK = 0.5;
    const lightCv = document.createElement('canvas');
    lightCv.width = LW; lightCv.height = LH;
    const lg2 = lightCv.getContext('2d');

    /* ---------- غبارِ نور ---------- */
    const DUST_N = 14;
    const dust = new Pool(DUST_N, function(){
      return { x: 0, y: 0, vx: 0, vy: 0, ph: 0, init: false };
    });
    function seedDust(d){
      d.x = G.cam.x + rnd(10, VW - 10); d.y = rnd(140, 430);
      d.vx = rnd(-4, 4); d.vy = rnd(-6, -1.5); d.ph = rnd(0, TAU); d.init = true;
    }

    /* ---------- جشنِ سطحِ جدید ---------- */
    const rings = new Pool(4, function(){ return { t: 0, on: false }; });
    const confetti = new Pool(26, function(){
      return { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, ci: 0 };
    });
    const CONF_COLS = ['#ffd75f', '#4cff9e', '#59c2ff', '#ff5fa2', '#ffffff'];
    let burstT = 0;

    function levelBurst(){
      const r = rings.get();
      if(r){ r.t = 0; r.on = true; }
      for(let i = 0; i < 22; i++){
        const p = confetti.get();
        if(!p) break;
        const a = -Math.PI / 2 + (i - 11) * 0.14;
        const sp = rnd(110, 210);
        p.x = 180; p.y = 208;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.rot = rnd(0, TAU); p.vr = rnd(-7, 7); p.life = 1.15; p.ci = i % CONF_COLS.length;
      }
      burstT = 0.6;
      if(typeof floater === 'function') floater(180, 186, '⭐ ارتقای سطح!', '#ffd75f');
    }

    /* ---------- منابعِ نورِ ثابت ---------- */
    function hole(lx, ly, r, a){
      if(lx < -r || lx > VW + r || ly < -r || ly > VH + r) return;
      lg2.globalAlpha = a;
      lg2.drawImage(holeSpr, (lx - r) * LK, (ly - r) * LK, r * 2 * LK, r * 2 * LK);
    }

    function lightPass(){
      if(G.scene !== 'day' && G.scene !== 'menu') return;
      const dfr = clamp(G.t / DAY_LEN, 0, 1);
      const dark = dfr < 0.22 ? 0.13 : dfr < 0.62 ? 0.08 : dfr < 0.85 ? 0.20 : 0.30;
      const cam = G.cam.x, z0 = G.zoom || 1;

      lg2.setTransform(1, 0, 0, 1, 0, 0);
      lg2.globalCompositeOperation = 'source-over';
      lg2.globalAlpha = 1;
      lg2.clearRect(0, 0, LW, LH);
      lg2.fillStyle = '#06090f';
      lg2.fillRect(0, 0, LW, LH);
      lg2.globalCompositeOperation = 'destination-out';

      const W = function(x){ return x - cam; }; // world → viewport

      /* لامپ‌های آویز — با تابِ نوسان */
      for(const lx of LAMP_XS){
        for(const sy of [126, 246]){
          const dx = Math.sin(G.t * 0.8 + lx + sy) * 1.4;
          hole(W(lx + dx), sy + 12, 38 * z0, 0.85);
        }
      }
      /* ردیفِ لامپِ سقفی */
      for(let i = 0; i < 9; i++) hole(W(22 + i * 38), 50, 22, 0.5);
      /* نئون‌ها و منابعِ ثابت */
      hole(W(180), 67, 50, 0.9);
      hole(W(500), 66, 36, 0.75);
      hole(W(267), 92, 30, 0.5);
      hole(W(267), 71, 26, 0.5);
      hole(W(334), 108, 30, 0.7);
      /* مانیتورهای روشن */
      for(let i = 0; i < MAX_SLOTS; i++){
        const s = G.systems && G.systems[i];
        if(!s || !s.kind || s.virus || s.rebootT > 0) continue;
        const p = deskPos(i);
        if(p.x < cam - 40 || p.x > cam + VW + 40) continue;
        hole(W(p.x), p.y - 12, 30 * z0, 0.6);
      }
      /* گوشه‌های بازیِ اشغال */
      if(typeof CONSOLE_POS !== 'undefined' && CONSOLE_POS && lvl && lvl('console') >= 1){
        for(let i = 0; i < CONSOLE_POS.length; i++){
          const P = CONSOLE_POS[i];
          if(G.console && G.console[i] && G.console[i].c) hole(W(P.x + 26), P.y - 48, 26, 0.55);
        }
      }
      /* چاپگرِ درگیر */
      if(G.printerJob >= 0 && G.systems[G.printerJob] && G.systems[G.printerJob].kind === 'print') hole(W(321), 372, 26, 0.5);

      /* ترکیبِ تاریکی روی صحنه */
      lg2.globalAlpha = 1;
      lg2.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.globalAlpha = dark;
      ctx.drawImage(lightCv, cam, 0, VW, VH);
      ctx.restore();

      /* غبارِ نور — بالای تاریکی، زیرِ HUD */
      for(let i = 0; i < dust.n; i++){
        const d = dust.items[i];
        if(!d.init) seedDust(d);
        d.x += d.vx * (G.dt || 1 / 60); d.y += d.vy * (G.dt || 1 / 60);
        if(d.y < 118 || d.x < cam - 24 || d.x > cam + VW + 24) seedDust(d);
        const a = 0.05 + 0.10 * (Math.sin(G.t * 2.2 + d.ph) + 1) / 2;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#dfe8ff';
        ctx.fillRect(d.x - 0.7, d.y - 0.7, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;

      /* جشنِ سطحِ جدید — حلقه + کانفتی */
      const dt = G.dt || 1 / 60;
      burstT = Math.max(0, burstT - dt);
      for(let i = 0; i < rings.n; i++){
        const r = rings.items[i];
        if(!r.on) continue;
        r.t += dt;
        if(r.t > 0.9){ r.on = false; continue; }
        const rr2 = 24 + r.t * 150;
        ctx.globalAlpha = (1 - r.t / 0.9) * 0.8;
        ctx.strokeStyle = '#ffd75f'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(180, 208, rr2, 0, TAU); ctx.stroke();
        ctx.globalAlpha = (1 - r.t / 0.9) * 0.3;
        putGlow(180, 208, rr2 * 0.8, 'rgba(255,215,95,.9)', 0.5);
      }
      for(let i = 0; i < confetti.n; i++){
        const p = confetti.items[i];
        if(p.life <= 0) continue;
        p.life -= dt;
        p.vy += 330 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if(p.life > 0){
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = clamp(p.life * 1.4, 0, 1);
          ctx.fillStyle = CONF_COLS[p.ci];
          ctx.fillRect(-1.8, -2.8, 3.6, 5.6);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      rings.flush(function(r){ return r.on; });
      confetti.flush(function(p){ return p.life > 0; });
    }

    /* ---------- سایه‌های نرم + مخروطِ نورِ مانیتور (زیرِ آدم‌ها) ---------- */
    function shadow(x, y, rx, ry, a){
      ctx.globalAlpha = a;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * 0.7;
      ctx.beginPath(); ctx.ellipse(x, y - 0.6, rx * 0.62, ry * 0.55, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function floorFx(){
      if(G.scene !== 'day' && G.scene !== 'menu') return;
      /* مخروطِ نورِ مانیتور — رنگِ نوعِ فعالیت */
      for(let i = 0; i < MAX_SLOTS; i++){
        const s = G.systems && G.systems[i];
        if(!s || !s.kind || s.virus || s.rebootT > 0) continue;
        const p = deskPos(i);
        if(p.x < G.cam.x - 40 || p.x > G.cam.x + VW + 40) continue;
        const K = KINDS[s.kind];
        const col = rgb(K.color);
        ctx.globalAlpha = 0.10 + (s.vipDesk ? 0.05 : 0);
        ctx.drawImage(cone(col), p.x - 24, p.y - 4, 48, 46);
        ctx.globalAlpha = 1;
      }
      /* سایه‌ی نرمِ آدم‌ها */
      for(const c of G.people){
        if(!c || c.x === undefined) continue;
        if(c.type === 'cust'){
          if(c.state === 'sit') continue;
          shadow(c.x, c.y + 10.5, 9.5, 2.8, 0.22);
        } else if(c.type === 'clean' || c.type === 'tech'){
          shadow(c.x, c.y + 10.5, 9, 2.6, 0.22);
        }
      }
      for(const c of G.queue) shadow(c.x, c.y + 11, 9.5, 2.8, 0.22);
    }

    return { lightPass: lightPass, floorFx: floorFx, levelBurst: levelBurst };
  }catch(e){
    return { lightPass: function(){}, floorFx: function(){}, levelBurst: function(){} };
  }
})();
</script>
