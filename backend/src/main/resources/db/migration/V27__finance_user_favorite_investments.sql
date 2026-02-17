-- Favorite investments support for finance module.

CREATE TABLE IF NOT EXISTS finance_user_favorite_investments (
    id uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    investment_id uuid NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_finance_user_favorite_investment UNIQUE (user_id, investment_id)
);

CREATE INDEX IF NOT EXISTS idx_finance_user_favorite_investments_user_order
    ON finance_user_favorite_investments (user_id, sort_order, created_at);
