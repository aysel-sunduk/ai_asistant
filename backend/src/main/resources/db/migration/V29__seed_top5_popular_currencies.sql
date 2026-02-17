INSERT INTO finance_popular_currencies (currency_code, sort_order, is_active)
VALUES
    ('USD', 1, true),
    ('EUR', 2, true),
    ('GBP', 3, true),
    ('JPY', 4, true),
    ('CHF', 5, true)
ON CONFLICT (currency_code) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now();
