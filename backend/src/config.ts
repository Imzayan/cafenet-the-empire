/* پیکربندی از محیط — هیچ secret در کد یا گیت */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function env(name: string, def = ''): string {
  return process.env[name] ?? def;
}

export const CONFIG = {
  port: parseInt(env('PORT', '8090'), 10),
  databaseUrl: env('DATABASE_URL', 'postgres://cafenet:cafenet@127.0.0.1:5433/cafenet'),
  jwtSecret: env('JWT_SECRET', ''),
  iabPublicKey: env('IAB_PUBLIC_KEY', ''),     // کلیدِ RSA عمومیِ مایکت (برای تأییدِ امضای سمتِ سرور)
  sessionTtlDays: parseInt(env('SESSION_TTL_DAYS', '30'), 10),
  economy: loadJson< Economy >(env('ECONOMY_FILE', 'config/economy.json'), {
    ads: { maxPerDay: 5, cooldownSeconds: 300, placements: {} as Record<string, Placement> },
    battlePass: { seasonDays: 30, tiers: 30, xpPerTier: 500, rewards: {} as Record<string, any> },
  } as Economy),
};

export interface Placement {
  kind: 'gold' | 'diamonds' | 'xp' | 'voucher' | 'none';
  amount?: number;
  formula?: 'double_income';
  cap?: number;
  perDay?: number;
}

export interface Economy {
  ads: { maxPerDay: number; cooldownSeconds: number; placements: Record<string, Placement> };
  battlePass: { seasonDays: number; tiers: number; xpPerTier: number; rewards: Record<string, any> };
}

function loadJson<T>(rel: string, def: T): T {
  const p = resolve(process.cwd(), rel);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf8')) as T; }
    catch { console.error('[config] bad', rel, '— default used'); }
  }
  return def;
}
