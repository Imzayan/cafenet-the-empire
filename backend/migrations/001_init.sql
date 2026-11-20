-- CAFENET backend — اسکیمای اولیه (۱۲ جدولِ brief)
-- اصول: Ledger اتمیک برای هر تغییرِ موجودی؛ ضدِ ثبتِ دوباره با constraint یکتا.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id    text UNIQUE NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    last_seen    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_sessions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash  text UNIQUE NOT NULL,          -- sha256(token) — توکنِ خام هرگز ذخیره نمی‌شود
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON player_sessions(player_id);

CREATE TABLE IF NOT EXISTS wallets (
    player_id   uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    gold        integer NOT NULL DEFAULT 0 CHECK (gold >= 0),
    diamonds    integer NOT NULL DEFAULT 0 CHECK (diamonds >= 0),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    currency       text NOT NULL CHECK (currency IN ('gold','diamonds')),
    amount         integer NOT NULL,                 -- + اضافه / - برداشت
    balance_after  integer NOT NULL,
    reason         text NOT NULL,                    -- purchase / reward / battle_pass / vip / adjust
    ref_type       text NOT NULL,                    -- transaction / reward_claim / battle_pass / subscription
    ref_id         text NOT NULL,                    -- شناسهٔ یکتا (توکنِ خرید یا claim) — ضدِ replay
    created_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (ref_type, ref_id, currency)              -- هر تغییرِ موجودی فقط یک‌بار
);
CREATE INDEX IF NOT EXISTS idx_ledger_player ON wallet_ledger(player_id, created_at);

CREATE TABLE IF NOT EXISTS products (
    sku          text PRIMARY KEY,                   -- دقیقاً مطابقِ پنلِ مایکت
    type         text NOT NULL CHECK (type IN ('consumable','non_consumable','subscription')),
    title        text NOT NULL,
    grant_json   jsonb NOT NULL,                     -- مقدارهای جایزه (بدونِ قیمت!)
    active       boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS transactions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sku            text NOT NULL,
    purchase_token text UNIQUE NOT NULL,             -- شناسهٔ یکتای خرید در مایکت — ضدِ ثبتِ دوباره
    original_json  text NOT NULL,
    signature      text NOT NULL,
    payload        text NOT NULL DEFAULT '',
    item_type      text NOT NULL DEFAULT 'inapp',
    state          text NOT NULL DEFAULT 'delivered' CHECK (state IN ('recorded','delivered','failed')),
    created_at     timestamptz NOT NULL DEFAULT now(),
    delivered_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_tx_player ON transactions(player_id, created_at);

CREATE TABLE IF NOT EXISTS purchase_entitlements (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sku            text NOT NULL,                    -- remove_ads و ...
    purchase_token text UNIQUE NOT NULL,
    active         boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sku            text NOT NULL,
    purchase_token text UNIQUE NOT NULL,
    starts_at      timestamptz NOT NULL DEFAULT now(),
    expires_at     timestamptz NOT NULL,
    auto_renew     boolean NOT NULL DEFAULT false,
    active         boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_subs_player ON subscriptions(player_id, active);

CREATE TABLE IF NOT EXISTS reward_claims (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    placement   text NOT NULL,
    ad_ref      text NOT NULL DEFAULT '',
    grant_json  jsonb NOT NULL,
    day         date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tehran')::date,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (player_id, ad_ref)                       -- هر نمایشِ تبلیغ یک‌بار
);
CREATE INDEX IF NOT EXISTS idx_claims_player_day ON reward_claims(player_id, day);

CREATE TABLE IF NOT EXISTS ad_sessions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    placement     text NOT NULL,
    ad_ref        text UNIQUE NOT NULL,
    requested_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battle_pass_progress (
    player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season      integer NOT NULL,
    xp          integer NOT NULL DEFAULT 0,
    tier        integer NOT NULL DEFAULT 0,
    premium     boolean NOT NULL DEFAULT false,
    claimed     jsonb NOT NULL DEFAULT '[]',
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (player_id, season)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_id   uuid REFERENCES players(id) ON DELETE SET NULL,
    name        text NOT NULL,
    props       jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(name, created_at);

INSERT INTO products (sku, type, title, grant_json) VALUES
  ('gold_pack_1',   'consumable',     'بسته کوچک سکه',   '{"gold":10}'),
  ('gold_pack_2',   'consumable',     'بسته متوسط سکه',  '{"gold":25}'),
  ('gold_pack_3',   'consumable',     'بسته بزرگ سکه',   '{"gold":60}'),
  ('diamond_pack_1','consumable',     'بسته کوچک الماس', '{"diamonds":50}'),
  ('diamond_pack_2','consumable',     'بسته بزرگ الماس', '{"diamonds":120}'),
  ('starter_bundle','consumable',     'بسته شروع بازی',  '{"gold":15,"diamonds":30,"skin":"cyber","repairs":2}'),
  ('remove_ads',    'non_consumable', 'حذف تبلیغات',     '{}'),
  ('vip_monthly',   'subscription',   'عضویت ماهانه VIP','{"vipDays":30}')
ON CONFLICT (sku) DO NOTHING;
