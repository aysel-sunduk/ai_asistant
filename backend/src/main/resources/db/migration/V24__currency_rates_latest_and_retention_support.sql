CREATE TABLE IF NOT EXISTS currency_rates_latest (
    id uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
    base_currency varchar(10) NOT NULL,
    currency_code varchar(10) NOT NULL,
    rate numeric(19,4) NOT NULL,
    change_rate numeric(10,4),
    provider_timestamp timestamptz,
    rate_date timestamp NOT NULL,
    source varchar(50),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_currency_rates_latest_base_code UNIQUE (base_currency, currency_code)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_latest_base
    ON currency_rates_latest (base_currency, currency_code);

INSERT INTO currency_rates_latest (
    base_currency,
    currency_code,
    rate,
    change_rate,
    provider_timestamp,
    rate_date,
    source,
    created_at,
    updated_at
)
SELECT
    x.base_currency,
    x.currency_code,
    x.rate,
    x.change_rate,
    x.provider_timestamp,
    x.rate_date,
    x.source,
    COALESCE(x.created_at, now()),
    now()
FROM (
    SELECT DISTINCT ON (base_currency, currency_code)
        base_currency,
        currency_code,
        rate,
        change_rate,
        provider_timestamp,
        rate_date,
        source,
        created_at
    FROM currency_rates
    WHERE base_currency IS NOT NULL
    ORDER BY base_currency, currency_code, rate_date DESC, created_at DESC NULLS LAST
) x
ON CONFLICT (base_currency, currency_code) DO UPDATE
SET
    rate = EXCLUDED.rate,
    change_rate = EXCLUDED.change_rate,
    provider_timestamp = EXCLUDED.provider_timestamp,
    rate_date = EXCLUDED.rate_date,
    source = EXCLUDED.source,
    updated_at = now();
