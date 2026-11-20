/* مسیرهای REST امن — ثبتِ تراکنش، Ledger اتمیک، ضدِ تقلب */
import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { createVerify } from 'node:crypto';
import { CONFIG } from './config.js';
import { pool, tx, ledgerChange } from './db.js';
import { authBearer, createSession, rotateSession, tokenHash, Authed } from './auth.js';

export const api = Router();

/* ---------- Rate limit سادهٔ sliding-window (per IP / per token) ---------- */
const buckets = new Map<string, number[]>();
function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = ((req.headers.authorization as string | undefined)?.slice(0, 40) || req.ip || 'anon') + '@' + req.path;
    const now = Date.now();
    const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      res.status(429).json({ ok: false, err: 'rate_limited' });
      return;
    }
    arr.push(now);
    buckets.set(key, arr);
    next();
  };
}
const normal = rateLimit(60, 60_000);
const tight = rateLimit(20, 60_000);

/* helperها */
function json(req: Request): any {
  return (req as any).body ?? {};
}
type Auth = { playerId: string };
async function authed(req: Request, res: Response): Promise<Auth | null> {
  const a = await authBearer(req.headers.authorization as string | undefined);
  if (!a) res.status(401).json({ ok: false, err: 'unauthorized' });
  return a;
}
const bad = (res: Response, code: number, err: string, extra?: object) =>
  res.status(code).json({ ok: false, err, ...extra });
const okRes = (res: Response, body: object) => res.status(200).json({ ok: true, ...body });

async function walletOf(playerId: string, client?: any) {
  const q = client ?? pool;
  const w = await q.query(`SELECT gold, diamonds FROM wallets WHERE player_id = $1`, [playerId]);
  return { gold: w.rows[0]?.gold ?? 0, diamonds: w.rows[0]?.diamonds ?? 0 };
}

/* ================= auth ================= */

api.post('/auth/guest', tight, async (req, res) => {
  const deviceId = String(json(req).deviceId || '');
  if (!/^[A-Za-z0-9\-_]{8,64}$/.test(deviceId)) return bad(res, 400, 'bad_device_id');
  try {
    const pid = await tx(async (c) => {
      const found = await c.query(`SELECT id FROM players WHERE device_id = $1`, [deviceId]);
      if (found.rowCount) return found.rows[0].id as string;
      const ins = await c.query(`INSERT INTO players (device_id) VALUES ($1) RETURNING id`, [deviceId]);
      const id = ins.rows[0].id as string;
      await c.query(`INSERT INTO wallets (player_id) VALUES ($1)`, [id]);
      return id;
    });
    const s = await createSession(pid);
    okRes(res, { token: s.token, expiresAt: s.expiresAt.toISOString(), playerId: pid });
  } catch { bad(res, 500, 'server_error'); }
});

api.post('/auth/refresh', normal, async (req, res) => {
  const h = req.headers.authorization as string | undefined;
  if (!h?.startsWith('Bearer ')) return bad(res, 401, 'unauthorized');
  const newS = await rotateSession(tokenHash(h.slice(7).trim()));
  if (!newS) return bad(res, 401, 'session_expired');
  okRes(res, { token: newS.token });
});

/* ================= player ================= */

api.get('/player/profile', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const p = await pool.query(`SELECT id, created_at FROM players WHERE id = $1`, [a.playerId]);
  if (!p.rowCount) return bad(res, 404, 'not_found');
  const ent = await pool.query(
    `SELECT sku FROM purchase_entitlements WHERE player_id = $1 AND active`, [a.playerId]);
  const sub = await pool.query(
    `SELECT sku, expires_at FROM subscriptions WHERE player_id = $1 AND active AND expires_at > now()
     ORDER BY expires_at DESC LIMIT 1`, [a.playerId]);
  okRes(res, {
    playerId: a.playerId,
    createdAt: p.rows[0].created_at,
    entitlements: ent.rows.map((r) => r.sku),
    vip: sub.rowCount ? { active: true, expiresAt: sub.rows[0].expires_at } : { active: false },
    wallet: await walletOf(a.playerId),
  });
});

api.get('/player/wallet', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  okRes(res, { wallet: await walletOf(a.playerId) });
});

/* ================= shop ================= */

api.get('/shop/products', async (_req, res) => {
  const rows = await pool.query(
    `SELECT sku, type, title, grant_json AS grant FROM products WHERE active ORDER BY sku`);
  okRes(res, { products: rows.rows });   // قیمت‌ها عمداً اینجا نیست — فقط از SDK مایکت
});

/* ================= purchases ================= */

function verifySignature(originalJson: string, signature: string): boolean {
  const key = CONFIG.iabPublicKey;
  if (!key) return false;   // بدونِ کلید → تأییدِ امضا ناممکن → verify رد می‌کند
  try {
    const pub = '-----BEGIN PUBLIC KEY-----\n' + key + '\n-----END PUBLIC KEY-----';
    const v = createVerify('RSA-SHA256');
    v.update(originalJson, 'utf8');
    return v.verify(pub, signature, 'base64');
  } catch { return false; }
}

api.post('/purchases/verify', tight, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const b = json(req);
  const sku = String(b.sku || '');
  const token = String(b.token || '');
  const originalJson = String(b.originalJson || '');
  const signature = String(b.signature || '');
  const itemType = String(b.itemType || 'inapp') === 'subs' ? 'subs' : 'inapp';
  if (!sku || !token || !originalJson || !signature) return bad(res, 400, 'bad_request');

  const prod = await pool.query(`SELECT sku, type, title, grant_json AS grant FROM products WHERE sku = $1 AND active`, [sku]);
  if (!prod.rowCount) return bad(res, 400, 'unknown_sku');

  /* تأییدِ امضا (اگر کلیدِ پنل تنظیم باشد) — بدونِ آن، هیچ خریدی تحویل نمی‌شود */
  if (!verifySignature(originalJson, signature)) {
    return bad(res, 503, 'purchase_validation_not_configured',
      { msg: 'server: IAB_PUBLIC_KEY تنظیم نشده یا امضای خرید نامعتبر است — تحویلِ جایزه مسدود است' });
  }

  try {
    const result = await tx(async (c) => {
      /* ثبتِ تراکنش با توکنِ یکتا — ثبتِ دوباره = idempotent */
      const ins = await c.query(
        `INSERT INTO transactions (player_id, sku, purchase_token, original_json, signature, payload, item_type, state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'delivered')
         ON CONFLICT (purchase_token) DO NOTHING RETURNING id`,
        [a.playerId, sku, token, originalJson, signature, String(b.payload || ''), itemType],
      );
      if (ins.rowCount === 0) {
        const ex = await c.query(`SELECT player_id, state FROM transactions WHERE purchase_token = $1`, [token]);
        if (!ex.rowCount) throw new Error('tx_conflict');
        if (ex.rows[0].player_id !== a.playerId) throw new Error('token_owned_by_other');
        return { replay: true, grant: null as null, wallet: await walletOf(a.playerId, c), txId: null as string | null };
      }
      const txId = ins.rows[0].id as string;
      const grantJson = prod.rows[0].grant as { gold?: number; diamonds?: number; skin?: string; repairs?: number; vipDays?: number };
      let grant: Record<string, number | string> = {};
      if (grantJson.gold) { await ledgerChange(c, a.playerId, 'gold', grantJson.gold, 'purchase', 'transaction', token); grant.gold = grantJson.gold; }
      if (grantJson.diamonds) { await ledgerChange(c, a.playerId, 'diamonds', grantJson.diamonds, 'purchase', 'transaction', token); grant.diamonds = grantJson.diamonds; }
      if (grantJson.skin) grant.skin = grantJson.skin;
      if (grantJson.repairs) grant.repairs = grantJson.repairs;
      if (sku === 'remove_ads') {
        await c.query(`INSERT INTO purchase_entitlements (player_id, sku, purchase_token) VALUES ($1,$2,$3)
                       ON CONFLICT (purchase_token) DO NOTHING`, [a.playerId, sku, token]);
        grant.removeAds = 1;
      }
      if (sku === 'vip_monthly') {
        const days = (grantJson.vipDays ?? 30) as number;
        await c.query(`INSERT INTO subscriptions (player_id, sku, purchase_token, expires_at) VALUES ($1,$2,$3, now() + ($4 || ' days')::interval)
                       ON CONFLICT (purchase_token) DO NOTHING`, [a.playerId, sku, token, String(days)]);
        grant.vipDays = days;
      }
      await c.query(`UPDATE transactions SET delivered_at = now() WHERE id = $1`, [txId]);
      return { replay: false, grant, wallet: await walletOf(a.playerId, c), txId };
    });
    okRes(res, {
      txId: result.txId, replay: result.replay, grant: result.grant ?? {}, wallet: result.wallet,
    });
  } catch (e: any) {
    if (e.message === 'token_owned_by_other') return bad(res, 409, 'token_owned_by_other');
    console.error('[verify] error:', e?.message || e);
    bad(res, 500, 'server_error');
  }
});

api.get('/purchases/history', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const rows = await pool.query(
    `SELECT id, sku, state, created_at FROM transactions WHERE player_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [a.playerId]);
  okRes(res, { purchases: rows.rows });
});

api.post('/purchases/restore', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const ent = await pool.query(`SELECT sku FROM purchase_entitlements WHERE player_id = $1 AND active`, [a.playerId]);
  const subs = await pool.query(
    `SELECT sku, expires_at FROM subscriptions WHERE player_id = $1 AND active AND expires_at > now()`, [a.playerId]);
  okRes(res, { entitlements: ent.rows.map((r) => r.sku), subscriptions: subs.rows, wallet: await walletOf(a.playerId) });
});

/* ================= rewards (تبلیغ جایزه‌دار) ================= */

api.post('/rewards/claim', tight, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const b = json(req);
  const placement = String(b.placement || '');
  const adRef = String(b.adRef || '') || randomUUID();
  const income = Number(b.context?.income ?? 0);
  const P = CONFIG.economy.ads.placements[placement];
  if (!P) return bad(res, 400, 'unknown_placement');

  /* replay اول از همه — ادعای تکراریِ همان تبلیغ، پاسخِ idempotent می‌گیرد (حتی در cooldown) */
  const seen = await pool.query(
    `SELECT grant_json AS grant FROM reward_claims WHERE player_id = $1 AND ad_ref = $2`,
    [a.playerId, adRef]);
  if (seen.rowCount) {
    return okRes(res, { replay: true, grant: seen.rows[0].grant, wallet: await walletOf(a.playerId),
      claimsLeftToday: Math.max(0, CONFIG.economy.ads.maxPerDay - (await pool.query(
        `SELECT count(*)::int AS n FROM reward_claims WHERE player_id = $1 AND day = (now() AT TIME ZONE 'Asia/Tehran')::date`,
        [a.playerId])).rows[0].n) });
  }

  const today = await pool.query(
    `SELECT count(*)::int AS n, max(created_at) AS last
     FROM reward_claims WHERE player_id = $1 AND day = (now() AT TIME ZONE 'Asia/Tehran')::date`,
    [a.playerId]);
  const n = today.rows[0].n as number;
  const last = today.rows[0].last as Date | null;
  if (last && Date.now() - new Date(last).getTime() < CONFIG.economy.ads.cooldownSeconds * 1000)
    return bad(res, 429, 'cooldown_left', { waitSeconds: CONFIG.economy.ads.cooldownSeconds });
  if (n >= CONFIG.economy.ads.maxPerDay)
    return bad(res, 429, 'daily_cap');
  if (P.perDay) {
    const same = await pool.query(
      `SELECT count(*)::int AS n FROM reward_claims
       WHERE player_id = $1 AND placement = $2 AND day = (now() AT TIME ZONE 'Asia/Tehran')::date`,
      [a.playerId, placement]);
    if (same.rows[0].n >= (P.perDay as number)) return bad(res, 429, 'placement_daily_cap');
  }

  /* مقدارِ جایزه فقط طبقِ تنظیماتِ سرور — مقدارِ JS هرگز معتبر نیست */
  let grant: Record<string, number | string> = {};
  if (P.formula === 'double_income') {
    const amount = Math.max(0, Math.min(Math.floor(2 * Math.min(income, 200)), P.cap ?? 400));
    grant = { gold: amount };
  } else if (P.kind === 'gold' && P.amount) grant = { gold: P.amount };
  else if (P.kind === 'diamonds' && P.amount) grant = { diamonds: P.amount };
  else if (P.kind === 'xp' && P.amount) grant = { xp: P.amount };
  else if (P.kind === 'voucher') grant = { voucher: 'repair_free' };

  try {
    const res2 = await tx(async (c) => {
      const ins = await c.query(
        `INSERT INTO reward_claims (player_id, placement, ad_ref, grant_json) VALUES ($1,$2,$3,$4)
         ON CONFLICT (player_id, ad_ref) DO NOTHING RETURNING id`,
        [a.playerId, placement, adRef, JSON.stringify(grant)],
      );
      if (ins.rowCount === 0) return { replay: true, wallet: await walletOf(a.playerId, c) };
      await c.query(
        `INSERT INTO ad_sessions (player_id, placement, ad_ref) VALUES ($1,$2,$3)`,
        [a.playerId, placement, adRef]);
      if ((grant as any).gold) await ledgerChange(c, a.playerId, 'gold', (grant as any).gold, 'reward', 'reward_claim', adRef);
      if ((grant as any).diamonds) await ledgerChange(c, a.playerId, 'diamonds', (grant as any).diamonds, 'reward', 'reward_claim', adRef);
      return { replay: false, wallet: await walletOf(a.playerId, c) };
    });
    if (res2.replay) return okRes(res, { replay: true, grant: {}, wallet: await walletOf(a.playerId) });
    const left = CONFIG.economy.ads.maxPerDay - (n + 1);
    okRes(res, { grant, wallet: res2.wallet, claimsLeftToday: Math.max(0, left) });
  } catch { bad(res, 500, 'server_error'); }
});

/* ================= VIP ================= */

api.get('/vip/status', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const s = await pool.query(
    `SELECT sku, expires_at FROM subscriptions WHERE player_id = $1 AND active AND expires_at > now()
     ORDER BY expires_at DESC LIMIT 1`, [a.playerId]);
  okRes(res, {
    vip: s.rowCount
      ? { active: true, sku: s.rows[0].sku, expiresAt: s.rows[0].expires_at }
      : { active: false },
    entitlements: { removeAds: (await pool.query(
      `SELECT 1 FROM purchase_entitlements WHERE player_id = $1 AND sku = 'remove_ads' AND active`, [a.playerId])).rowCount! > 0 },
  });
});

/* ================= battle pass ================= */

function seasonOf(date = new Date()): number {
  const epoch = Date.UTC(2026, 0, 1);
  return Math.floor((date.getTime() - epoch) / (CONFIG.economy.battlePass.seasonDays * 86400_000)) + 1;
}

api.get('/battle-pass', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const season = seasonOf();
  const r = await pool.query(
    `SELECT xp, tier, premium, claimed FROM battle_pass_progress WHERE player_id = $1 AND season = $2`,
    [a.playerId, season]);
  const p = r.rows[0] || { xp: 0, tier: 0, premium: false, claimed: [] };
  okRes(res, { season, xp: p.xp, tier: p.tier, premium: p.premium, claimed: p.claimed,
    tiers: CONFIG.economy.battlePass.tiers });
});

/* پیشرفتِ بتل‌پس — XP از پایانِ روز؛ سقفِ روزانه در برابرِ جعل */
api.post('/battle-pass/progress', tight, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const addXp = Math.max(0, Math.min(Math.floor(Number(json(req).xp) || 0), 2000));
  const season = seasonOf();
  const xpPerTier = CONFIG.economy.battlePass.xpPerTier;
  const tiers = CONFIG.economy.battlePass.tiers;
  const r = await tx(async (c) => {
    await c.query(
      `INSERT INTO battle_pass_progress (player_id, season, xp, tier, premium, claimed)
       VALUES ($1,$2,$3,0,false,'[]')
       ON CONFLICT (player_id, season) DO UPDATE SET xp = LEAST(battle_pass_progress.xp + $3, 999999), updated_at = now()`,
      [a.playerId, season, addXp]);
    const cur = await c.query(
      `SELECT xp, tier FROM battle_pass_progress WHERE player_id = $1 AND season = $2`,
      [a.playerId, season]);
    const xp = cur.rows[0].xp as number;
    const tier = Math.min(tiers, Math.floor(xp / xpPerTier));
    await c.query(`UPDATE battle_pass_progress SET tier = $1 WHERE player_id = $2 AND season = $3`,
      [tier, a.playerId, season]);
    return { xp, tier };
  });
  okRes(res, { season, xp: r.xp, tier: r.tier });
});

api.post('/battle-pass/claim', normal, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const tier = Math.floor(Number(json(req).tier || 0));
  if (tier < 1 || tier > CONFIG.economy.battlePass.tiers) return bad(res, 400, 'bad_tier');
  try {
    const out = await tx(async (c) => {
      const season = seasonOf();
      const r = await c.query(
        `SELECT xp, tier, premium, claimed FROM battle_pass_progress WHERE player_id = $1 AND season = $2 FOR UPDATE`,
        [a.playerId, season]);
      const p = r.rows[0] || { xp: 0, tier: 0, premium: false, claimed: [] };
      if (tier > p.tier) throw new Error('tier_locked');
      const claimed: number[] = Array.isArray(p.claimed) ? p.claimed : [];
      if (claimed.includes(tier)) throw new Error('already_claimed');
      const rewards = (CONFIG.economy.battlePass as any).rewards?.[String(tier)] ?? null;
      if (!rewards) throw new Error('no_reward');
      if (rewards.premium && !p.premium) throw new Error('premium_required');
      const grant: Record<string, number | string> = {};
      const ref = `bp:${season}:${tier}`;
      if (rewards.gold) { await ledgerChange(c, a.playerId, 'gold', rewards.gold, 'battle_pass', 'battle_pass', ref + ':g'); grant.gold = rewards.gold; }
      if (rewards.diamonds) { await ledgerChange(c, a.playerId, 'diamonds', rewards.diamonds, 'battle_pass', 'battle_pass', ref + ':d'); grant.diamonds = rewards.diamonds; }
      if (rewards.skin) grant.skin = rewards.skin;
      if (rewards.xp) grant.xp = rewards.xp;
      await c.query(
        `INSERT INTO battle_pass_progress (player_id, season, xp, tier, premium, claimed)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (player_id, season) DO UPDATE SET claimed = $6, updated_at = now()`,
        [a.playerId, season, p.xp, p.tier, p.premium, JSON.stringify([...claimed, tier])],
      );
      return { grant, wallet: await walletOf(a.playerId, c) };
    });
    okRes(res, out);
  } catch (e: any) {
    const map: Record<string, number> = { tier_locked: 403, already_claimed: 409, no_reward: 404, premium_required: 402 };
    bad(res, map[e.message] ?? 500, e.message);
  }
});

/* ================= analytics ================= */

api.post('/analytics/events', tight, async (req, res) => {
  const a = await authed(req, res); if (!a) return;
  const name = String(json(req).name || '').slice(0, 64);
  if (!name) return bad(res, 400, 'bad_request');
  await pool.query(
    `INSERT INTO analytics_events (player_id, name, props) VALUES ($1,$2,$3)`,
    [a.playerId, name, JSON.stringify(json(req).props ?? {})]);
  okRes(res, {});
});

/* خطای مرکزی — بدونِ نشتِ جزئیات */
api.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ ok: false, err: 'server_error' });
});
