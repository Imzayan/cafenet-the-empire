/* احرازِ هویت — توکنِ opaque با HMAC (بدونِ وابستگیِ خارجی) + scrypt برای گذرواژه‌ها */
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { CONFIG } from './config.js';
import { pool } from './db.js';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function sign(payload: string): string {
  return createHmac('sha256', CONFIG.jwtSecret || 'DEV_SECRET_REPLACE_IN_PRODUCTION')
    .update(payload).digest('base64url');
}

export function issueToken(playerId: string): { token: string; expiresAt: Date } {
  const exp = new Date(Date.now() + CONFIG.sessionTtlDays * 86400_000);
  const payload = `${playerId}.${exp.getTime()}.${randomBytes(12).toString('base64url')}`;
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
  return { token, expiresAt: exp };
}

export type Authed = { playerId: string };

/** بررسیِ Bearer: ساختار + امضا + انقضا + وجودِ session فعال */
export async function authBearer(header?: string): Promise<Authed | null> {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = Buffer.from(token.slice(0, dot), 'base64url').toString('utf8');
  const sig = token.slice(dot + 1);
  const want = sign(payload);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  const [playerId, expMs] = payload.split('.');
  if (!playerId || !expMs || Date.now() > Number(expMs)) return null;
  const s = await pool.query(
    `SELECT 1 FROM player_sessions WHERE token_hash = $1 AND expires_at > now()`,
    [sha256(token)],
  );
  if (s.rowCount === 0) return null;
  await pool.query(`UPDATE players SET last_seen = now() WHERE id = $1`, [playerId]);
  return { playerId };
}

export async function createSession(playerId: string): Promise<{ token: string; expiresAt: Date }> {
  const { token, expiresAt } = issueToken(playerId);
  await pool.query(
    `INSERT INTO player_sessions (player_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
    [playerId, sha256(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function rotateSession(oldHash: string): Promise<{ token: string } | null> {
  const q = await pool.query(`SELECT player_id, expires_at FROM player_sessions WHERE token_hash = $1`, [oldHash]);
  if (q.rowCount === 0) return null;
  const row = q.rows[0];
  if (new Date(row.expires_at) < new Date()) return null;
  await pool.query(`DELETE FROM player_sessions WHERE token_hash = $1`, [oldHash]);
  return await createSession(row.player_id);
}

export const tokenHash = sha256;
