// db/init.js — creates all tables on first boot
module.exports = async function initDB(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS identifiers (
      id          SERIAL PRIMARY KEY,
      type        VARCHAR(20)  NOT NULL,  -- 'email' | 'whatsapp' | 'wallet'
      value       VARCHAR(255) NOT NULL UNIQUE,
      fcm_token   TEXT,
      vapid_sub   TEXT,                   -- JSON stringified VAPID subscription
      device_info TEXT,
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS brands (
      id          SERIAL PRIMARY KEY,
      slug        VARCHAR(100) NOT NULL UNIQUE,
      name        VARCHAR(255) NOT NULL,
      icon_url    TEXT,
      logo_url    TEXT,
      color       VARCHAR(20)  DEFAULT '#22c55e',
      dashboard_url TEXT,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS push_logs (
      id            SERIAL PRIMARY KEY,
      identifier    VARCHAR(255),
      id_type       VARCHAR(20),
      brand_slug    VARCHAR(100),
      title         TEXT,
      body          TEXT,
      trigger_method VARCHAR(30),  -- 'email_open' | 'whatsapp_read' | 'wallet_tx' | 'direct'
      status        VARCHAR(20)   DEFAULT 'pending',
      sent_at       TIMESTAMPTZ   DEFAULT NOW(),
      delivered_at  TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS email_tokens (
      id          SERIAL PRIMARY KEY,
      token       VARCHAR(255) NOT NULL UNIQUE,
      identifier  VARCHAR(255) NOT NULL,
      brand_slug  VARCHAR(100),
      title       TEXT,
      body        TEXT,
      used        BOOLEAN      DEFAULT FALSE,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wallet_watches (
      id          SERIAL PRIMARY KEY,
      address     VARCHAR(255) NOT NULL,
      network     VARCHAR(50)  DEFAULT 'bsc-testnet',
      identifier  VARCHAR(255),
      brand_slug  VARCHAR(100),
      title       TEXT,
      body        TEXT,
      active      BOOLEAN      DEFAULT TRUE,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );

    INSERT INTO brands (slug, name, icon_url, logo_url, color, dashboard_url)
    VALUES (
      'fedmonetize',
      'FedMonetizeChain',
      'https://fedmonetize.com/wp-content/uploads/2026/04/fedmonetizechain-logo-2.svg',
      'https://fedmonetize.com/wp-content/uploads/2026/04/fedmonetizechain-logo-2.svg',
      '#22c55e',
      'https://fedmonetize.com/dashboard'
    ) ON CONFLICT (slug) DO NOTHING;
  `);
  console.log('DB tables ready');
};
