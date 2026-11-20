/* راه‌اندازی — مهاجرت‌ها سپس HTTP */
import express from 'express';
import { CONFIG } from './config.js';
import { runMigrations, pool } from './db.js';
import { api } from './app.js';

async function main() {
  if (!CONFIG.jwtSecret) {
    console.warn('[server] هشدار: JWT_SECRET تنظیم نشده — برای انتشارِ واقعی الزامی است');
  }
  if (!CONFIG.iabPublicKey) {
    console.warn('[server] هشدار: IAB_PUBLIC_KEY تنظیم نشده — /purchases/verify خریدها را رد می‌کند (امن به‌صورتِ پیش‌فرض)');
  }
  await runMigrations();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', api);
  app.get('/healthz', (_q, r) => r.json({ ok: true }));

  app.listen(CONFIG.port, () =>
    console.log(`[server] listening on :${CONFIG.port} — monetization backend v1.7.0`),
  );
}

main().catch(async (e) => {
  console.error('[server] fatal:', e);
  await pool.end().catch(() => {});
  process.exit(1);
});
