-- Strengthen live-rate persistence lookups.

CREATE INDEX IF NOT EXISTS idx_currency_rates_code_base_date
    ON currency_rates (currency_code, base_currency, rate_date DESC);

CREATE INDEX IF NOT EXISTS idx_currency_rates_rate_date
    ON currency_rates (rate_date DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_currency_rates_latest_base_code'
    ) THEN
        ALTER TABLE currency_rates_latest
            ADD CONSTRAINT uq_currency_rates_latest_base_code UNIQUE (base_currency, currency_code);
    END IF;
END $$;
