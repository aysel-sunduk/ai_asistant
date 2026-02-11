-- Store base currency and provider timestamp for external FX rates.

ALTER TABLE currency_rates
ADD COLUMN IF NOT EXISTS base_currency varchar(10);

ALTER TABLE currency_rates
ADD COLUMN IF NOT EXISTS provider_timestamp timestamptz;

CREATE INDEX IF NOT EXISTS idx_currency_rates_base_code_date
    ON currency_rates (base_currency, currency_code, rate_date DESC);
