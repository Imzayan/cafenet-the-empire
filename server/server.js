#!/usr/bin/env node
/* کافه‌نت — سرورِ آنلاینِ صفرِوابستگی (فازِ ۵)
 * اجزا: احرازِ هویت (scrypt + توکنِ HMAC)، ذخیره‌ی ابری، لیدربورد با اعتبارسنجیِ سرور، rate-limit
 * اجرا: node server.js  [PORT=8088]  — فایلِ بازی را هم از ریشه سرو می‌کند
 * ذخیره‌گاه: server/data/data.json (اتمیک) — قابلِ تعویض با PostgreSQL
 */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8088', 10);
const DIR = path.join(__dirname, 'data');
const DBF = path.join(DIR, 'data.json');
const KEYF = path.join(DIR, 'secret.key');
const GAMEF = path.join(__dirname, '..', 'cafnet.html');
const BODY_MAX = 256 * 1024;

/* ---------- نگه‌داری ---------- */
let DB = { users: {} };
let dirty = false;
function loadDB() {
  fs.mkdirSync(DIR, { recursive: true });
  if (fs.existsSync(DBF)) {
    try { DB = JSON.parse(fs.readFileSync(DBF, 'utf8')); } catch (e) { console.error('DB parse fail — fresh start'); }
    if (!DB.users) DB.users = {};
  }
  if (!fs.existsSync(KEYF)) fs.writeFileSync(KEYF, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
}
let flushT = null;
function mark() { dirty = true; if (!flushT) flushT = setTimeout(flush, 4000); }
function flush() {
  flushT = null;
  if (!dirty) return;
  const tmp = DBF + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(DB));
  fs.renameSync(tmp, DBF);
  dirty = false;
}
function secret() { return Buffer.from(fs.readFileSync(KEYF, 'utf8').trim(), 'hex'); }

/* ---------- ابزارِ امنیتی ---------- */
const b64u = b => Buffer.from(b).toString('base64url');
const unB64u = s => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
function hashPass(pass, saltHex) {
  return crypto.scryptSync(String(pass), Buffer.from(saltHex, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex');
}
function safeEq(a, b) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function sign(p) { return crypto.createHmac('sha256', secret()).update(p).digest('base64url'); }
function mkToken(u) {
  const p = b64u(JSON.stringify({ u, iat: Date.now(), exp: Date.now() + 30 * 864e5 }));
  return p + '.' + sign(p);
}
function checkToken(tok) {
  if (typeof tok !== 'string' || tok.length > 200) return null;
  const i = tok.lastIndexOf('.');
  if (i < 0) return null;
  const p = tok.slice(0, i), sg = tok.slice(i + 1);
  if (!safeEq(sg, sign(p))) return null;
  try {
    const d = unB64u(p);
    if (typeof d.u !== 'string' || !d.exp || Date.now() > d.exp) return null;
    return d;
  } catch (e) { return null; }
}
const USER_RE = /^[\w\u0600-\u06EE]{3,16}$/;
function clampN(v, lo, hi) { v = Math.floor(+v || 0); return v < lo ? lo : (v > hi ? hi : v); }

/* ---------- rate-limit (پنجره‌ی لغزان در حافظه) ---------- */
const RL = new Map();
function rateOK(key, limit, win) {
  const now = Date.now();
  const arr = (RL.get(key) || []).filter(t => now - t < win);
  if (arr.length >= limit) { RL.set(key, arr); return false; }
  arr.push(now); RL.set(key, arr);
  return true;
}
function ipOf(req) { return (req.socket.remoteAddress || '?').replace(/^::ffff:/, ''); }

/* ---------- پاسخ ---------- */
function send(res, code, obj, extra) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Token',
  }, extra || {}));
  res.end(body);
}
function readBody(req) {
  return new Promise((res, rej) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > BODY_MAX) { rej(413); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      try { res(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (e) { rej(400); }
    });
    req.on('error', () => rej(400));
  });
}
const userOf = name => (name && DB.users[name.toLowerCase()]) || null;

/* ---------- مسیرها ---------- */
async function route(req, res, url) {
  const ip = ipOf(req);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  /* سلامت */
  if (url.pathname === '/health') {
    const n = Object.keys(DB.users).length;
    return send(res, 200, { ok: true, users: n, uptime: Math.round(process.uptime()) });
  }

  /* بازی — همان‌مبدأ */
  if (url.pathname === '/' || url.pathname === '/cafnet.html') {
    try {
      const g = fs.readFileSync(GAMEF);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(g);
    } catch (e) { return send(res, 404, { ok: false, err: 'game file not found' }); }
  }

  /* ثبت‌نام */
  if (url.pathname === '/api/register' && req.method === 'POST') {
    if (!rateOK('r:' + ip, 8, 60000)) return send(res, 429, { ok: false, err: 'تلاشِ بیش از حد — یک دقیقه صبر کن' });
    const b = await readBody(req);
    const u = String(b.user || '').trim(), p = String(b.pass || '');
    if (!USER_RE.test(u)) return send(res, 400, { ok: false, err: 'نامِ کاربری: ۳ تا ۱۶ نویسه (حرف/عدد/زیرخط)' });
    if (p.length < 6) return send(res, 400, { ok: false, err: 'گذرواژه حداقل ۶ نویسه' });
    const k = u.toLowerCase();
    if (DB.users[k]) return send(res, 409, { ok: false, err: 'این نامِ کاربری گرفته شده' });
    const salt = crypto.randomBytes(16).toString('hex');
    DB.users[k] = { user: u, salt, ph: hashPass(p, salt), created: Date.now(), save: null, best: null };
    mark();
    return send(res, 200, { ok: true, token: mkToken(k), user: u });
  }

  /* ورود */
  if (url.pathname === '/api/login' && req.method === 'POST') {
    if (!rateOK('l:' + ip, 8, 60000)) return send(res, 429, { ok: false, err: 'تلاشِ بیش از حد — یک دقیقه صبر کن' });
    const b = await readBody(req);
    const k = String(b.user || '').trim().toLowerCase();
    const rec = DB.users[k];
    const okPass = rec && safeEq(hashPass(String(b.pass || ''), rec.salt), rec.ph);
    // تاخیرِ ثابتِ خطا — ضدِ شمارشِ نامِ کاربری و timing-attack
    if (!okPass) {
      const d0 = Date.now();
      while (Date.now() - d0 < 120) crypto.randomBytes(16);
      return send(res, 401, { ok: false, err: 'نامِ کاربری یا گذرواژه نادرست است' });
    }
    return send(res, 200, { ok: true, token: mkToken(k), user: rec.user, save: rec.save ? { ts: rec.save.ts, day: rec.save.day } : null });
  }

  const auth = () => {
    const d = checkToken(req.headers['x-token']);
    if (!d || !DB.users[d.u]) return null;
    return DB.users[d.u];
  };

  /* ذخیره‌ی ابری */
  if (url.pathname === '/api/save' && req.method === 'POST') {
    const rec = auth();
    if (!rec) return send(res, 401, { ok: false, err: 'نشست نامعتبر — دوباره وارد شو' });
    if (!rateOK('s:' + rec.user, 6, 60000)) return send(res, 429, { ok: false, err: 'هم‌گام‌سازیِ بیش از حد' });
    const b = await readBody(req);
    if (!b.data || typeof b.data !== 'object') return send(res, 400, { ok: false, err: 'داده‌ی ذخیره نامعتبر' });
    rec.save = { data: b.data, day: clampN(b.day, 0, 20000), ts: Date.now() };
    mark();
    return send(res, 200, { ok: true, ts: rec.save.ts });
  }
  if (url.pathname === '/api/save' && req.method === 'GET') {
    const rec = auth();
    if (!rec) return send(res, 401, { ok: false, err: 'نشست نامعتبر' });
    return send(res, 200, rec.save ? { ok: true, data: rec.save.data, ts: rec.save.ts, day: rec.save.day } : { ok: true, data: null });
  }

  /* امتیاز → لیدربورد (اعتبارسنجیِ سرور) */
  if (url.pathname === '/api/score' && req.method === 'POST') {
    const rec = auth();
    if (!rec) return send(res, 401, { ok: false, err: 'نشست نامعتبر' });
    if (!rateOK('c:' + rec.user, 1, 300000)) return send(res, 429, { ok: false, err: 'هر ۵ دقیقه یک بار' });
    const b = await readBody(req);
    const money = clampN(b.money, 0, 1e9);
    const level = clampN(b.level, 1, 60);
    const days = clampN(b.days, 0, 20000);
    const fame = clampN(b.fame, 0, 100);
    if (days < 7) return send(res, 200, { ok: true, ranked: false, note: 'یک هفته دوام بیاور تا در جدول بیایی' });
    const prev = rec.best;
    if (!prev || money > prev.money) rec.best = { money, level, days, fame, ts: Date.now() };
    mark();
    return send(res, 200, { ok: true, ranked: true, rank: rankOf(rec.user) });
  }
  if (url.pathname === '/api/leaderboard' && req.method === 'GET') {
    const rows = Object.values(DB.users).filter(u => u.best).sort((a, b) => b.best.money - a.best.money || b.best.days - a.best.days).slice(0, 10)
      .map((u, i) => ({ rank: i + 1, user: u.user, money: u.best.money, level: u.best.level, days: u.best.days, fame: u.best.fame }));
    return send(res, 200, { ok: true, rows });
  }

  return send(res, 404, { ok: false, err: 'not found' });
}
function rankOf(k) {
  const me = DB.users[k].best;
  let r = 1;
  for (const u of Object.values(DB.users)) if (u.best && (u.best.money > me.money || (u.best.money === me.money && u.best.days > me.days))) r++;
  return r;
}

/* ---------- راه‌اندازی ---------- */
loadDB();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  route(req, res, url).catch(code => send(res, code || 500, { ok: false, err: 'درخواست نامعتبر' }));
});
server.listen(PORT, () => console.log('کافه‌نت سرور — http://localhost:' + PORT + '  (کاربران: ' + Object.keys(DB.users).length + ')'));
process.on('SIGINT', () => { flush(); process.exit(0); });
setInterval(() => { if (dirty) flush(); }, 15000).unref();
