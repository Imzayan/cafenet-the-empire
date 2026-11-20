<script>
/* ============ بسته‌ی دارایی‌های پیکسل‌آرت — لودر و ترسیمِ افزودنی (فازِ Asset) ============
 * همه‌ی مسیرها با fallbackِ برداریِ کامل: اگر دارایی‌ها بارگذاری نشوند (مثلاً file:// یا APK)،
 * بازی دقیقاً مثل قبل با ترسیمِ برداری کار می‌کند — صفر خطا، صفر تغییرِ رفتار.
 */
const ART = {
  meta: null,
  img: {},
  ok: false,
  _patFloor: {}, _patWall: {},
  fx: [],   // افکت‌های اسپرایتیِ موقت

  load() {
    /* داراییِ امبدشده (p9b_embed.js) — روی file:// و APK هم کار می‌کند و با آپدیتِ خودکار می‌آید */
    if (window.__ASSETS_B64) {
      try {
        this.meta = JSON.parse(atob(window.__ASSETS_B64.manifest));
        const jobs = [];
        const get = (key, rel) => {
          const b = window.__ASSETS_B64.files[rel];
          if (!b) return;
          jobs.push(new Promise(res => {
            const im = new Image();
            im.onload = () => { ART.img[key] = im; res(); };
            im.onerror = () => res();
            im.src = 'data:image/png;base64,' + b;
          }));
        };
        for (const k in this.meta.chars) get('c_' + k, this.meta.chars[k].src);
        get('t_floor', this.meta.tiles.floorStages.src);
        get('t_carpet', this.meta.tiles.carpet.src);
        get('t_mat', this.meta.tiles.mat.src);
        for (let i = 0; i < this.meta.tiles.wall.length; i++) get('t_wall' + i, this.meta.tiles.wall[i].src);
        for (const k in this.meta.fx) get('f_' + k, this.meta.fx[k].src);
        for (const k in this.meta.ui) get('u_' + k, this.meta.ui[k].src);
        return Promise.all(jobs).then(() => {
          ART.ok = !!(ART.img['c_dl'] && ART.img['t_floor'] && ART.img['f_burst']);
        });
      } catch (e) { ART.ok = false; }
    }
    return fetch('assets/manifest.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(m => {
        ART.meta = m;
        const jobs = [];
        const add = (key, src) => jobs.push(new Promise(res => {
          const im = new Image();
          im.onload = () => { ART.img[key] = im; res(); };
          im.onerror = () => res(); // نبودِ فایل → همان کلید موجود نیست → fallback
          im.src = src;
        }));
        for (const k in m.chars) add('c_' + k, m.chars[k].src);
        add('t_floor', m.tiles.floorStages.src);
        add('t_carpet', m.tiles.carpet.src);
        add('t_mat', m.tiles.mat.src);
        for (let i = 0; i < m.tiles.wall.length; i++) add('t_wall' + i, m.tiles.wall[i].src);
        for (const k in m.fx) add('f_' + k, m.fx[k].src);
        for (const k in m.ui) add('u_' + k, m.ui[k].src);
        return Promise.all(jobs);
      })
      .then(() => {
        ART.ok = !!(ART.img['c_dl'] && ART.img['t_floor'] && ART.img['f_burst']);
        if (ART.ok && typeof toast === 'function') toast('🎨 دارایی‌های پیکسل‌آرت فعال شد — ' + Object.keys(ART.meta.chars).length + ' کاراکتر', 'cyan');
      })
      .catch(() => { ART.ok = false; });
  },

  hasChar(k) { return !!this.img['c_' + k]; },

  /* کاراکترِ راه‌رونده — فریم از فازِ bob؛ standing → idle روبه‌رو؛ dir منفی → آینه */
  blitChar(g, k, dir, bob, standing, x, baseY, H) {
    const im = this.img['c_' + k];
    if (!im) return false;
    const M = this.meta.chars[k], FW = M.fw, FH = M.fh;
    const row = standing ? 0 : 2;
    const frame = standing ? 0 : 1 + (Math.floor(bob * 0.2) % 4);
    const w = H * FW / FH, h = H;
    g.save();
    g.imageSmoothingEnabled = false;
    if (dir < 0) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); }
    g.drawImage(im, frame * FW, row * FH, FW, FH, x - w / 2, baseY - h, w, h);
    g.restore();
    return true;
  },

  /* الگویِ کف — تایلِ ۳۶×۲۱ دقیقاً هم‌_grid با شبکه‌ی برداری؛ هر مرحله یک ستون */
  floor(g, stg) {
    const im = this.img['t_floor'];
    if (!im) return false;
    let pat = this._patFloor[stg];
    if (!pat) {
      const c = document.createElement('canvas');
      c.width = this.meta.tiles.floorStages.tw; c.height = this.meta.tiles.floorStages.th;
      const cc = c.getContext('2d');
      cc.imageSmoothingEnabled = false;
      cc.drawImage(im, stg * c.width, 0, c.width, c.height, 0, 0, c.width, c.height);
      pat = g.createPattern(c, 'repeat');
      this._patFloor[stg] = pat;
    }
    g.save();
    g.translate(0, 124); g.fillStyle = pat;
    g.fillRect(0, 0, 820, 640 - 124);
    g.restore();
    return true;
  },

  /* دیوار — سه سطحِ ارتقا؛ تایلِ ۳۶×۷۶ */
  wall(g, lv) {
    const im = this.img['t_wall' + clamp(lv, 0, 2)];
    if (!im) return false;
    let pat = this._patWall[lv];
    if (!pat) {
      const c = document.createElement('canvas');
      c.width = 36; c.height = 76;
      const cc = c.getContext('2d');
      cc.imageSmoothingEnabled = false;
      cc.drawImage(im, 0, 0, 36, 76);
      pat = g.createPattern(c, 'repeat');
      this._patWall[lv] = pat;
    }
    g.save();
    g.translate(0, 48); g.fillStyle = pat;
    g.fillRect(0, 0, 820, 76);
    g.restore();
    return true;
  },

  /* فریمِ افکت — p: پیشرفتِ ۰..۱ */
  fxFrame(g, name, x, y, p, scale) {
    const im = this.img['f_' + name];
    if (!im || p < 0 || p > 1) return false;
    const M = this.meta.fx[name], n = M.frames, s = M.size;
    const i = Math.min(n - 1, Math.floor(p * n));
    const sz = s * (scale || 1);
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(im, i * s, 0, s, s, x - sz / 2, y - sz / 2, sz, sz);
    g.restore();
    return true;
  },

  uiIcon(g, name, x, y, size) {
    const im = this.img['u_' + name];
    if (!im) return false;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(im, x - size / 2, y - size / 2, size, size);
    g.restore();
    return true;
  },

  ring(x, y) { this.fx.push({ n: 'levelup', x, y, t: 0, d: 0.85 }); },
  sparkle(x, y) { this.fx.push({ n: 'sparkle', x, y, t: 0, d: 0.6 }); },
  burst(x, y) { this.fx.push({ n: 'burst', x, y, t: 0, d: 0.6 }); },

  renderFx(g, dt) {
    if (!this.ok) return;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += dt;
      const p = f.t / f.d;
      if (p >= 1) { this.fx.splice(i, 1); continue; }
      this.fxFrame(g, f.n, f.x, f.y, p);
    }
  },
};
window.addEventListener('load', () => { try { ART.load(); } catch (e) { ART.ok = false; } });
</script>
