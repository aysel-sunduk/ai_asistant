-- Popular and favorite currency support for finance dashboard.

CREATE TABLE IF NOT EXISTS finance_popular_currencies (
    id uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
    currency_code varchar(10) NOT NULL UNIQUE,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_popular_currencies_active_order
    ON finance_popular_currencies (is_active, sort_order, created_at);

CREATE TABLE IF NOT EXISTS finance_user_favorite_currencies (
    id uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    currency_code varchar(10) NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_finance_user_favorite_currency UNIQUE (user_id, currency_code)
);

CREATE INDEX IF NOT EXISTS idx_finance_user_favorite_user_order
    ON finance_user_favorite_currencies (user_id, sort_order, created_at);

INSERT INTO finance_popular_currencies (currency_code, sort_order, is_active)
VALUES
    ('USD', 1, true),
    ('EUR', 2, true),
    ('GBP', 3, true),
    ('TRY', 4, true)
ON CONFLICT (currency_code) DO NOTHING;
