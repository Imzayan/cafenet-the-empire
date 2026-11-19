<script>
/* ============================================================
   کافه‌نت — رندر: کافه‌ی واقعی · نور و کاشی · مانیتورِ زنده
   آدم‌های پوشیده · لامپِ آویز · وینیت · HUD قرصی
   ============================================================ */

const cv = $('cv');

/* پالت‌های پرمیوم — رنگِ کل صحنه با پوسته عوض می‌شود */
const PALS4 = {
  classic: { g:'#4cff9e', p:'#ff5fa2', c:'#59c2ff', a:'#f2c14e', r:'#ff4d5e',
             G:[76,255,158], P:[255,95,162], C:[89,194,255], A:[242,193,78], R:[255,77,94] },
  gold:    { g:'#ffd75f', p:'#ff9d5c', c:'#ffe9a8', a:'#ffd75f', r:'#ff6a4d',
             G:[255,215,95], P:[255,157,92], C:[255,233,168], A:[255,215,95], R:[255,106,77] },
  violet:  { g:'#b38cff', p:'#ff6fd8', c:'#8ea8ff', a:'#c9a5ff', r:'#ff5f9e',
             G:[179,140,255], P:[255,111,216], C:[142,168,255], A:[201,165,255], R:[255,95,158] },
};
function PAL(){ return PALS4[Save.d.skin] || PALS4.classic; }
function hexk(k){ return PAL()[k]; }
function pcol(k, a){ return 'rgba(' + PAL()[k.toUpperCase()].join(',') + ',' + a + ')'; }
const ctx = cv.getContext('2d');
let scale = 1, ox = 0, oy = 0, dpr = 1;
let bgCanvas = null, vignCanvas = null;
G.zoom = 1;
const ZC = { x: 180, y: 330 };
function setZoom(z){
  G.zoom = clamp(Math.round(z * 20) / 20, 1, 1.8);
  Sfx.tickS();
}
cv.addEventListener('wheel', e => {
  if(G.scene !== 'day') return;
  e.preventDefault();
  setZoom((G.zoom || 1) + (e.deltaY < 0 ? 0.15 : -0.15));
}, { passive: false });

function resize(){
  const w = cv.clientWidth || window.innerWidth, h = cv.clientHeight || window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = Math.min(w / VW, h / VH) * dpr;
  ox = (w * dpr - VW * scale) / 2;
  oy = (h * dpr - VH * scale) / 2;
  buildBG();
  buildVignette();
}
window.addEventListener('resize', resize);
function vxy(e){
  const r = cv.getBoundingClientRect();
  const d = cv.width / r.width;
  let x = ((e.clientX - r.left) * d - ox) / scale;
  let y = ((e.clientY - r.top) * d - oy) / scale;
  const z = G.zoom || 1;
  if(z !== 1){ x = ZC.x + (x - ZC.x) / z; y = ZC.y + (y - ZC.y) / z; }
  return { x, y };
}

/* ================= ابزارهای ترسیم ================= */
const FONT_STACK = "'Vazirmatn', Tahoma, 'Segoe UI', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
/* اسپرایتِ کش‌شده‌ی ایموجی — جلوگیری از رسترِ گران در هر فریم */
const EM_RE = /^[\s\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2900}-\u{29FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+$/u;
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
const glows = {};
function glow(color){
  if(glows[color]) return glows[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glows[color] = c;
  return c;
}
function putGlow(x, y, r, color, alpha){
  ctx.globalAlpha = alpha;
  ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}
function rr(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function faText(t, x, y, size, color, align, bold){
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
}
/* ================= گوشه‌ی کنسول ================= */
function drawConsoles(){
  if(!lvl('console') || !CONSOLE_POS) return;
  const z0 = G.zoom || 1;
  const visL = G.cam.x - 80, visR = G.cam.x + VW / z0 + 80;
  for(let i = 0; i < CONSOLE_POS.length; i++){
    const P = CONSOLE_POS[i];
    if(P.x < visL || P.x > visR) continue;
    const busy = G.console && G.console[i] && G.console[i].c;
    // فرشِ گوشه
    ctx.fillStyle = 'rgba(96,72,150,.20)';
    rr(P.x - 36, P.y - 24, 72, 46, 9); ctx.fill();
    // مبلِ دو نفره
    ctx.fillStyle = '#2b3252';
    rr(P.x - 32, P.y - 20, 42, 28, 7); ctx.fill();
    ctx.fillStyle = busy ? '#39426e' : '#31395e';
    rr(P.x - 36, P.y - 12, 50, 15, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    rr(P.x - 32, P.y - 20, 42, 6, 4); ctx.fill();
    // پایه‌ی تلویزیون
    ctx.fillStyle = '#171d33';
    ctx.fillRect(P.x + 17, P.y - 36, 5, 44);
    ctx.fillStyle = '#232a46';
    ctx.fillRect(P.x + 10, P.y + 4, 19, 5);
    // قابِ تلویزیون
    ctx.fillStyle = '#0b1122';
    rr(P.x + 8, P.y - 60, 36, 24, 4); ctx.fill();
    if(busy){
      // صفحه‌ی روشنِ بازی + گلو
      const hue = ['#59c2ff', '#4cff9e'][i % 2];
      ctx.fillStyle = hue; ctx.globalAlpha = .8;
      ctx.fillRect(P.x + 11, P.y - 57, 30, 18);
      ctx.globalAlpha = 1;
      // نمودارِ بازیِ متحرک
      ctx.fillStyle = 'rgba(11,17,34,.9)';
      for(let b = 0; b < 3; b++){
        const bh = 3 + sRand(i * 3 + 1, b * 7 + Math.floor(G.t * 2.5)) * 11;
        ctx.fillRect(P.x + 13 + b * 10, P.y - 43 - bh, 7, bh);
      }
      putGlow(P.x + 26, P.y - 48, 30, 'rgba(89,194,255,.45)', .55);
    } else {
      ctx.fillStyle = '#131a30';
      ctx.fillRect(P.x + 11, P.y - 57, 30, 18);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.fillRect(P.x + 11, P.y - 57, 30, 3);
      ctx.fillStyle = 'rgba(89,194,255,.10)';
      faText('🎮', P.x + 26, P.y - 48, 9, '#59c2ff', 'center');
    }
    // دسته‌ی بازی روی مبل
    ctx.fillStyle = busy ? '#ff5fa2' : '#5a6480';
    rr(P.x - 24, P.y + 2, 10, 6, 2.5); ctx.fill();
    if(busy){
      putGlow(P.x - 19, P.y + 5, 12, 'rgba(255,95,162,.4)', .5);
    }
  }
}
function sRand(i, j){ const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }

function drawIcon(kind, x, y, s, color){
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, s * 0.16);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(kind === 'dl'){
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s * 0.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.15); ctx.lineTo(x, y + s * 0.45); ctx.lineTo(x + s * 0.5, y - s * 0.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.7, y + s * 0.8); ctx.lineTo(x + s * 0.7, y + s * 0.8); ctx.stroke();
  } else if(kind === 'game'){
    for(let i = 0; i < 3; i++){
      const h = s * (0.4 + i * 0.3);
      ctx.beginPath(); ctx.moveTo(x - s * 0.7 + i * s * 0.7, y + s * 0.6); ctx.lineTo(x - s * 0.7 + i * s * 0.7, y + s * 0.6 - h); ctx.stroke();
    }
  } else if(kind === 'chat'){
    rr(x - s * 0.8, y - s * 0.6, s * 1.6, s * 1.1, s * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 0.5); ctx.lineTo(x - s * 0.45, y + s * 0.9); ctx.lineTo(x + s * 0.05, y + s * 0.5); ctx.stroke();
    for(let i = 0; i < 3; i++){ ctx.beginPath(); ctx.arc(x - s * 0.35 + i * s * 0.35, y - s * 0.05, s * 0.09, 0, TAU); ctx.fill(); }
  } else if(kind === 'print'){
    ctx.strokeRect(x - s * 0.75, y - s * 0.1, s * 1.5, s * 0.75);
    ctx.strokeRect(x - s * 0.45, y - s * 0.7, s * 0.9, s * 0.6);
    ctx.beginPath(); ctx.arc(x + s * 0.45, y + s * 0.27, s * 0.07, 0, TAU); ctx.fill();
  } else if(kind === 'tea'){
    ctx.beginPath(); ctx.moveTo(x - s * 0.7, y); ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.7, x + s * 0.5, y + s * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + s * 0.62, y + s * 0.28, s * 0.22, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.5); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.9, x - s * 0.05, y - s * 1.1); ctx.stroke();
  } else if(kind === 'lock'){
    ctx.strokeRect(x - s * 0.5, y - s * 0.1, s, s * 0.75);
    ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * 0.3, Math.PI, TAU); ctx.stroke();
  }
}
function ringColor(f){
  const g = [76,255,158], a = [242,193,78], r = [255,77,94];
  return f > 0.5 ? rgb(mix(a, g, (f - 0.5) * 2)) : rgb(mix(r, a, f * 2));
}
function drawRing(x, y, r, frac, color, width){
  ctx.strokeStyle = 'rgba(255,255,255,.09)';
  ctx.lineWidth = width || 3.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  const c = color || ringColor(frac);
  ctx.strokeStyle = c;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI/2, -Math.PI/2 + TAU * clamp(frac, 0, 1)); ctx.stroke();
  putGlow(x, y, r * 1.5, c, 0.15);
}

/* ================= پس‌زمینه‌ی پیش‌ساخته ================= */
function buildBG(){
  const M = 20;
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = Math.ceil(2 * ox + (WORLD_W + 2 * M) * scale);
  bgCanvas.height = cv.height;
  const g = bgCanvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(ox + M * scale, oy); g.scale(scale, scale);
  g.fillStyle = '#060709';
  g.fillRect(-ox/scale, -oy/scale, (WORLD_W + 2 * M + 2 * ox / scale) * 1.2, VH * 3);
  g.fillStyle = '#0a0c10';
  g.fillRect(0, 0, WORLD_W, VH);
  var putGlowDyn = null;

  /* ---- دیوار — با پالتِ خریداری‌شده ---- */
  const wallLv = lvl('wall');
  const wallC = wallLv >= 2 ? '#2a2129' : wallLv >= 1 ? '#15262e' : '#171e2a';
  const wallTrim = wallLv >= 2 ? 'rgba(255,157,92,.1)' : wallLv >= 1 ? 'rgba(89,194,255,.12)' : 'rgba(255,255,255,.06)';
  g.fillStyle = wallC;
  g.fillRect(0, 48, WORLD_W, 76);
  g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1;
  for(let y = 56; y < 124; y += 9){
    g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD_W, y); g.stroke();
    for(let x = (y % 18 < 9 ? 12 : 24); x < WORLD_W; x += 26){
      g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x, y); g.stroke();
    }
  }
  g.fillStyle = wallTrim; g.fillRect(0, 48, WORLD_W, 1.5);
  g.fillStyle = '#0e1117';
  g.fillRect(0, 118, WORLD_W, 6);
  g.fillStyle = wallTrim;
  g.fillRect(0, 118, WORLD_W, 1.2);

  /* ---- ریسه‌ی پرچم ---- */
  const bcols = [hexk('p'), hexk('g'), hexk('c'), hexk('a')];
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(4, 50); g.quadraticCurveTo(62, 58, 120, 51); g.stroke();
  g.beginPath(); g.moveTo(240, 51); g.quadraticCurveTo(298, 58, 356, 50); g.stroke();
  for(let i = 0; i < 6; i++){
    const x = 10 + i * 19, y = 51 + Math.sin((i + 0.5) / 6 * Math.PI) * 4;
    g.fillStyle = bcols[i % 4]; g.globalAlpha = 0.55;
    g.beginPath(); g.moveTo(x - 3.6, y); g.lineTo(x + 3.6, y); g.lineTo(x, y + 7); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
  for(let i = 0; i < 6; i++){
    const x = 246 + i * 19, y = 51 + Math.sin((i + 0.5) / 6 * Math.PI) * 4;
    g.fillStyle = bcols[(i + 2) % 4]; g.globalAlpha = 0.55;
    g.beginPath(); g.moveTo(x - 3.6, y); g.lineTo(x + 3.6, y); g.lineTo(x, y + 7); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }

  /* ---- اسنک‌بار ---- */
  g.fillStyle = 'rgba(16,20,26,.94)';
  rr(g, 296, 206, 52, 44, 8); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
  rr(g, 296, 206, 52, 44, 8); g.stroke();
  g.fillStyle = 'rgba(140,220,255,.1)';
  rr(g, 301, 211, 42, 24, 5); g.fill();
  const canCols = ['#ff5fa2', '#4cff9e', '#f2c14e', '#59c2ff'];
  for(let i = 0; i < 4; i++){
    g.fillStyle = canCols[i]; g.globalAlpha = 0.75;
    g.fillRect(304 + i * 10, 219, 5.5, 12);
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(255,255,255,.08)';
  g.fillRect(301, 240, 42, 4);
  g.fillStyle = 'rgba(242,193,78,.8)';
  g.fillRect(312, 246, 10, 2.5);
  g.font = "bold 7px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = '#8a95a2';
  g.fillText('اسنک‌بار', 322, 258);

  /* ---- پوسترها ---- */
  poster(g, 62, 54, 22, 30, hexk('p'));
  poster(g, 248, 54, 22, 30, hexk('c'));

  /* ---- قاب نئون (متنش پویاست) ---- */
  g.strokeStyle = pcol('g',.3); g.lineWidth = 1.4;
  rr(g, 128, 56, 104, 22, 8); g.stroke();
  g.strokeStyle = pcol('p',.25); g.lineWidth = 1;
  rr(g, 131, 59, 98, 16, 6); g.stroke();

  /* ---- تخته‌ی منو ---- */
  g.fillStyle = '#10140f';
  rr(g, 96, 62, 26, 44, 3); g.fill();
  g.strokeStyle = '#3a2f22'; g.lineWidth = 2;
  rr(g, 96, 62, 26, 44, 3); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2;
  g.beginPath(); g.arc(103, 74, 3, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.fillRect(101, 84, 16, 1.6); g.fillRect(101, 89, 11, 1.6); g.fillRect(101, 94, 14, 1.6);
  g.fillStyle = pcol('a',.6);
  g.fillRect(101, 98, 8, 1.6);

  /* ---- پنجره‌ی شب ---- */
  g.fillStyle = '#1b2230';
  g.fillRect(158, 74, 54, 46);
  g.fillStyle = '#0a1122';
  g.fillRect(161, 77, 48, 40);
  for(let i = 0; i < 9; i++){
    g.fillStyle = 'rgba(220,230,255,' + (0.3 + sRand(i, 7) * 0.5).toFixed(2) + ')';
    g.fillRect(164 + sRand(i, 1) * 42, 79 + sRand(i, 3) * 26, 1.2, 1.2);
  }
  g.fillStyle = '#d8e2f0';
  g.beginPath(); g.arc(199, 86, 5.5, 0, TAU); g.fill();
  g.fillStyle = '#0a1122';
  g.beginPath(); g.arc(196.5, 84.5, 5, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.16)';
  for(let y = 82; y < 117; y += 8) g.fillRect(161, y, 48, 1.4);
  g.strokeStyle = '#1b2230'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(185, 77); g.lineTo(185, 117); g.stroke();
  g.fillStyle = '#242e3c'; g.fillRect(156, 118, 58, 3);

  /* ---- ساعت ---- */
  g.fillStyle = '#0e1117';
  g.beginPath(); g.arc(232, 64, 8.5, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.6;
  g.beginPath(); g.arc(232, 64, 8.5, 0, TAU); g.stroke();
  for(let i = 0; i < 4; i++){
    const a = i / 4 * TAU - Math.PI/2;
    g.beginPath();
    g.moveTo(232 + Math.cos(a) * 5.6, 64 + Math.sin(a) * 5.6);
    g.lineTo(232 + Math.cos(a) * 7, 64 + Math.sin(a) * 7);
    g.stroke();
  }

  /* ---- کانتر ---- */
  g.fillStyle = '#26313d';
  rr(g, 12, 92, 106, 12, 3); g.fill();
  g.fillStyle = 'rgba(255,255,255,.1)';
  g.fillRect(12, 92, 106, 1.6);
  g.fillStyle = '#131a22';
  g.fillRect(16, 104, 98, 22);
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
  for(const x of [40, 64, 88]){ g.beginPath(); g.moveTo(x, 106); g.lineTo(x, 124); g.stroke(); }
  g.fillStyle = '#1c2530';
  rr(g, 22, 84, 15, 9, 2); g.fill();
  g.fillStyle = pcol('g',.6);
  g.fillRect(25, 87, 3, 2.4); g.fillRect(30, 87, 3, 2.4);
  g.strokeStyle = 'rgba(230,238,244,.75)'; g.lineWidth = 1.8;
  g.beginPath(); g.arc(104, 88, 4.6, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(108, 85); g.lineTo(113, 82); g.stroke();
  g.beginPath(); g.moveTo(100, 85); g.quadraticCurveTo(96, 82, 98, 79); g.stroke();
  g.fillStyle = pcol('a',.55);
  g.beginPath(); g.moveTo(84, 88); g.lineTo(90, 88); g.lineTo(89, 95); g.lineTo(85, 95); g.fill();
  g.beginPath(); g.moveTo(74, 89); g.lineTo(80, 89); g.lineTo(79, 95); g.lineTo(75, 95); g.fill();

  /* ---- نیمکت ---- */
  g.fillStyle = '#1c2530';
  rr(g, 222, 110, 42, 6, 3); g.fill();
  g.fillRect(226, 116, 3, 9); g.fillRect(255, 116, 3, 9);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
  rr(g, 222, 110, 42, 6, 3); g.stroke();

  /* ---- قلیان ---- */
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.8;
  g.beginPath(); g.arc(286, 112, 5, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(286, 107); g.lineTo(286, 94); g.stroke();
  g.beginPath(); g.moveTo(286, 94); g.quadraticCurveTo(293, 92, 294, 98); g.stroke();
  g.beginPath(); g.moveTo(286, 112); g.quadraticCurveTo(296, 116, 300, 110); g.stroke();

  /* ---- گلدان‌ها ---- */
  plant(g, 20, 244);
  plant(g, 344, 238);
  plant(g, 96, 396);
  if(lvl('plant2') >= 1){
    plant(g, 6, 396);
    plant(g, 508, 396);
    plant(g, 618, 122);
  }
  if(lvl('poster2') >= 1){
    poster(g, 262, 88, 20, 26, hexk('a'));
    poster(g, 470, 88, 20, 26, hexk('g'));
    poster(g, 600, 88, 20, 26, hexk('p'));
  }

  /* ---- ریسه‌ی پرچمِ سالن دوم ---- */
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(396, 50); g.quadraticCurveTo(470, 58, 540, 51); g.stroke();
  g.beginPath(); g.moveTo(556, 51); g.quadraticCurveTo(596, 57, 634, 50); g.stroke();
  for(let i = 0; i < 7; i++){
    const x = 402 + i * 19, y = 51 + Math.sin((i + 0.5) / 7 * Math.PI) * 4;
    g.fillStyle = bcols[(i + 1) % 4]; g.globalAlpha = 0.5;
    g.beginPath(); g.moveTo(x - 3.6, y); g.lineTo(x + 3.6, y); g.lineTo(x, y + 7); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }

  /* ---- درِ ورودی ---- */
  g.fillStyle = '#07090c';
  rr(g, 316, 90, 36, 36, 4); g.fill();
  g.strokeStyle = pcol('p',.55); g.lineWidth = 1.6;
  rr(g, 316, 90, 36, 36, 4); g.stroke();
  g.strokeStyle = pcol('p',.25); g.lineWidth = 1;
  g.beginPath(); g.moveTo(334, 90); g.lineTo(334, 126); g.stroke();

  /* ---- تلویزیونِ دیواری ---- */
  g.fillStyle = '#0e1319';
  rr(g, 246, 56, 42, 30, 3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1.2;
  rr(g, 246, 56, 42, 30, 3); g.stroke();
  g.fillStyle = '#080b10';
  rr(g, 249, 59, 36, 24, 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)';
  g.fillRect(262, 86, 10, 2);

  /* ---- ریسه‌ی لامپ‌های سقفی ---- */
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(8, 44); g.quadraticCurveTo(90, 54, 180, 46); g.quadraticCurveTo(270, 40, 354, 47); g.stroke();
  for(let i = 0; i < 9; i++){
    const bx = 22 + i * 38, by = 46 + Math.sin(i / 9 * Math.PI) * 5;
    const bc = lvl('lamp2') >= 1 ? '#ffd9a0' : (i % 3 === 0 ? '#ffd9a0' : (i % 3 === 1 ? '#9fd8ff' : '#ff9fd0'));
    g.fillStyle = 'rgba(255,220,170,.16)';
    g.beginPath(); g.arc(bx, by + 4, 5.5, 0, TAU); g.fill();
    g.fillStyle = bc;
    g.beginPath(); g.arc(bx, by + 3, 2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.2)';
    g.beginPath(); g.moveTo(bx, by - 2); g.lineTo(bx, by + 1.6); g.stroke();
  }

  /* ---- کفِ کاشی — با مرحله‌ی پیشرفت روشن‌تر و گران‌تر ---- */
  const stg = (typeof envStage === 'function') ? envStage() : 0;
  const FL = [
    ['#10141b', '#13171f', '#12161f'],
    ['#12161e', '#161c25', '#141923'],
    ['#151a23', '#1a212b', '#171d27'],
    ['#1a202b', '#202733', '#1d242f'],
    ['#1f2632', '#262e3c', '#232a37'],
  ][stg];
  for(let j = 0; j < 14; j++){
    const y = 124 + j * 21;
    for(let i = 0; i < Math.ceil(WORLD_W / 36); i++){
      const x = i * 36;
      const r1 = sRand(i, j);
      let c = FL[2];
      if(r1 > 0.84) c = FL[1];
      else if(r1 > 0.5) c = FL[0];
      g.fillStyle = c;
      g.fillRect(x, y, 35, 20);
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1;
      g.strokeRect(x, y, 35, 20);
      if(r1 > 0.94){
        g.fillStyle = pcol('g',.04);
        g.fillRect(x + 6, y + 5, 23, 10);
      }
    }
  }
  for(const cy of [214, 334]){
    const lg = g.createLinearGradient(0, cy - 40, 0, cy + 40);
    lg.addColorStop(0, 'rgba(255,185,110,0)');
    lg.addColorStop(0.5, 'rgba(255,185,110,.05)');
    lg.addColorStop(1, 'rgba(255,185,110,0)');
    g.fillStyle = lg;
    g.fillRect(0, cy - 40, WORLD_W, 80);
  }
  g.fillStyle = 'rgba(46,38,26,.85)';
  rr(g, 312, 129, 44, 14, 3); g.fill();
  g.setLineDash([3, 2.5]);
  g.strokeStyle = 'rgba(242,193,78,.5)'; g.lineWidth = 1;
  rr(g, 314, 131, 40, 10, 2); g.stroke();
  g.setLineDash([]);
  g.font = "bold 6.5px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = 'rgba(242,193,78,.8)';
  g.fillText('خوش آمدید', 334, 138);

  const dg = g.createRadialGradient(334, 128, 4, 334, 128, 60);
  dg.addColorStop(0, pcol('p',.1));
  dg.addColorStop(1, pcol('p',0));
  g.fillStyle = dg;
  g.beginPath(); g.ellipse(334, 138, 52, 34, 0, 0, TAU); g.fill();
  // نورِ سردِ اتاق گیم
  for(const cy of [214, 334]){
    const hg = g.createLinearGradient(0, cy - 38, 0, cy + 38);
    hg.addColorStop(0, 'rgba(120,180,255,0)');
    hg.addColorStop(0.5, 'rgba(120,180,255,.055)');
    hg.addColorStop(1, 'rgba(120,180,255,0)');
    g.fillStyle = hg;
    g.fillRect(370, cy - 38, WORLD_W - 370, 76);
  }

  /* ---- تابلوی قیمت‌ها بالای کانتر ---- */
  g.fillStyle = '#141b24';
  rr(g, 14, 58, 50, 26, 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
  rr(g, 14, 58, 50, 26, 4); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)';
  g.beginPath(); g.moveTo(24, 58); g.lineTo(24, 52); g.moveTo(54, 58); g.lineTo(54, 52); g.stroke();
  g.font = "bold 6.5px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = 'rgba(242,193,78,.85)';
  g.fillText('اینترنت ' + fmtK(44000) + ' · گیم ' + fmtK(34000), 39, 68);
  g.fillStyle = 'rgba(255,255,255,.45)';
  g.fillText('چاپ ' + fmtK(27000) + ' · چای ' + fmtK(18000), 39, 78);
  /* ---- دوربینِ مداربسته ---- */
  g.fillStyle = '#232c38';
  rr(g, 138, 52, 14, 8, 2); g.fill();
  g.beginPath(); g.moveTo(152, 55); g.lineTo(160, 58); g.lineTo(152, 61); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
  g.strokeRect(138, 52, 14, 8);
  /* ---- کولرِ دیواری ---- */
  g.fillStyle = '#1d2530';
  rr(g, 630, 52, 30, 16, 3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
  rr(g, 630, 52, 30, 16, 3); g.stroke();
  for(let k = 0; k < 4; k++){ g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(633, 55 + k * 3, 24, 1.2); }
  /* ---- تابلوی خروج ---- */
  g.fillStyle = 'rgba(46,160,90,.85)';
  rr(g, 318, 79, 32, 9, 3); g.fill();
  g.font = "bold 6.5px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = '#eafff3';
  g.fillText('خروج', 334, 86);
  /* ---- سالن دوم: طاقِ ورودی + دکور ---- */
  g.fillStyle = '#161c26';
  g.fillRect(354, 48, 16, 92);
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.fillRect(354, 48, 2.5, 92);
  g.strokeStyle = pcol('c',.3); g.lineWidth = 1;
  g.beginPath(); g.moveTo(362, 48); g.quadraticCurveTo(362, 130, 362, 140); g.stroke();
  g.fillStyle = '#10141b';
  rr(g, 342, 126, 42, 17, 4); g.fill();
  g.strokeStyle = pcol('c',.5); g.lineWidth = 1;
  rr(g, 342, 126, 42, 17, 4); g.stroke();
  g.font = "bold 7.5px " + FONT_STACK; g.textAlign = 'center';
  g.fillStyle = pcol('c',.85);
  g.fillText('سالن دوم', 363, 138);
  plant(g, 384, 252);
  plant(g, 622, 396);

  /* ---- قفسه‌ی جام‌ها ---- */
  g.fillStyle = '#1a2230';
  g.fillRect(584, 156, 52, 3.5); g.fillRect(584, 186, 52, 3.5);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.fillRect(584, 156, 52, 1.2); g.fillRect(584, 186, 52, 1.2);
  g.fillStyle = '#f2c14e';
  rr(g, 590, 144, 8, 11, 2); g.fill();
  g.fillStyle = 'rgba(242,193,78,.3)';
  g.beginPath(); g.arc(594, 141, 5, 0, TAU); g.fill();
  g.fillStyle = '#c9d4e0';
  rr(g, 610, 146, 6, 8, 2); g.fill();
  g.fillStyle = '#e8907a';
  rr(g, 627, 147, 5, 7, 2); g.fill();

  /* ---- رَکِ سرورِ دیواری ---- */
  g.fillStyle = '#10161f';
  rr(g, 414, 84, 34, 32, 3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1;
  rr(g, 414, 84, 34, 32, 3); g.stroke();
  for(let r2 = 0; r2 < 3; r2++){
    g.fillStyle = '#0a0f16';
    g.fillRect(417, 88 + r2 * 9, 28, 7);
    g.fillStyle = r2 === 1 ? pcol('g',.9) : pcol('c',.8);
    g.fillRect(420, 90 + r2 * 9, 2.4, 2.4);
    g.fillStyle = pcol('p',.85);
    g.fillRect(425, 90 + r2 * 9, 2.4, 2.4);
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(430, 90 + r2 * 9, 10, 1.2);
  }

  /* ---- پوسترهای پیکسلیِ گیم ---- */
  g.fillStyle = 'rgba(255,255,255,.06)';
  g.fillRect(386, 54, 22, 26);
  g.strokeStyle = pcol('c',.4); g.lineWidth = 1;
  g.strokeRect(386, 54, 22, 26);
  g.fillStyle = pcol('g',.85);
  const px1 = [1,0,1, 1,1,1, 1,0,1, 0,1,0];
  for(let k = 0; k < 12; k++) if(px1[k]) g.fillRect(392 + (k % 3) * 3.4, 60 + Math.floor(k / 3) * 3.4, 2.6, 2.6);
  g.fillStyle = 'rgba(255,255,255,.35)';
  g.fillRect(391, 75, 12, 1.2);

  g.fillStyle = 'rgba(255,255,255,.06)';
  g.fillRect(560, 54, 22, 26);
  g.strokeStyle = pcol('p',.4); g.lineWidth = 1;
  g.strokeRect(560, 54, 22, 26);
  g.fillStyle = pcol('p',.85);
  const px2 = [0,1,0, 1,1,1, 1,0,1, 1,0,1];
  for(let k = 0; k < 12; k++) if(px2[k]) g.fillRect(566 + (k % 3) * 3.4, 60 + Math.floor(k / 3) * 3.4, 2.6, 2.6);
  g.fillStyle = 'rgba(255,255,255,.35)';
  g.fillRect(565, 75, 12, 1.2);

  /* ---- پاف‌های نشستن ---- */
  g.fillStyle = 'rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(600, 348, 26, 7, 0, 0, TAU); g.fill();
  g.fillStyle = '#2b3550';
  rr(g, 578, 322, 44, 26, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1;
  rr(g, 578, 322, 44, 26, 12); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(560, 372, 22, 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#3d2b4a';
  rr(g, 542, 350, 38, 22, 10); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
  rr(g, 542, 350, 38, 22, 10); g.stroke();

  /* ---- سالن VIP: طاقِ طلایی + فرش ---- */
  if(lvl('vipHall') >= 1){
    g.fillStyle = '#191d2b';
    g.fillRect(652, 48, 16, 92);
    g.fillStyle = 'rgba(255,215,95,.14)';
    g.fillRect(652, 48, 2.5, 92);
    g.strokeStyle = 'rgba(255,215,95,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(660, 48); g.quadraticCurveTo(660, 130, 660, 140); g.stroke();
    g.fillStyle = '#12151f';
    rr(g, 640, 126, 44, 17, 4); g.fill();
    g.strokeStyle = 'rgba(255,215,95,.55)'; g.lineWidth = 1;
    rr(g, 640, 126, 44, 17, 4); g.stroke();
    g.font = "bold 7.5px " + FONT_STACK; g.textAlign = 'center';
    g.fillStyle = '#ffd75f';
    g.fillText('سالن VIP', 662, 138);
    g.fillStyle = 'rgba(255,215,95,.05)';
    rr(g, 668, 148, 148, 220, 10); g.fill();
    g.strokeStyle = 'rgba(255,215,95,.16)'; g.lineWidth = 1.4;
    rr(g, 668, 148, 148, 220, 10); g.stroke();
    plant(g, 682, 130);
    plant(g, 806, 130);
    putGlowDyn = null;
  }
  /* ---- راه‌راهِ RGBِ کف — مرحله‌ی گیمینگ ---- */
  if(stg >= 2){
    for(const ry of [126, 468]){
      g.fillStyle = 'rgba(120,120,255,.05)';
      g.fillRect(0, ry, WORLD_W, 2);
    }
  }
  /* ---- ماشینِ فروشِ خودکار ---- */
  g.fillStyle = 'rgba(16,20,26,.95)';
  rr(g, 584, 214, 50, 62, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1;
  rr(g, 584, 214, 50, 62, 7); g.stroke();
  g.fillStyle = 'rgba(140,220,255,.1)';
  rr(g, 589, 219, 40, 34, 4); g.fill();
  for(let i = 0; i < 3; i++){
    g.fillStyle = canCols[i]; g.globalAlpha = 0.8;
    g.fillRect(592 + i * 13, 226, 6, 13);
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(255,255,255,.1)';
  g.fillRect(589, 260, 40, 3);
  g.fillStyle = pcol('g',.5);
  g.fillRect(614, 266, 10, 5);
}
function plant(g, x, y){
  g.fillStyle = '#3a2f26';
  g.beginPath();
  g.moveTo(x - 7, y - 10); g.lineTo(x + 7, y - 10); g.lineTo(x + 5, y); g.lineTo(x - 5, y);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 7, y - 10); g.lineTo(x + 7, y - 10); g.stroke();
  for(let k = -1; k <= 1; k++){
    g.strokeStyle = k === 0 ? 'rgba(96,190,140,.9)' : 'rgba(70,150,110,.8)';
    g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - 10);
    g.quadraticCurveTo(x + k * 6, y - 16, x + k * 8, y - 22 - (k === 0 ? 4 : 0));
    g.stroke();
  }
}
function poster(g, x, y, w, h, color){
  g.fillStyle = 'rgba(255,255,255,.05)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1;
  g.strokeRect(x, y, w, h);
  g.strokeStyle = color; g.globalAlpha = 0.45; g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(x + 4, y + h - 7); g.lineTo(x + w/2, y + 6); g.lineTo(x + w - 4, y + h - 11); g.stroke();
  g.beginPath(); g.arc(x + w/2, y + h/2, 2.4, 0, TAU); g.stroke();
  g.globalAlpha = 1;
}
function buildVignette(){
  vignCanvas = document.createElement('canvas');
  vignCanvas.width = cv.width; vignCanvas.height = cv.height;
  const g = vignCanvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(ox, oy); g.scale(scale, scale);
  const cx = 180, cy = 250;
  const gr = g.createRadialGradient(cx, cy, 130, cx, cy, 430);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,.4)');
  g.fillStyle = gr;
  g.fillRect(-2, -2, VW + 4, VH + 4);
  const btm = g.createLinearGradient(0, 380, 0, 640);
  btm.addColorStop(0, 'rgba(0,0,0,0)');
  btm.addColorStop(1, 'rgba(0,0,0,.22)');
  g.fillStyle = btm;
  g.fillRect(-2, 380, VW + 4, 260);
}

/* ================= دیوارِ پویا ================= */
function drawNeonSign(){
  const flick = Math.random() < 0.028 ? rnd(0.35, 0.65) : 1;
  putGlow(180, 67, 44, hexk('g'), 0.4 * flick);
  faText('کافه‌نت', 180, 67, 15, hexk('g'), 'center', true);
  ctx.globalAlpha = flick;
  ctx.fillStyle = hexk('p');
  ctx.beginPath(); ctx.arc(224, 67, 2.6, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  putGlow(224, 67, 12, hexk('p'), 0.55 * flick);
}
function drawTV(){
  const bx = 249, by = 59;
  const bars = ['#ff5fa2', '#f2c14e', '#4cff9e', '#59c2ff'];
  ctx.save();
  ctx.beginPath(); ctx.rect(bx, by, 36, 24); ctx.clip();
  const shift = Math.floor(G.t * 6) % 4;
  for(let i2 = 0; i2 < 4; i2++){
    ctx.fillStyle = bars[(i2 + shift) % 4];
    ctx.globalAlpha = 0.25;
    ctx.fillRect(bx + i2 * 9, by, 9, 24);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + Math.random() * 0.05).toFixed(2) + ')';
  ctx.fillRect(bx, by + ((G.t * 22) % 24), 36, 1.6);
  ctx.restore();
}
function drawRack(){
  const blink = Math.sin(G.t * 5) > 0;
  ctx.fillStyle = blink ? pcol('g',.95) : pcol('g',.25);
  ctx.fillRect(446, 92, 2.4, 2.4);
  ctx.fillStyle = !blink ? pcol('p',.95) : pcol('p',.25);
  ctx.fillRect(446, 101, 2.4, 2.4);
}
function drawTabs(){
  if(lvl('hall') < 1 && lvl('vipHall') < 1) return;
  const y = 446, h = 24;
  const defs = [
    { id:'tabA', x: 16,  w: 74, t: '🖥 سالن ۱', on: G.cam.target < 140 },
    { id:'tabB', x: 94,  w: 74, t: '🏛 سالن ۲', on: G.cam.target >= 140 && G.cam.target < WORLD_W - VW - 60, need: lvl('hall') >= 1, tgt: 280 },
    { id:'tabC', x: 172, w: 74, t: '💎 VIP',   on: G.cam.target >= WORLD_W - VW - 60, need: lvl('vipHall') >= 1, tgt: WORLD_W - VW },
  ].filter(d => d.need !== false);
  for(const d of defs){
    ctx.fillStyle = d.on ? 'rgba(120,180,255,.14)' : 'rgba(255,255,255,.04)';
    rr(d.x, y, d.w, h, 12); ctx.fill();
    ctx.strokeStyle = d.on ? pcol('c',.7) : 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    rr(d.x, y, d.w, h, 12); ctx.stroke();
    faText(d.t, d.x + d.w / 2, y + 8, 9, d.on ? '#cfe4ff' : '#7d8894', 'center', true);
    HIT.list.push({ x: d.x, y, w: d.w, h, id: d.id });
  }
}
function tabTarget(id){
  if(id === 'tabA') return 0;
  if(id === 'tabB') return 280;
  return WORLD_W - VW;
}
function drawClockHands(){
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  const frac = clamp(G.t / DAY_LEN, 0, 1);
  const ma = frac * TAU;                 // عقربه‌ی دقیقه — یک دور در روز
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ma) * 5.4, 64 - Math.cos(ma) * 5.4); ctx.stroke();
  const ha = (10 + frac * 10) / 12 * TAU; // ۱۰ صبح تا ۸ شب
  ctx.beginPath(); ctx.moveTo(232, 64); ctx.lineTo(232 + Math.sin(ha) * 3.4, 64 - Math.cos(ha) * 3.4); ctx.stroke();
}
const LAMP_XS = [106, 168, 230];
function refreshDecor(){ if(typeof buildBG === 'function') buildBG(); }
function drawLamps(){
  for(const lx of LAMP_XS){
    for(const sy of [126, 246]){
      const dx = Math.sin(G.t * 0.8 + lx + sy) * 1.4;
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, 48); ctx.quadraticCurveTo(lx + dx * 0.5, (48 + sy) / 2, lx + dx, sy - 1); ctx.stroke();
      ctx.fillStyle = '#1e2833';
      ctx.beginPath();
      ctx.moveTo(lx + dx - 13, sy); ctx.lineTo(lx + dx + 13, sy);
      ctx.lineTo(lx + dx + 9, sy + 9); ctx.lineTo(lx + dx - 9, sy + 9);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
      ctx.stroke();
      putGlow(lx + dx, sy + 12, 34, 'rgba(255,185,110,.9)', 0.4);
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(lx + dx, sy + 9, 2.2, 0, TAU); ctx.fill();
    }
  }
}

/* ================= میزها ================= */
function eff2(s){
  return s.alloc > 0 || s.kind === 'chat';
}
function drawDesk(i){
  const s = G.systems[i];
  const p = deskPos(i);
  const x = p.x, y = p.y;
  const isVip = i >= 16;
  /* میزِ فروخته‌شده — جایِ خالیِ مشخص */
  if(!deskOn(i) && i < unlockedRange()){
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(242,193,78,.4)'; ctx.lineWidth = 1;
    rr(x - 24, y - 30, 48, 46, 5); ctx.stroke();
    ctx.setLineDash([]);
    faText('فروخته‌شده', x, y - 8, 7, 'rgba(242,193,78,.5)', 'center');
    faText('از داشبورد بازخرید کن', x, y + 6, 6.5, 'rgba(255,255,255,.25)', 'center');
    ctx.globalAlpha = 1;
    return;
  }
  if(s.kind && !s.virus){
    const hue = Math.floor((G.t * 36 + i * 47) % 360);
    ctx.strokeStyle = 'hsla(' + hue + ',95%,62%,.4)';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x - 26, y + 48); ctx.lineTo(x + 26, y + 48); ctx.stroke();
    putGlow(x, y + 44, 22, 'hsla(' + hue + ',95%,60%,1)', 0.1);
  }
  const locked = i >= unlockedRange();
  if(locked){
    ctx.globalAlpha = 0.32;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = isVip ? 'rgba(255,215,95,.4)' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
    rr(x - 24, y - 30, 48, 46, 5); ctx.stroke();
    ctx.setLineDash([]);
    drawIcon('lock', x, y - 8, 5, isVip ? 'rgba(255,215,95,.5)' : 'rgba(255,255,255,.45)');
    faText(isVip ? 'سالن VIP' : 'ارتقا', x, y + 6, 7.5, isVip ? 'rgba(255,215,95,.4)' : 'rgba(255,255,255,.35)', 'center');
    ctx.globalAlpha = 1;
    return;
  }
  const ptier = lvl('pcTier');
  const occupied = !!s.kind;
  if(occupied && s.person && s.person.state === 'sit'){
    const c = s.person;
    ctx.fillStyle = '#0d1219';
    rr(x - 11, y - 46, 22, 18, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    rr(x - 11, y - 46, 22, 18, 5); ctx.stroke();
    const frac0 = clamp(c.patience / c.patMax, 0, 1);
    const angry = frac0 < 0.25;
    drawFigure(x, y - 10, {
      shirt: c.shirt, hair: c.hair, H: 26, seated: true, drop: c.sitT,
      typing: s.kind !== 'print' && !s.virus && s.rebootT <= 0 && eff2(s),
      ph: i * 1.7,
      shakeX: angry && s.kind !== 'print' ? Math.sin(G.t * 30) * 1.4 : 0,
    });
    const frac = frac0;
    drawRing(x, y - 38, 14, frac, null, 3);
    if(c.regular) faText('♥', x - 17, y - 52, 7, pcol('p',.9), 'center', true);
    if(KINDS[s.kind] && KINDS[s.kind].payMulC >= 1.8) faText('💰', x - 17, y - 60, 7.5, hexk('a'), 'center');
    if(c.vip){
      ctx.strokeStyle = pcol('a',.85);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(x, y - 38, 18, G.t * 2 % TAU, G.t * 2 % TAU + TAU * 0.8); ctx.stroke();
      ctx.setLineDash([]);
      faText('👑', x + 17, y - 52, 8, hexk('a'), 'center');
    }
    if(frac < 0.45 && G.teaCd <= 0 && !s.virus && s.rebootT <= 0 && Math.sin(G.t * 5) > 0){
      faText('☕', x + 22, y - 46, 10, hexk('a'), 'center');
    }
    if(c.bubble) drawBubble(x, y - 48, c.bubble.text);
  } else {
    ctx.fillStyle = '#0d1219';
    rr(x - 11, y - 46, 22, 18, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    rr(x - 11, y - 46, 22, 18, 5); ctx.stroke();
  }

  const K = occupied ? KINDS[s.kind] : null;
  const color = K ? rgb(K.color) : '#39424d';
  if(isVip){
    ctx.fillStyle = 'rgba(255,215,95,.06)';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 40, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,95,.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 18, 40, 12, 0, 0, TAU); ctx.stroke();
  }
  if(ptier >= 2 && !occupied){
    const cc = isVip ? '#c9a24a' : (i % 2 ? '#c0304a' : '#2a5ac0');
    ctx.fillStyle = cc;
    rr(x - 12, y - 44, 24, 40, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    rr(x - 9, y - 42, 18, 10, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
    rr(x - 12, y - 44, 24, 40, 8); ctx.stroke();
  }
  if(ptier >= 1){
    const hue = Math.floor((G.t * 40 + i * 80) % 360);
    ctx.strokeStyle = 'hsla(' + hue + ',90%,60%,.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 24, y + 12.5); ctx.lineTo(x + 24, y + 12.5); ctx.stroke();
  }
  /* پایه‌ی میز */
  ctx.fillStyle = '#1a2330';
  rr(x - 25, y + 13, 50, 12, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
  rr(x - 25, y + 13, 50, 12, 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  for(const vx of [x - 8, x + 8]){ ctx.beginPath(); ctx.moveTo(vx, y + 16); ctx.lineTo(vx, y + 22); ctx.stroke(); }
  /* رویه‌ی میز */
  ctx.fillStyle = '#283445';
  rr(x - 27, y + 2, 54, 11, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.09)';
  ctx.fillRect(x - 27, y + 2, 54, 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1;
  rr(x - 27, y + 2, 54, 11, 2); ctx.stroke();
  /* کیبورد و موس */
  ctx.fillStyle = '#2a3542';
  rr(x - 14, y + 4, 24, 6, 1.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  for(let kx = x - 12; kx < x + 8; kx += 3.4) ctx.fillRect(kx, y + 5.6, 2, 1.6);
  ctx.fillStyle = '#2a3542';
  ctx.beginPath(); ctx.arc(x + 15, y + 7.5, 2.4, 0, TAU); ctx.fill();
  /* کیسِ CPU */
  ctx.fillStyle = '#10151c';
  rr(x + 18, y + 15, 9, 17, 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
  rr(x + 18, y + 15, 9, 17, 1.5); ctx.stroke();
  if(occupied){
    ctx.fillStyle = s.virus ? '#ff4d5e' : (Math.sin(G.t * 4 + i) > 0 ? hexk('g') : pcol('g',.3));
    ctx.fillRect(x + 21, y + 19, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(x + 20, y + 26, 5, 1.4);
  }
  if(!occupied){
    ctx.fillStyle = '#212b3a';
    rr(x - 21, y - 28, 42, 28, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1;
    rr(x - 21, y - 28, 42, 28, 3); ctx.stroke();
    ctx.fillStyle = '#0a0f16';
    rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
    faText('آزاد', x, y - 14, 7.5, 'rgba(255,255,255,.14)', 'center');
    ctx.fillStyle = '#131a23';
    rr(x - 5, y, 10, 3, 1); ctx.fill();
    return;
  }
  putGlow(x, y - 14, 24 + (ptier >= 3 ? 6 : 0), color, 0.14 + (s.vipDesk ? 0.06 : 0));
  ctx.fillStyle = s.vipDesk ? '#2d2a1e' : '#212b3a';
  rr(x - 21, y - 28, 42, 28, 3); ctx.fill();
  ctx.strokeStyle = s.virus ? 'rgba(255,77,94,.8)' : (s.vipDesk ? 'rgba(255,215,95,.5)' : 'rgba(255,255,255,.16)');
  ctx.lineWidth = s.vipDesk ? 1.6 : 1.2;
  rr(x - 21, y - 28, 42, 28, 3); ctx.stroke();
  if(s.vipDesk) faText('VIP', x + 15, y - 25, 5.5, 'rgba(255,215,95,.7)', 'center', true);
  ctx.fillStyle = '#0d1420';
  rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
  /* روشن‌شدنِ نرمِ مانیتور هنگامِ نشستن */
  if(s.bootT > 0){
    ctx.fillStyle = 'rgba(5,9,14,' + clamp(s.bootT / 0.45, 0, 0.9).toFixed(2) + ')';
    rr(x - 18, y - 25, 36, 22, 2); ctx.fill();
    if(Math.sin(G.t * 30) > 0){ ctx.fillStyle = hexk('c'); ctx.fillRect(x + 14, y - 23, 2, 2); }
  }
  ctx.fillStyle = '#131a23';
  rr(x - 5, y, 10, 3, 1); ctx.fill();
  /* بازوها روی لبه‌ی مانیتور — حسِ تایپِ واقعی */
  if(s.person && s.person.state === 'sit' && s.kind !== 'print' && !s.virus && s.rebootT <= 0){
    const j1 = Math.sin(G.t * 13 + i * 1.7) * 1.1, j2 = Math.sin(G.t * 13 + i * 1.7 + 2.1) * 1.1;
    ctx.strokeStyle = s.person.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 4.6, y - 16); ctx.lineTo(x - 7, y - 9 + j1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 4.6, y - 16); ctx.lineTo(x + 7.2, y - 9 + j2); ctx.stroke();
  }
  /* نوارِ سلامتِ تجهیزات */
  const hpv = sysHp(i);
  if(hpv < 100){
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    rr(x - 15, y - 31, 30, 2.4, 1.2); ctx.fill();
    ctx.fillStyle = ringColor(hpv / 100);
    rr(x - 15, y - 31, Math.max(1.5, 30 * hpv / 100), 2.4, 1.2); ctx.fill();
    if(hpv < 40 && Math.sin(G.t * 4) > 0.3) faText('🔧', x + 21, y - 30, 7.5, hexk('a'), 'center');
  }

  if(s.virus){
    for(let n = 0; n < 9; n++){
      ctx.fillStyle = 'rgba(255,255,255,' + rnd(0.03, 0.13).toFixed(2) + ')';
      ctx.fillRect(x - 17 + rnd(0, 26), y - 24 + rnd(0, 18), rnd(3, 10), 1.6);
    }
    drawRing(x, y - 14, 12, (Math.sin(G.t * 9) + 1) / 2, '#ff4d5e', 2.6);
    faText('⚠', x, y - 14, 11, '#ff4d5e', 'center', true);
    faText('لمس کن', x, y + 20, 8, '#ff4d5e', 'center');
    drawSlider(i, p, s);
    return;
  }
  if(s.rebootT > 0){
    drawRing(x, y - 14, 12, 1 - s.rebootT / rebootDur(), hexk('c'), 2.6);
    faText('ری‌استارت…', x, y + 20, 8, hexk('c'), 'center');
    drawSlider(i, p, s);
    return;
  }
  const starving = s.kind !== 'print' && s.alloc < s.need;
  const allocCol = starving ? '#ff4d5e' : '#e9eef2';
  const vis = KINDS[s.kind] ? (KINDS[s.kind].vis || s.kind) : s.kind;
  if(vis === 'dl'){
    for(let j = 0; j < 4; j++){
      ctx.fillStyle = s.progress * 4 > j + 0.4 ? pcol('g',.85) : pcol('g',.15);
      rr(x - 15 + j * 8, y - 8, 6.5, 7, 1); ctx.fill();
    }
  } else if(vis === 'game'){
    ctx.fillStyle = pcol('p',.85);
    rr(x - 15, y - 10, 30 * clamp(1 - s.progress, 0, 1), 3, 1.5); ctx.fill();
    ctx.fillStyle = pcol('c',.8);
    rr(x - 15, y - 4, 30 * clamp(s.progress, 0, 1), 2.5, 1.25); ctx.fill();
    if(Math.sin(G.t * 6 + i) > 0){
      ctx.fillStyle = hexk('p');
      ctx.beginPath(); ctx.arc(x + 10, y - 7, 1.6, 0, TAU); ctx.fill();
    }
  } else if(vis === 'chat'){
    const ws = [24, 15, 20];
    for(let k = 0; k < 3; k++){
      ctx.fillStyle = 'rgba(89,194,255,' + (0.3 + k * 0.12).toFixed(2) + ')';
      rr(x - 15, y - 11 + k * 5, ws[k], 2.2, 1); ctx.fill();
    }
  } else {
    ctx.strokeStyle = pcol('a',.8); ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 8, y - 11, 16, 13);
    ctx.fillStyle = pcol('a',.5);
    for(let k = 0; k < 3; k++) ctx.fillRect(x - 5, y - 8 + k * 3.4, 10 - k * 2, 1.4);
  }
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for(let yy = y - 23; yy < y - 4; yy += 4) ctx.fillRect(x - 17, yy, 34, 1.3);
  if(s.kind === 'print'){
    faText('چاپ ' + faNum(Math.round(s.progress * 100)) + '٪', x, y - 18, 9, hexk('a'), 'center', true);
  } else {
    faText(faNum(s.alloc) + '/' + faNum(s.need), x, y - 18, 11, allocCol, 'center', true);
    if(starving && Math.sin(G.t * 7) > 0.2) putGlow(x, y - 18, 12, '#ff4d5e', 0.35);
  }
  drawSlider(i, p, s);
}
function drawSlider(i, p, s){
  const disabled = !s || !s.kind || s.kind === 'print';
  const K = s && s.kind ? KINDS[s.kind] : null;
  const color = K ? rgb(K.color) : '#39424d';
  const tx = p.x - 26, ty = p.y + 34, tw = 52;
  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + tw, ty); ctx.stroke();
  if(disabled){
    if(s && s.kind === 'print') faText('پهنای باند نمی‌خواهد', p.x, ty, 7.5, 'rgba(255,255,255,.3)', 'center');
    return;
  }
  const f = clamp(s.alloc / 100, 0, 1);
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + tw * f, ty); ctx.stroke();
  const nx = tx + tw * clamp(s.need / 100, 0, 1);
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(nx, ty - 5); ctx.lineTo(nx, ty + 5); ctx.stroke();
  const hx = tx + tw * f;
  const hot = G.drag && G.drag.si === i;
  putGlow(hx, ty, 13, color, hot ? 0.5 : 0.22);
  ctx.fillStyle = hot ? '#ffffff' : color;
  rr(hx - 7, ty - 7, 14, 14, 4.5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1;
  rr(hx - 7, ty - 7, 14, 14, 4.5); ctx.stroke();
}

/* ================= آدم‌ها ================= */
function drawFigure(cx, baseY, o){
  const H = o.H || 22;
  let hipY = baseY - H * 0.42;
  if(o.drop > 0) hipY -= Math.sin(clamp(o.drop / 0.45, 0, 1) * Math.PI) * 5;
  const headR = H * 0.3;
  let headY = hipY - H * 0.62;
  if(o.typing){ // تعادلِ طبیعیِ سر و بدن هنگامِ کار
    cx += Math.sin(G.t * 1.7 + (o.ph || 0)) * 0.5;
    headY += Math.sin(G.t * 2.6 + (o.ph || 0)) * 0.5;
  }
  if(o.shakeX) cx += o.shakeX;
  if(o.walking){
    const sw = Math.sin((o.walkPh || 0) * 2) * H * 0.16;
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 2.5, hipY); ctx.lineTo(cx - 2.5 + sw, baseY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 2.5, hipY); ctx.lineTo(cx + 2.5 - sw, baseY); ctx.stroke();
  }
  ctx.fillStyle = o.shirt;
  rr(cx - 5.8, hipY - H * 0.62, 11.6, H * 0.64, 4.5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
  rr(cx - 5.8, hipY - H * 0.62, 11.6, H * 0.64, 4.5); ctx.stroke();
  if(o.apron){
    ctx.fillStyle = 'rgba(10,14,18,.55)';
    rr(cx - 4, hipY - H * 0.4, 8, H * 0.42, 2); ctx.fill();
  }
  if(o.typing && o.arms !== false){
    const jit = Math.sin(G.t * 13 + (o.ph || 0)) * 1.1;
    const jit2 = Math.sin(G.t * 13 + (o.ph || 0) + 2.1) * 1.1;
    ctx.strokeStyle = o.shirt; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4.6, hipY - H * 0.18); ctx.lineTo(cx - 6.6, hipY + H * 0.2 + jit); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4.6, hipY - H * 0.18); ctx.lineTo(cx + 6.8, hipY + H * 0.2 + jit2); ctx.stroke();
  }
  ctx.fillStyle = '#e2c9a8';
  ctx.beginPath(); ctx.arc(cx, headY, headR, 0, TAU); ctx.fill();
  ctx.fillStyle = o.hair || '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx, headY - 0.8, headR + 0.4, Math.PI * 0.92, Math.PI * 2.08);
  ctx.fill();
  ctx.fillRect(cx - headR - 0.4, headY - 2, headR * 2 + 0.8, 2);
}
function drawPerson(c){
  if(c.type === 'clean' || c.type === 'tech'){
    drawFigure(c.x, c.y + 9, {
      shirt: c.type === 'clean' ? '#4a6b55' : '#3e556b', hair: c.hair, H: 22,
      walking: true, walkPh: c.bob,
    });
    faText(c.type === 'clean' ? '🧹' : '🔧', c.x + (c.dir > 0 ? 9 : -9), c.y - 6, 8, '#dfe6ec', 'center');
    if(c.bub) drawBubble(c.x, c.y - 12, c.bub.text);
    return;
  }
  if(c.type === 'cust'){
    if(c.state === 'sit') return; // داخلِ drawDesk کشیده می‌شود
    const K = KINDS[c.kind];
    const color = K ? rgb(K.color) : '#8a94a0';
    drawFigure(c.x, c.y + 9, {
      shirt: c.shirt || color, hair: c.hair, H: 23,
      walking: true, walkPh: c.bob,
    });
    if(c.state === 'angry'){
      ctx.globalAlpha = 0.7;
      drawIcon('game', c.x, c.y - 20, 5, '#ff4d5e');
      ctx.globalAlpha = 1;
    }
  } else {
    const baseY = c.y + 10;
    if(c.type === 'bar'){
      drawFigure(c.x, baseY, { shirt: hexk('c'), hair: c.hair, H: 21, seated: true, apron: true });
    } else {
      drawFigure(c.x, baseY, { shirt: c.shirt, hair: c.hair, H: 20, seated: true });
    }
  }
  if(c.bubble) drawBubble(c.x, (c.type === 'bar' ? c.y - 8 : c.y - 4), c.bubble.text);
}
function drawBubble(x, y, text){
  ctx.font = '8.5px ' + FONT_STACK;
  const w = Math.min(120, ctx.measureText(text).width + 14);
  const bx = clamp(x - w / 2, 6, VW - w - 6);
  const by = y - 14;
  ctx.fillStyle = 'rgba(16,19,25,.95)';
  rr(bx, by, w, 16, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1;
  rr(bx, by, w, 16, 7); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 3, by + 15); ctx.lineTo(x, by + 20); ctx.lineTo(x + 3, by + 15);
  ctx.fillStyle = 'rgba(16,19,25,.95)'; ctx.fill();
  faText(text, bx + w / 2, by + 8, 8.5, '#dfe6ec', 'center');
}
function drawQueuePeople(){
  G.queue.forEach((c, idx) => {
    const spot = QUEUE_SPOTS[Math.min(idx, 2)];
    c.x = lerp(c.x, spot.x, 0.15); c.y = lerp(c.y, spot.y, 0.15);
    drawFigure(c.x, c.y + 9, { shirt: c.shirt, hair: c.hair, H: 22, walking: false });
    const frac = clamp(c.patience / c.patMax, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    ctx.fillRect(c.x - 9, c.y + 14, 18, 2.5);
    ctx.fillStyle = ringColor(frac);
    ctx.fillRect(c.x - 9, c.y + 14, 18 * frac, 2.5);
    const KQ = KINDS[c.kind];
    drawIcon(KQ.icon || c.kind, c.x - 14, c.y - 16, 4.5, rgb(KQ.color));
  });
}
function drawPrintStation(){
  const x = 294, y = 348, w = 54, h = 50;
  const job = G.printerJob >= 0 ? G.systems[G.printerJob] : null;
  const busy = job && job.kind === 'print';
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  rr(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = busy ? pcol('a',.6) : 'rgba(255,255,255,.1)';
  ctx.lineWidth = 1.2;
  rr(x, y, w, h, 10); ctx.stroke();
  drawIcon('print', x + w/2, y + 14, 8, busy ? hexk('a') : '#39424d');
  ctx.fillStyle = 'rgba(223,230,236,.85)';
  const ph = busy ? 4 + 10 * job.progress : 2;
  rr(x + 14, y + 24 - ph, 26, ph, 1); ctx.fill();
  if(busy){
    ctx.fillStyle = 'rgba(120,130,140,.5)';
    ctx.fillRect(x + 17, y + 24 - ph + 2, 20, 1); ctx.fillRect(x + 17, y + 24 - ph + 5, 14, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  rr(x + 8, y + 34, w - 16, 3.5, 1.75); ctx.fill();
  if(busy){
    ctx.fillStyle = hexk('a');
    rr(x + 8, y + 34, (w - 16) * job.progress, 3.5, 1.75); ctx.fill();
  }
  faText('چاپگر', x + w/2, y + h - 7, 8, busy ? hexk('a') : '#525c66', 'center');
}

/* ================= نوار پایین ================= */
function drawPipe(){
  const px = 16, py = 424, pw = 328, ph = 16;
  faText('پهنای باند', px + 2, py - 8, 9.5, '#7d8894', 'right');
  faText('بودجه ' + faNum(G.budget) + ' · مانده ' + faNum(Math.max(0, G.budget - sumAlloc())), px + pw - 2, py - 8, 9.5, G.budget < budget() ? '#ff4d5e' : '#7d8894', 'left');
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(px, py, pw, ph, ph/2); ctx.fill();
  const sw = pw * (G.budget / budget());
  ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1;
  rr(px, py, pw, ph, ph/2); ctx.stroke();
  if(G.budget < budget()){
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255,77,94,.4)';
    rr(px + sw, py, pw - sw, ph, ph/2); ctx.stroke();
    ctx.setLineDash([]);
  }
  let x = px;
  for(let i = 0; i < G.slots; i++){
    const s = G.systems[i];
    const w = pw * (s.disp / budget());
    if(w > 1){
      const color = s.kind ? rgb(KINDS[s.kind].color) : '#5a6470';
      ctx.fillStyle = color;
      rr(x, py, Math.max(2, w - 1.5), ph, ph/2); ctx.fill();
      x += w;
    }
  }
}
function drawChips(){
  const y = 456;
  if(G.queue.length){
    faText('در صف: ' + faNum(G.queue.length), 16, y, 10.5, hexk('a'), 'right', true);
  }
  if(G.combo > 0){
    faText('×' + faF1(1 + 0.15 * G.combo), 344, y, 12, hexk('p'), 'left', true);
    putGlow(330, y, 16, hexk('p'), 0.2);
  }
  if(G.activeEvent){
    const names = { outage:'⚡ قطعی شبکه', virus:'⚠ ویروس', rush:'🌀 شلوغی', sponsor:'🟢 اسپانسر ×۱٫۵',
      fest:'🎪 جشنواره', tour:'🎮 مسابقات', celeb:'🌟 مشهور', breakdown:'🔧 خرابی', netfault:'🌐 اختلالِ شبکه' };
    const colors = { outage:hexk('p'), virus:'#ff4d5e', rush:hexk('a'), sponsor:hexk('g'),
      fest:hexk('a'), tour:hexk('p'), celeb:hexk('a'), breakdown:'#ff4d5e', netfault:'#ff9d5c' };
    const t = names[G.activeEvent] + ' — ' + faNum(Math.ceil(G.evT));
    ctx.font = 'bold 10.5px ' + FONT_STACK;
    const w = ctx.measureText(t).width + 24;
    const x = 180 - w/2;
    ctx.fillStyle = 'rgba(10,12,15,.92)';
    rr(x, y - 11, w, 22, 11); ctx.fill();
    ctx.strokeStyle = colors[G.activeEvent];
    rr(x, y - 11, w, 22, 11); ctx.stroke();
    faText(t, 180, y, 10.5, colors[G.activeEvent], 'center', true);
  }
}
function drawMissionTicker(){
  const y = 476, h = 30, x = 16, w = 328;
  const m = MISSION_BY_ID[Save.d.missions[0]];
  if(!m) return;
  const v = missionValue(m), f = clamp(v / m.goal, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.025)';
  rr(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(242,193,78,' + (0.45 + Math.sin(G.t * 3) * 0.1).toFixed(2) + ')';
  rr(x, y, w, h, 14); ctx.stroke();
  faText(m.icon + ' ' + m.t, x + w - 12, y + 10, 10.5, '#e9eef2', 'right');
  faText(faNum(Math.min(v, m.goal)) + '/' + faNum(m.goal) + ' · پاداش ' + fmtK(m.r), x + 12, y + 10, 9, hexk('a'), 'left');
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  rr(x + 12, y + h - 9, w - 24, 3.5, 1.75); ctx.fill();
  ctx.fillStyle = hexk('a');
  rr(x + 12, y + h - 9, (w - 24) * f, 3.5, 1.75); ctx.fill();
}
const HIT = { list: [] };
function drawButtons(){
  const y = 512, h = 44;
  HIT.list = [];
  const b1 = { x: 16, y, w: 77, h, id: 'shop' };
  btnBox(b1, '🛠', 'ارتقا', hexk('g'));
  HIT.list.push(b1);
  const b2 = { x: 100, y, w: 77, h, id: 'quests' };
  btnBox(b2, '✦', 'ماموریت', hexk('a'));
  HIT.list.push(b2);
  const b3 = { x: 184, y, w: 77, h, id: 'dash' };
  btnBox(b3, '📊', 'داشبورد', hexk('c'));
  HIT.list.push(b3);
  const ready = G.teaCd <= 0;
  const f = ready ? 1 : 1 - G.teaCd / teaCdMax();
  const b4 = { x: 268, y, w: 76, h, id: 'tea' };
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.fill();
  ctx.strokeStyle = ready ? pcol('a',.7) : 'rgba(255,255,255,.12)';
  rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.stroke();
  if(!ready){
    ctx.fillStyle = pcol('a',.12);
    rr(b4.x, b4.y, b4.w, b4.h, 12); ctx.fill();
  }
  faText('☕', b4.x + b4.w/2, b4.y + 12, 13, ready ? hexk('a') : '#525c66', 'center', true);
  faText(ready ? 'چای آماده' : 'دم‌کشیدن…', b4.x + b4.w/2, b4.y + 30, 8.5, ready ? hexk('a') : '#7d8894', 'center');
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  rr(b4.x + 8, b4.y + b4.h - 6, b4.w - 16, 2.5, 1); ctx.fill();
  ctx.fillStyle = ready ? hexk('a') : pcol('a',.35);
  rr(b4.x + b4.w - 8 - (b4.w - 16) * f, b4.y + b4.h - 6, (b4.w - 16) * f, 2.5, 1); ctx.fill();
  tapGlow(b4, hexk('a'));
  HIT.list.push(b4);
}
function tapGlow(b, color){
  if(!G.tapFx || G.tapFx.id !== b.id) return;
  const a = clamp(G.tapFx.t / 0.28, 0, 1);
  putGlow(b.x + b.w/2, b.y + b.h/2, 36, color, 0.4 * a);
  ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * a).toFixed(2) + ')';
  ctx.lineWidth = 1.5;
  rr(b.x, b.y, b.w, b.h, 12); ctx.stroke();
}
function btnBox(b, icon, label, color){
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  rr(b.x, b.y, b.w, b.h, 12); ctx.stroke();
  putGlow(b.x + b.w/2, b.y + 14, 18, color, 0.18);
  faText(icon, b.x + b.w/2, b.y + 14, 12.5, color, 'center', true);
  faText(label, b.x + b.w/2, b.y + 31, 8.5, '#cfd8e0', 'center');
  tapGlow(b, color);
}
function drawRentZone(){
  const rent = rentFor(G.week);
  const f = clamp(G.money / rent, 0, 1);
  faText('اجاره‌ی هفته ' + faNum(G.week), 16, 574, 9.5, '#7d8894', 'right');
  faText(fmtK(G.money) + ' / ' + fmtK(rent), 270, 574, 9.5, f >= 1 ? hexk('g') : '#e9eef2', 'left', true);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  rr(16, 584, 250, 8, 4); ctx.fill();
  const grd = ctx.createLinearGradient(266, 0, 16, 0);
  grd.addColorStop(0, hexk('c')); grd.addColorStop(1, hexk('g'));
  ctx.fillStyle = grd;
  rr(16, 584, Math.max(4, 250 * f), 8, 4); ctx.fill();
  if(f >= 1) putGlow(100, 588, 40, hexk('g'), 0.15);
  const cx = 312, cy = 592, r = 24;
  const frac = 1 - G.t / DAY_LEN;
  drawRing(cx, cy, r, frac, frac > 0.3 ? hexk('g') : '#ff4d5e', 3.4);
  faText(faNum(G.day) + '/' + faNum(DAYS), cx, cy - 4, 11, '#e9eef2', 'center', true);
  faText(faNum(Math.ceil(DAY_LEN - G.t)) + ' ثانیه', cx, cy + 10, 7.5, '#7d8894', 'center');
}
function drawPill(x, y, w, h){
  ctx.fillStyle = 'rgba(12,15,19,.78)';
  rr(x, y, w, h, h/2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
  rr(x, y, w, h, h/2); ctx.stroke();
}
function drawHUD(){
  drawPill(50, 10, 76, 30);
  faText('هفته ' + faNum(G.week), 88, 20, 9, '#7d8894', 'center');
  faText('روز ' + faNum(G.day), 88, 32, 10.5, '#e9eef2', 'center', true);
  drawPill(130, 10, 104, 30);
  faText(titleFor(G.level) + ' · Lv' + faNum(G.level), 182, 19, 9, '#cfd8e0', 'center');
  const need = xpNext(G.level);
  const f = G.level >= 10 ? 1 : clamp(G.xp / need, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  rr(140, 32, 84, 3.5, 1.75); ctx.fill();
  ctx.fillStyle = hexk('a');
  rr(140 + 84 - 84 * f, 32, 84 * f, 3.5, 1.75); ctx.fill();
  drawPill(238, 10, 52, 30);
  faText('شهرت', 264, 19, 7.5, '#7d8894', 'center');
  faText(faNum(Math.round(G.fame)) + '٪', 264, 32, 10.5, '#e9eef2', 'center', true);
  faText('★★★★★'.slice(0, cafeStars()) + ' №' + faNum(cafeRank()), 264, 48, 7, hexk('a'), 'center', true);
  drawPill(294, 10, 58, 30);
  putGlow(323, 22, 22, hexk('g'), 0.16);
  faText(fmtK(Math.round(G.moneyDisp)), 323, 19, 13.5, hexk('g'), 'center', true);
  faText('تومان', 323, 32, 7, '#7d8894', 'center');
}
function drawComboFlame(){
  if(G.combo < 2) return;
  const pulse = 1 + Math.sin(G.t * 8) * 0.08;
  putGlow(22, 152, 22, hexk('p'), 0.3);
  faText('🔥×' + faNum(G.combo), 22, 152, 11 * pulse, hexk('p'), 'center', true);
}

/* ================= ذره‌ها ================= */
function coins(x, y, pay){
  const n = clamp(Math.round(pay / 45000), 3, 8);
  for(let i = 0; i < n; i++) G.particles.push({ type:'coin', x, y, vx: rnd(-40, 40), vy: rnd(-70, -20), life: 0.8, delay: i * 0.04 });
}
function floater(x, y, txt, color){
  G.floaters.push({ x, y, txt, color: color || hexk('g'), t: 1 });
  if(G.floaters.length > 12) G.floaters.shift();
}
function dust(x, y){
  G.particles.push({ type:'dust', x, y, vx: rnd(-5, 5), vy: rnd(-8, -3), life: 0.45, delay: 0 });
}
function steam(x, y, s){
  G.particles.push({ type:'steam', x, y, vx: rnd(-4, 4), vy: rnd(-22, -14), life: 1.2, delay: 0, s: s || 1 });
}
function smoke(x, y){
  G.particles.push({ type:'smoke', x, y, vx: rnd(-3, 6), vy: rnd(-12, -7), life: 2.2, delay: 0 });
}
function puff(x, y, color){
  G.particles.push({ type:'puff', x, y, life: 0.5, delay: 0, color });
}
function starBurst(x, y){
  for(let i = 0; i < 6; i++){
    const a = i / 6 * TAU;
    G.particles.push({ type:'star', x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 0.5, delay: 0 });
  }
}
function tickParticles(dt){
  const keep = [];
  for(const p of G.particles){
    if(p.delay > 0){ p.delay -= dt; keep.push(p); continue; }
    p.life -= dt;
    if(p.type === 'coin'){
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
      const dx = 323 - p.x, dy = 25 - p.y, d = Math.hypot(dx, dy);
      if(d < 220){ p.x += dx * dt * 4.5; p.y += dy * dt * 4.5; }
    } else if(p.type === 'steam' || p.type === 'smoke' || p.type === 'dust' || p.type === 'heart'){
      p.x += p.vx * dt + Math.sin(p.life * 6) * 0.3; p.y += p.vy * dt;
    } else if(p.type === 'star'){
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
    }
    if(p.life > 0) keep.push(p);
  }
  G.particles = keep.slice(-70);
  for(const f of G.floaters) f.t -= dt * 0.85;
  G.floaters = G.floaters.filter(f => f.t > 0);
  if(G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
  if(G.flash){ G.flash.a -= dt * 0.5; if(G.flash.a <= 0) G.flash = null; }
  if(G.doorGlow > 0) G.doorGlow = Math.max(0, G.doorGlow - dt * 2);
  if(G.tapFx){ G.tapFx.t -= dt; if(G.tapFx.t <= 0) G.tapFx = null; }
}
function drawParticles(){
  for(const p of G.particles){
    if(p.delay > 0) continue;
    if(p.type === 'coin'){
      ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
      ctx.fillStyle = hexk('g');
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.8, 0, TAU); ctx.fill();
    } else if(p.type === 'steam'){
      ctx.globalAlpha = clamp(p.life * 0.5, 0, 0.5);
      ctx.fillStyle = '#cfd8e0';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * (p.s || 1), 0, TAU); ctx.fill();
    } else if(p.type === 'smoke'){
      ctx.globalAlpha = clamp(p.life * 0.28, 0, 0.3);
      ctx.fillStyle = '#9aa4b0';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.2 + (2.2 - p.life), 0, TAU); ctx.fill();
    } else if(p.type === 'dust'){
      ctx.globalAlpha = clamp(p.life * 0.5, 0, 0.35);
      ctx.fillStyle = '#5a6470';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, TAU); ctx.fill();
    } else if(p.type === 'puff'){
      ctx.globalAlpha = clamp(p.life * 1.6, 0, 0.7);
      ctx.strokeStyle = p.color || '#ff4d5e';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 8 + (0.5 - p.life) * 26, 0, TAU); ctx.stroke();
    } else if(p.type === 'star'){
      ctx.globalAlpha = clamp(p.life * 1.6, 0, 1);
      ctx.fillStyle = hexk('a');
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill();
    } else if(p.type === 'heart'){
      ctx.globalAlpha = clamp(p.life * 1.2, 0, 1);
      faText('♥', p.x, p.y, 9, hexk('p'), 'center', true);
    }
    ctx.globalAlpha = 1;
  }
}
function drawFloaters(){
  for(const f of G.floaters){
    const a = clamp(f.t, 0, 1);
    ctx.globalAlpha = a;
    faText(f.txt, f.x, f.y - (1 - f.t) * 24, 11, f.color, 'center', true);
    ctx.globalAlpha = 1;
  }
}

/* ================= فریمِ کامل ================= */
function drawTwinkles(){
  for(let i = 0; i < 3; i++){
    const a = (Math.sin(G.t * 1.8 + i * 2.1) + 1) / 2;
    if(a > 0.55){
      const sx = 168 + i * 16, sy = 84 + (i % 2) * 14;
      ctx.globalAlpha = (a - 0.55) * 1.6;
      ctx.strokeStyle = '#dfe8ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx - 2.6, sy); ctx.lineTo(sx + 2.6, sy);
      ctx.moveTo(sx, sy - 2.6); ctx.lineTo(sx, sy + 2.6); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
function drawMarquee(){
  const bx = 220, by = 84, bw = 94, bh = 17;
  ctx.fillStyle = 'rgba(7,9,13,.92)';
  rr(bx, by, bw, bh, 4); ctx.fill();
  ctx.strokeStyle = pcol('c', .4); ctx.lineWidth = 1;
  rr(bx, by, bw, bh, 4); ctx.stroke();
  for(let i = 0; i < bw; i += 6){
    ctx.fillStyle = (Math.floor(G.t * 4) + i / 6) % 2 ? pcol('c', .85) : pcol('c', .15);
    ctx.fillRect(bx + i + 2, by - 2.6, 3, 1.6);
    ctx.fillRect(bx + i + 2, by + bh + 1, 3, 1.6);
  }
  const texts = ['🎮 لَن‌پارتیِ جمعه — ثبت‌نام', '🥤 اسنک‌بارِ سرد و گرم', '📶 پلنِ نامحدودِ شبانه', '☕ چایِ دم‌کشیدهِ کافه‌نت', '👑 میزِ VIP آماده است'];
  const msg = texts[Math.floor(G.t / 8) % texts.length];
  ctx.save();
  ctx.beginPath(); ctx.rect(bx + 3, by + 1, bw - 6, bh - 2); ctx.clip();
  ctx.font = '7.5px ' + FONT_STACK;
  const w2 = ctx.measureText(msg).width + 24;
  const off = (G.t * 24) % w2;
  faText(msg, bx + bw - 4 - off, by + bh / 2 + 1.5, 7.5, pcol('c', .95), 'center');
  faText(msg, bx + bw - 4 - off + w2, by + bh / 2 + 1.5, 7.5, pcol('c', .95), 'center');
  ctx.restore();
}
function drawStaff(){
  if(lvl('staff') < 1) return;
  const x = 40, y = 292 + Math.sin(G.t * 1.6) * 1.2;
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 12, 9, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#51637f';
  rr(x - 8, y - 12, 16, 24, 6); ctx.fill();
  ctx.fillStyle = hexk('a'); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x + 3, y + 10); ctx.lineTo(x - 3, y + 10); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8c9a8';
  ctx.beginPath(); ctx.arc(x, y - 17, 6.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2b1f16';
  ctx.beginPath(); ctx.arc(x, y - 19, 6.5, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x + 9, y - 2); ctx.lineTo(x + 15, y - 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(x + 12, y - 3.4, 4.6, 1.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = pcol('a', .9);
  ctx.fillRect(x + 10.5, y - 7, 3, 3.5);
  if(G.staff.bub) drawBubble(x, y - 24, G.staff.bub.txt);
}
function drawCat(){
  const c = G.cat;
  if(!c.on) return;
  const bob = c.stop > 0 ? 0 : Math.sin(G.t * 9) * 0.7;
  ctx.save();
  ctx.translate(c.x, 372 + bob);
  ctx.scale(c.dir, 1);
  if(c.stop > 0) ctx.translate(0, Math.sin(G.t * 10) * 0.8);
  // سایه
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath(); ctx.ellipse(0, 4, 13, 2.6, 0, 0, TAU); ctx.fill();
  // دُم
  ctx.strokeStyle = '#2c3542'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, -2);
  ctx.quadraticCurveTo(-20, -6, -18 + Math.sin(G.t * 3) * 3.4, -14);
  ctx.stroke();
  // پاها
  const ph = c.stop > 0 ? 0 : G.t * 9;
  ctx.strokeStyle = '#232b36'; ctx.lineWidth = 2;
  for(let k = 0; k < 2; k++){
    ctx.beginPath(); ctx.moveTo(-6 + k * 12, 0);
    ctx.lineTo(-6 + k * 12 + Math.sin(ph + k * 3) * 2.6, 4.6); ctx.stroke();
  }
  // بدن و سر
  ctx.fillStyle = '#2c3542';
  ctx.beginPath(); ctx.ellipse(0, -4.5, 12, 5.2, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -8, 5.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8.2, -11.8); ctx.lineTo(9.4, -16.4); ctx.lineTo(11.4, -12.2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(11.6, -12.3); ctx.lineTo(13.6, -15.8); ctx.lineTo(15, -11.6); ctx.closePath(); ctx.fill();
  // گوشِ درونی و چشمِ سبز
  ctx.fillStyle = pcol('p',.5);
  ctx.beginPath(); ctx.moveTo(9.4, -12.4); ctx.lineTo(9.9, -14.6); ctx.lineTo(10.9, -12.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7dffbe';
  ctx.fillRect(12.6, -9.2, 1.8, 1.4);
  // قلاده
  ctx.strokeStyle = hexk('a'); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(9.4, -6, 3.8, Math.PI * 0.15, Math.PI * 0.75); ctx.stroke();
  ctx.restore();
  if(c.bub) drawBubble(c.x, 366, c.bub.txt);
}
function drawScene(){
  ctx.save();
  const z = G.zoom || 1;
  if(z !== 1){
    ctx.translate(ZC.x, ZC.y);
    ctx.scale(z, z);
    ctx.translate(-ZC.x, -ZC.y);
  }
  ctx.translate(-G.cam.x, 0);
  if(bgCanvas) ctx.drawImage(bgCanvas, -ox / scale - 20, -oy / scale, bgCanvas.width / scale, bgCanvas.height / scale);
  drawNeonSign();
  drawGamingSign();
  drawCrown();
  drawTwinkles();
  drawMarquee();
  drawTV();
  drawRack();
  drawClockHands();
  drawLamps();
  const z0 = G.zoom || 1;
  const visL = G.cam.x - 60, visR = G.cam.x + VW / z0 + 60;
  for(let i = 0; i < MAX_SLOTS; i++){
    const dp = deskPos(i);
    if(dp.x < visL || dp.x > visR) continue;
    drawDesk(i);
  }
  drawPrintStation();
  drawConsoles();
  for(const pp of G.people) if(pp.type !== 'cust' && pp.x > visL - 10 && pp.x < visR + 10) drawPerson(pp);
  drawQueuePeople();
  for(const pp of G.people) if(pp.type === 'cust' && pp.x > visL - 14 && pp.x < visR + 14) drawPerson(pp);
  drawCat();
  drawStaff();
  drawParticles();
  drawFloaters();
  ctx.restore();
}
function drawGamingSign(){
  const flick = Math.random() < 0.02 ? rnd(0.4, 0.7) : 1;
  putGlow(500, 66, 30, hexk('c'), 0.35 * flick);
  faText('اتاقِ گیم', 500, 66, 11, pcol('c'), 'center', true);
  for(let i = 0; i < 5; i++){
    const h = 3 + Math.abs(Math.sin(G.t * 3 + i * 1.1)) * 7;
    ctx.fillStyle = pcol(i % 2 ? 'p' : 'g', .55);
    ctx.fillRect(466 + i * 15, 86 - h, 5, h);
  }
}
function drawCrown(){
  if(!Save.d.crowned) return;
  const y = 42 + Math.sin(G.t * 2) * 2;
  putGlow(180, y + 4, 16, '#ffd75f', 0.5);
  ctx.fillStyle = '#ffd75f';
  ctx.beginPath();
  ctx.moveTo(168, y + 9); ctx.lineTo(168, y + 1); ctx.lineTo(174, y + 6); ctx.lineTo(180, y - 2);
  ctx.lineTo(186, y + 6); ctx.lineTo(192, y + 1); ctx.lineTo(192, y + 9); ctx.closePath(); ctx.fill();
}
function drawPanArrows(){
  const maxCam = WORLD_W - VW;
  if(maxCam <= 0 || G.scene !== 'day') return;
  const y = 300;
  if(G.cam.x > 2){
    const a = (0.35 + 0.25 * Math.sin(G.t * 3)).toFixed(2);
    faText('‹', 16, y, 26, 'rgba(255,255,255,' + a + ')', 'center', true);
    HIT.list.push({ x: 2, y: y - 26, w: 30, h: 52, id: 'panL' });
  }
  if(G.cam.x < maxCam - 2){
    const a = (0.35 + 0.25 * Math.sin(G.t * 3 + 2)).toFixed(2);
    faText('›', 344, y, 26, 'rgba(255,255,255,' + a + ')', 'center', true);
    HIT.list.push({ x: 328, y: y - 26, w: 30, h: 52, id: 'panR' });
  }
  /* دکمه‌های زوم — سمتِ چپ، بالای فلشِ پن */
  const zx = 4, zy1 = 206, zy2 = 240;
  for(const zb of [{ id:'zin', y: zy1, t:'＋' }, { id:'zout', y: zy2, t:'－' }]){
    ctx.fillStyle = 'rgba(12,15,19,.78)';
    rr(zx, zb.y, 28, 28, 9); ctx.fill();
    ctx.strokeStyle = (G.zoom || 1) > 1 ? pcol('c',.6) : 'rgba(255,255,255,.14)';
    rr(zx, zb.y, 28, 28, 9); ctx.stroke();
    faText(zb.t, zx + 14, zb.y + 14, 14, (G.zoom || 1) > 1 ? '#9fd8ff' : '#7d8894', 'center', true);
    HIT.list.push({ x: zx, y: zb.y, w: 28, h: 28, id: zb.id });
  }
}
function render(dt){
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if(G.scene === 'menu'){
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    drawScene();
    if(vignCanvas) ctx.drawImage(vignCanvas, -ox / scale, -oy / scale, cv.width / scale, cv.height / scale);
    ctx.restore();
    HIT.list = [];
    return;
  }
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  if(G.shake > 0) ctx.translate(rnd(-6, 6) * G.shake, rnd(-6, 6) * G.shake);
  drawScene();
  if(vignCanvas) ctx.drawImage(vignCanvas, -ox / scale, -oy / scale, cv.width / scale, cv.height / scale);
  drawComboFlame();
  drawPipe();
  drawChips();
  drawMissionTicker();
  drawButtons();
  drawPanArrows();
  drawTabs();
  drawRentZone();
  drawHUD();
  if(G.flash){
    ctx.fillStyle = 'rgba(' + G.flash.color + ',' + G.flash.a + ')';
    ctx.fillRect(0, 0, VW, VH);
  }
  ctx.restore();
}
</script>
