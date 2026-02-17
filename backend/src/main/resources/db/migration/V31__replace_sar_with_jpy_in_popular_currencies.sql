-- AlphaVantage CURRENCY_EXCHANGE_RATE endpoint does not serve SAR/TRY reliably.
-- Keep top 5 as USD, EUR, GBP, CHF, JPY.

UPDATE finance_popular_currencies
SET is_active = false,
    updated_at = now();

INSERT INTO finance_popular_currencies (currency_code, sort_order, is_active)
VALUES
    ('USD', 1, true),
    ('EUR', 2, true),
    ('GBP', 3, true),
    ('CHF', 4, true),
    ('JPY', 5, true)
ON CONFLICT (currency_code) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now();
