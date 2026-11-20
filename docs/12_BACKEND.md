# راه‌اندازی Backend (Node.js + TypeScript + PostgreSQL)

## معماری
- Express + `pg` — بدونِ ORM؛ Ledger اتمیک با `BEGIN/COMMIT`.
- توکنِ opaque با HMAC-SHA256 + جدولِ `player_sessions` (hash؛ توکنِ خام هرگز ذخیره نمی‌شود).
- ضدِ replay: `UNIQUE(ref_type, ref_id, currency)` روی `wallet_ledger` و `purchase_token` یکتا روی `transactions`.
- Rate limit: 60/min عمومی، 20/min روی مسیرهای حساس (per token+path).
- بدونِ `IAB_PUBLIC_KEY` در env، `/purchases/verify` همهٔ خریدها را با **503** رد می‌کند (امن به‌صورتِ پیش‌فرض).

## استقرارِ واقعی (دامنه/سرورِ مالک)
```bash
# 1) PostgreSQL
sudo apt install postgresql
sudo -u postgres psql -c "CREATE USER cafenet WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE cafenet OWNER cafenet;"

# 2) پروژه
cd backend && npm ci && npm run build
cp .env.example .env      # مقادیرِ واقعی: DATABASE_URL, JWT_SECRET (openssl rand -hex 32), IAB_PUBLIC_KEY
node dist/server.js       # مهاجرت‌ها خودکار اجرا می‌شوند (migrations/001_init.sql)

# 3) HTTPS — پشتِ nginx (اجباری؛ کلاینتِ APK فقط https می‌پذیرد در Release)
server {
  listen 443 ssl;
  server_name api.YOUR-DOMAIN.ir;
  location / { proxy_pass http://127.0.0.1:8090; }
}
# گواهی: certbot --nginx -d api.YOUR-DOMAIN.ir
```
- alternative: `backend/docker-compose.yml` (postgres + app).
- backup: `pg_dump cafenet > backup-$(date +%F).sql` در cron روزانه + نگهداریِ ۳۰روزه.
- لاگ‌ها: stdout (journalctl در systemd)؛ خطاها بدونِ نشتِ جزئیات به کلاینت.

## نکتهٔ امنیتیِ مهم (شفاف)
امضای خریدِ مایکت با کلیدِ عمومیِ RSA بررسی می‌شود؛ **چون برای تأییدِ نهاییِ توکن باید با پنل/سرورِ مایکت هم‌راستا شود، پس از دریافتِ حسابِ واقعیِ توسعه‌دهنده، endpoint را با چند خریدِ واقعی کالیبره کن** (بخشِ 16_TEST_REPORT → BLOCKED).
