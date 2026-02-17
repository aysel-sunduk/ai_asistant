CREATE TABLE IF NOT EXISTS finance_metal_symbols (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    display_name text NOT NULL,
    collectapi_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_metal_symbols_active_order
    ON finance_metal_symbols (is_active, sort_order, created_at);

INSERT INTO finance_metal_symbols (code, display_name, collectapi_name, is_active, sort_order)
VALUES
    ('GOLD_GRAM', 'Gram Altin', 'Gram Altın', true, 10),
    ('GOLD_CEYREK', 'Ceyrek Altin', 'Çeyrek Altın', true, 20),
    ('GOLD_YARIM', 'Yarim Altin', 'Yarım Altın', true, 30),
    ('GOLD_CUMHURIYET', 'Cumhuriyet Altini', 'Cumhuriyet Altını', true, 40),
    ('GOLD_ATA', 'Ata Altin', 'Ata Altın', true, 50),
    ('SILVER_GRAM', 'Gumus Gram', 'Gümüş', true, 60)
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    collectapi_name = EXCLUDED.collectapi_name,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
