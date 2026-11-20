/* اتصالِ PostgreSQL — Ledger اتمیک با BEGIN/COMMIT */
import { Pool, PoolClient } from 'pg';
import { CONFIG } from './config.js';
import { resolve } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';

export const pool = new Pool({ connectionString: CONFIG.databaseUrl, max: 8 });

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

/** تغییرِ اتمیکِ موجودی + ثبتِ Ledger — refId یکتا = ضدِ replay */
export async function ledgerChange(
  c: PoolClient,
  playerId: string,
  currency: 'gold' | 'diamonds',
  amount: number,
  reason: string,
  refType: string,
  refId: string,
): Promise<{ balance: number }> {
  const upd = await c.query(
    `UPDATE wallets SET ${currency} = ${currency} + $1, updated_at = now()
     WHERE player_id = $2 RETURNING ${currency} AS balance`,
    [amount, playerId],
  );
  if (upd.rowCount === 0) throw new Error('wallet_missing');
  const balance = upd.rows[0].balance as number;
  await c.query(
    `INSERT INTO wallet_ledger (player_id, currency, amount, balance_after, reason, ref_type, ref_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [playerId, currency, amount, balance, reason, refType, refId],
  );
  return { balance };
}

export async function runMigrations(): Promise<void> {
  const dir = resolve(process.cwd(), 'migrations');
  const files = readdirSync(dir).filter((x) => x.endsWith('.sql')).sort();
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())`);
  for (const f of files) {
    const known = await pool.query(`SELECT applied_at FROM schema_migrations WHERE name = $1`, [f]);
    const wasApplied = (known.rowCount ?? 0) > 0 && known.rows[0].applied_at !== null;
    if (wasApplied) continue;
    await pool.query(readFileSync(resolve(dir, f), 'utf8'));
    if ((known.rowCount ?? 0) === 0) await pool.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [f]);
    else await pool.query(`UPDATE schema_migrations SET applied_at = now() WHERE name = $1`, [f]);
    console.log('[db] migration applied:', f);
  }
}
