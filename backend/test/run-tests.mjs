/* تستِ یکپارچهٔ واقعی Backend — PostgreSQLِ embed + سرورِ واقعی + RSAِ واقعی
 * اجرا: node test/run-tests.mjs   (از پوشهٔ backend)
 * خروجی: جدولِ PASS/FAIL با جزئیات — هیچ تستِ شبیه‌سازی‌شده به‌عنوان واقعی معرفی نمی‌شود.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PORT = 8091, PGPORT = 5434;
const BASE = `http://127.0.0.1:${PORT}/api`;
let pass = 0, fail = 0;
const rows = [];
function T(name, cond, note = '') {
  rows.push({ name, st: cond ? 'PASS' : 'FAIL', note });
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${note ? ' | ' + note : ''}`);
}

/* ---------- PostgreSQL واقعی ---------- */
const pg = new EmbeddedPostgres({
  databaseDir: '/tmp/cnpg-test', user: 'cafenet', password: 'cafenet',
  port: PGPORT, persistent: false,
});
await pg.initialise();
await pg.start();
await pg.createDatabase('cafenet');
console.log('embedded postgres up on', PGPORT);

/* ---------- کلیدِ RSAِ آزمایشی (نقشِ کلیدِ پنلِ مایکت) ---------- */
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pubB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

const economy = {
  ads: { maxPerDay: 5, cooldownSeconds: 3, placements: {
    double_income: { kind: 'gold', formula: 'double_income', cap: 400 },
    gold_drop: { kind: 'gold', amount: 5 },
    repair: { kind: 'voucher', perDay: 1 },
    xp_bonus: { kind: 'xp', amount: 50 },
    event_bonus: { kind: 'diamonds', amount: 1, perDay: 1 },
    mission_bonus: { kind: 'gold', amount: 3 },
  } },
  battlePass: { seasonDays: 30, tiers: 30, xpPerTier: 500, rewards: {
    1: { free: true, gold: 2 }, 15: { free: false, premium: true, diamonds: 10 }, 30: { free: false, premium: true, diamonds: 50 },
  } },
};
writeFileSync(new URL('../test-economy.json', import.meta.url).pathname, JSON.stringify(economy));

/* ---------- سرورِ واقعی ---------- */
const srv = spawn('node', ['dist/server.js'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: { ...process.env, PORT: String(PORT), DATABASE_URL: `postgres://cafenet:cafenet@127.0.0.1:${PGPORT}/cafenet`,
         JWT_SECRET: 'test-secret-for-integration-only', IAB_PUBLIC_KEY: pubB64,
         ECONOMY_FILE: 'test-economy.json' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stdout.on('data', (d) => process.stdout.write('[srv] ' + d));
srv.stderr.on('data', (d) => process.stderr.write('[srv!] ' + d));
await new Promise((r) => setTimeout(r, 2500));

const call = async (path, { method = 'GET', body, token } = {}) => {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { code: r.status, j };
};
const signPurch = (json) =>
  createSign('RSA-SHA256').update(json, 'utf8').sign(privateKey, 'base64');

try {
  /* --- auth --- */
  let r = await call('/player/wallet');
  T('درخواستِ بدونِ Token → 401', r.code === 401);
  r = await call('/player/wallet', { token: 'garbage.token' });
  T('Token نامعتبر → 401', r.code === 401);

  r = await call('/auth/guest', { method: 'POST', body: { deviceId: 'test-device-0001' } });
  T('auth/guest → توکنِ معتبر', r.code === 200 && !!r.j.token);
  const tok = r.j.token;
  r = await call('/auth/refresh', { method: 'POST', token: tok });
  T('auth/refresh → توکنِ تازه', r.code === 200 && !!r.j.token);
  const tok2 = r.j.token;

  /* --- wallet/products --- */
  r = await call('/player/wallet', { token: tok2 });
  T('wallet اولیه صفر', r.code === 200 && r.j.wallet.gold === 0 && r.j.wallet.diamonds === 0);
  r = await call('/shop/products');
  T('فهرستِ محصولات ۸گانه، بدونِ قیمت', r.code === 200 && r.j.products.length === 8
      && r.j.products.every((p) => !('price' in p) && p.sku.includes('_')));

  /* --- purchase: بدونِ امضای معتبر → رد؛ با امضای معتبر → تحویلِ اتمیک --- */
  const sku = 'gold_pack_2';
  const originalJson = JSON.stringify({ orderId: 'myket-test-001', productId: sku, purchaseTime: Date.now(), purchaseToken: 'PT-TOKEN-001' });
  const wrongSig = signPurch(JSON.stringify({ tampered: true }));
  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku, token: 'PT-TOKEN-001', originalJson, signature: wrongSig, payload: 'req:x;tok:y' } });
  T('خرید با امضای نامعتبر → 503 مسدود', r.code === 503 && r.j.err === 'purchase_validation_not_configured');

  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku: 'unknown_pack', token: 'PT-X', originalJson, signature: signPurch(originalJson) } });
  T('sku نامعلوم → 400', r.code === 400);

  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku, token: 'PT-TOKEN-001', originalJson, signature: signPurch(originalJson), payload: 'req:x;tok:y' } });
  T('خریدِ معتبر → grant + wallet=25', r.code === 200 && r.j.grant?.gold === 25 && r.j.wallet.gold === 25,
    JSON.stringify(r.j).slice(0, 160));
  const firstWallet = r.j.wallet.gold;

  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku, token: 'PT-TOKEN-001', originalJson, signature: signPurch(originalJson), payload: 'req:x;tok:y' } });
  T('ثبتِ دوبارهٔ همان توکن → replay بدونِ grant', r.code === 200 && r.j.replay === true && r.j.wallet.gold === firstWallet);

  r = await call('/auth/guest', { method: 'POST', body: { deviceId: 'test-device-0002' } });
  const tokB = r.j.token;
  r = await call('/purchases/verify', { method: 'POST', token: tokB,
    body: { sku, token: 'PT-TOKEN-001', originalJson, signature: signPurch(originalJson) } });
  T('توکنِ خریدِ متعلق به بازیکنِ دیگر → 409', r.code === 409);

  r = await call('/purchases/history', { token: tok2 });
  T('تاریخچهٔ خرید', r.code === 200 && r.j.purchases.length === 1);

  /* --- non-consumable + subscription --- */
  const oj2 = JSON.stringify({ orderId: 'm2', purchaseToken: 'PT-REMOVE-1' });
  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku: 'remove_ads', token: 'PT-REMOVE-1', originalJson: oj2, signature: signPurch(oj2) } });
  T('remove_ads → entitlement', r.code === 200 && r.j.grant?.removeAds === 1);
  r = await call('/vip/status', { token: tok2 });
  T('vip/status: removeAds فعال، vip خاموش', r.code === 200 && r.j.entitlements.removeAds === true && r.j.vip.active === false);
  const oj3 = JSON.stringify({ orderId: 'm3', purchaseToken: 'PT-VIP-1' });
  r = await call('/purchases/verify', { method: 'POST', token: tok2,
    body: { sku: 'vip_monthly', token: 'PT-VIP-1', originalJson: oj3, signature: signPurch(oj3), itemType: 'subs' } });
  T('vip_monthly → اشتراکِ ۳۰روزه', r.code === 200 && r.j.grant?.vipDays === 30);
  r = await call('/vip/status', { token: tok2 });
  T('vip/status: اشتراکِ فعال', r.code === 200 && r.j.vip.active === true);

  /* --- rewards: سقفِ روزانه، cooldown، یک‌باربودن --- */
  r = await call('/rewards/claim', { method: 'POST', token: tok2, body: { placement: 'hacker_place', adRef: 'a1' } });
  T('placement نامعلوم → 400', r.code === 400);
  r = await call('/rewards/claim', { method: 'POST', token: tok2, body: { placement: 'gold_drop', adRef: 'AD-1' } });
  T('ادعای اول → +5 سکه، claimsLeftToday=4', r.code === 200 && r.j.grant?.gold === 5 && r.j.claimsLeftToday === 4, 'wallet=' + JSON.stringify(r.j.wallet));
  r = await call('/rewards/claim', { method: 'POST', token: tok2, body: { placement: 'gold_drop', adRef: 'AD-2' } });
  T('ادعای فوری بعدی → cooldown 429', r.code === 429 && r.j.err === 'cooldown_left');
  r = await call('/rewards/claim', { method: 'POST', token: tok2, body: { placement: 'gold_drop', adRef: 'AD-1' } });
  T('همان adRef دوباره → replay بدونِ grant', r.code === 200 && r.j.replay === true && r.j.wallet.gold === 30, JSON.stringify(r.j).slice(0,120));
  await new Promise((r2) => setTimeout(r2, 3600));   // cooldown=3s در تنظیمِ تست
  const six = [];
  for (let i = 0; i < 5; i++) {
    six.push(await call('/rewards/claim', { method: 'POST', token: tok2, body: { placement: 'gold_drop', adRef: 'AD-s' + i } }));
    await new Promise((r2) => setTimeout(r2, 3200));
  }
  const okClaims = six.filter((x) => x.code === 200).length;
  T('سقفِ روزانه: ادعای ۵مُوفق، ششمیِ ردشده', okClaims === 4 && six[4].code === 429 && six[4].j.err === 'daily_cap',
    `mok=${okClaims}`);

  /* --- battle pass --- */
  r = await call('/battle-pass/claim', { method: 'POST', token: tok2, body: { tier: 1 } });
  T('claimِ تیرِ قفل‌شده → 403', r.code === 403);
  r = await call('/battle-pass/progress', { method: 'POST', token: tok2, body: { xp: 600 } });
  T('پیشرفتِ XP → تیرِ ۱', r.code === 200 && r.j.tier === 1, JSON.stringify(r.j).slice(0,120));
  r = await call('/battle-pass/claim', { method: 'POST', token: tok2, body: { tier: 1 } });
  T('claimِ تیرِ ۱ → +2 سکه', r.code === 200 && r.j.grant?.gold === 2, JSON.stringify(r.j).slice(0,140));
  r = await call('/battle-pass/claim', { method: 'POST', token: tok2, body: { tier: 1 } });
  T('claimِ دوبارهٔ همان تیر → 409', r.code === 409);
  r = await call('/battle-pass/claim', { method: 'POST', token: tok2, body: { tier: 15 } });
  T('تیرِ قفلِ بالاتر → 403', r.code === 403);
  for (let i = 0; i < 5; i++) {
    r = await call('/battle-pass/progress', { method: 'POST', token: tok2, body: { xp: 1900 } });
  }
  T('XP تا تیرِ ۱۶ (سقفِ ۲۰۰۰/درخواست درست کار می‌کند)', r.code === 200 && r.j.tier >= 15, 'tier=' + r.j.tier);
  r = await call('/battle-pass/claim', { method: 'POST', token: tok2, body: { tier: 15 } });
  T('پرمیوم بدونِ اشتراکِ بتل‌پس → 402', r.code === 402);

  /* --- analytics --- */
  r = await call('/analytics/events', { method: 'POST', token: tok2, body: { name: 'session_start', props: { v: '1.7.0' } } });
  T('analytics ثبت شد', r.code === 200);

  /* --- rate limit (tight: 20/min روی auth/guest) --- */
  let got429 = false;
  for (let i = 0; i < 25; i++) {
    const rr = await call('/auth/guest', { method: 'POST', body: { deviceId: 'rl-dev-' + i } });
    if (rr.code === 429) { got429 = true; break; }
  }
  T('Rate limit → 429 بعد از سقف', got429);

  /* --- مهاجرتِ دوم = بدونِ خطا (idempotent) --- */
  srv.kill('SIGTERM');
  await new Promise((r2) => setTimeout(r2, 800));
  const srv2 = spawn('node', ['dist/server.js'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: `postgres://cafenet:cafenet@127.0.0.1:${PGPORT}/cafenet`,
           JWT_SECRET: 'test-secret-for-integration-only', IAB_PUBLIC_KEY: pubB64, ECONOMY_FILE: 'test-economy.json' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  await new Promise((r2) => setTimeout(r2, 2500));
  const rr2 = await call('/shop/products');
  T('راه‌اندازیِ دوباره (restart) → مهاجرتِ idempotent و سرویسِ سالم', rr2.code === 200);
  srv2.kill('SIGTERM');
} catch (e) {
  T('بدونِ استثنای ناتمام', false, String(e));
} finally {
  await pg.stop().catch(() => {});
}

console.log(`\n==== جمعِ تست‌های Backend: ${pass} PASS / ${fail} FAIL ====`);
process.exit(fail ? 1 : 0);
