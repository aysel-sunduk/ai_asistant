-- Enforce Turkey top 5 popular currencies for finance dashboard.
-- Active list: USD, EUR, GBP, CHF, SAR

UPDATE finance_popular_currencies
SET is_active = false,
    updated_at = now();

INSERT INTO finance_popular_currencies (currency_code, sort_order, is_active)
VALUES
    ('USD', 1, true),
    ('EUR', 2, true),
    ('GBP', 3, true),
    ('CHF', 4, true),
    ('SAR', 5, true)
ON CONFLICT (currency_code) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now();
