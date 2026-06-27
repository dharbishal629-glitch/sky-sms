import { pool } from "@workspace/db";

let schemaReady: Promise<void> | null = null;

const SEED_ENABLED_SERVICES = ["ds", "am", "go", "wa", "tg", "mm", "pp"];

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sim_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      credits NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_sessions (
      sid TEXT PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sim_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES sim_users(id),
      amount NUMERIC NOT NULL,
      credits NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_rentals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES sim_users(id),
      country_code TEXT NOT NULL,
      country_name TEXT NOT NULL,
      service_code TEXT NOT NULL,
      service_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      price NUMERIC NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'Hero SMS',
      provider_activation_id TEXT,
      refunded BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sim_sms_messages (
      id TEXT PRIMARY KEY,
      rental_id TEXT NOT NULL REFERENCES sim_rentals(id),
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      code TEXT,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_service_prices (
      service_code TEXT PRIMARY KEY,
      price NUMERIC NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_service_country_prices (
      service_code TEXT NOT NULL,
      country_code TEXT NOT NULL,
      price NUMERIC NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (service_code, country_code)
    );

    CREATE TABLE IF NOT EXISTS sim_enabled_services (
      service_code TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE sim_rentals ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'Hero SMS';
    ALTER TABLE sim_rentals ADD COLUMN IF NOT EXISTS provider_activation_id TEXT;
    ALTER TABLE sim_rentals ADD COLUMN IF NOT EXISTS refunded BOOLEAN NOT NULL DEFAULT FALSE;

    CREATE UNIQUE INDEX IF NOT EXISTS sim_users_id_unique ON sim_users(id);

    CREATE TABLE IF NOT EXISTS sim_enabled_countries (
      country_code TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_country_base_prices (
      country_code TEXT PRIMARY KEY,
      base_price NUMERIC NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES sim_users(id),
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES sim_support_tickets(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sim_coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      value NUMERIC NOT NULL,
      max_uses INTEGER,
      uses_count INTEGER NOT NULL DEFAULT 0,
      target_user_email TEXT,
      expires_at TIMESTAMPTZ,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE sim_payments ADD COLUMN IF NOT EXISTS coupon_code TEXT;
    ALTER TABLE sim_payments ADD COLUMN IF NOT EXISTS bonus_credits NUMERIC NOT NULL DEFAULT 0;
    ALTER TABLE sim_payments ADD COLUMN IF NOT EXISTS track_id TEXT;

    CREATE TABLE IF NOT EXISTS sim_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES sim_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      last_used_at TIMESTAMPTZ,
      revoked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Notifications system
    CREATE TABLE IF NOT EXISTS sim_notifications (
      id SERIAL PRIMARY KEY,
      user_id TEXT REFERENCES sim_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Referral system
    ALTER TABLE sim_users ADD COLUMN IF NOT EXISTS referral_code TEXT;
    ALTER TABLE sim_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

    CREATE TABLE IF NOT EXISTS sim_referrals (
      id SERIAL PRIMARY KEY,
      referrer_id TEXT NOT NULL REFERENCES sim_users(id),
      referred_id TEXT NOT NULL UNIQUE REFERENCES sim_users(id),
      bonus_amount NUMERIC NOT NULL DEFAULT 0.50,
      credited BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS sim_users_referral_code_idx ON sim_users(referral_code) WHERE referral_code IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sim_referral_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      bonus_amount NUMERIC NOT NULL DEFAULT 0.50,
      min_deposit_amount NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE sim_referral_settings ADD COLUMN IF NOT EXISTS min_deposit_amount NUMERIC NOT NULL DEFAULT 0;
    ALTER TABLE sim_rentals ADD COLUMN IF NOT EXISTS activation_minutes INTEGER NOT NULL DEFAULT 20;

    -- Migrate duplicate service codes to canonical codes in enabled services
    INSERT INTO sim_enabled_services (service_code) SELECT 'pb' FROM sim_enabled_services WHERE service_code = 'pp' ON CONFLICT DO NOTHING;
    DELETE FROM sim_enabled_services WHERE service_code IN ('pp', 'wx', 'nt', 'lf', 'fu');
    -- Migrate duplicate service price overrides
    INSERT INTO sim_service_prices (service_code, price, updated_at) SELECT 'pb', price, updated_at FROM sim_service_prices WHERE service_code = 'pp' ON CONFLICT DO NOTHING;
    DELETE FROM sim_service_prices WHERE service_code IN ('pp', 'wx', 'nt', 'lf', 'fu');

    CREATE TABLE IF NOT EXISTS sim_service_margins (
      service_code TEXT NOT NULL,
      country_code TEXT NOT NULL DEFAULT '',
      margin_percent NUMERIC NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (service_code, country_code)
    );

    -- Account suspension reason
    ALTER TABLE sim_users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

    -- Email/password authentication
    CREATE TABLE IF NOT EXISTS sim_email_credentials (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      user_id TEXT REFERENCES sim_users(id) ON DELETE CASCADE,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      reset_token TEXT,
      reset_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Checkout sessions for /checkout/:id flow
    CREATE TABLE IF NOT EXISTS sim_checkout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES sim_users(id),
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
    );

    -- IP ban system
    CREATE TABLE IF NOT EXISTS sim_ip_bans (
      id TEXT PRIMARY KEY,
      ip_address TEXT NOT NULL UNIQUE,
      reason TEXT,
      banned_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Track last seen IP per user
    ALTER TABLE sim_users ADD COLUMN IF NOT EXISTS last_seen_ip TEXT;

    -- Ensure email uniqueness for email-based auth conflict resolution
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sim_users_email_unique'
      ) THEN
        ALTER TABLE sim_users ADD CONSTRAINT sim_users_email_unique UNIQUE (email);
      END IF;
    END $$;

    -- Per-coin OxaPay merchant API keys (admin-configurable)
    CREATE TABLE IF NOT EXISTS sim_coin_api_keys (
      coin TEXT PRIMARY KEY,
      merchant_key TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Lien system: silent balance deductions on topup
    ALTER TABLE sim_users ADD COLUMN IF NOT EXISTS lien_amount NUMERIC NOT NULL DEFAULT 0;

    -- Support message image attachments
    ALTER TABLE sim_support_messages ADD COLUMN IF NOT EXISTS image_url TEXT;

    -- Status incidents
    CREATE TABLE IF NOT EXISTS sim_status_incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'investigating',
      components TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS sim_status_incident_updates (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL REFERENCES sim_status_incidents(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'update',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- API response time metrics (recorded each time /api/status is polled)
    CREATE TABLE IF NOT EXISTS sim_status_metrics (
      id SERIAL PRIMARY KEY,
      metric TEXT NOT NULL DEFAULT 'api_response_ms',
      value NUMERIC NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(
    `INSERT INTO sim_referral_settings (id, enabled, bonus_amount, min_deposit_amount)
     VALUES (1, TRUE, 0.50, 0)
     ON CONFLICT (id) DO NOTHING`
  );

  for (const code of SEED_ENABLED_SERVICES) {
    await pool.query(
      `INSERT INTO sim_enabled_services (service_code, enabled) VALUES ($1, TRUE)
       ON CONFLICT (service_code) DO NOTHING`,
      [code],
    );
  }

  // Always ensure PayPal is enabled (upsert for existing DBs)
  await pool.query(
    `INSERT INTO sim_enabled_services (service_code, enabled) VALUES ('pp', TRUE)
     ON CONFLICT (service_code) DO UPDATE SET enabled = TRUE`,
  );

}

export async function ensureSimSchema() {
  schemaReady ??= createSchema();
  try {
    await schemaReady;
  } catch (error) {
    schemaReady = null;
    throw error;
  }
}
