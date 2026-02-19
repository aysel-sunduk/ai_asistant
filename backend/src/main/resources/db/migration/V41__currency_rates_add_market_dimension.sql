ALTER TABLE public.currency_rates
ADD COLUMN IF NOT EXISTS market varchar(32);

ALTER TABLE public.currency_rates_latest
ADD COLUMN IF NOT EXISTS market varchar(32);

UPDATE public.currency_rates cr
SET market = CASE
    WHEN EXISTS (
        SELECT 1
        FROM public.finance_metal_symbols fms
        WHERE upper(fms.code) = upper(cr.currency_code)
          AND fms.is_active = true
    ) THEN 'metals'
    ELSE 'fx'
END
WHERE cr.market IS NULL OR cr.market = '';

UPDATE public.currency_rates_latest crl
SET market = CASE
    WHEN EXISTS (
        SELECT 1
        FROM public.finance_metal_symbols fms
        WHERE upper(fms.code) = upper(crl.currency_code)
          AND fms.is_active = true
    ) THEN 'metals'
    ELSE 'fx'
END
WHERE crl.market IS NULL OR crl.market = '';

ALTER TABLE public.currency_rates
    ALTER COLUMN market SET NOT NULL;

ALTER TABLE public.currency_rates_latest
    ALTER COLUMN market SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_currency_rates_latest_base_code'
    ) THEN
        ALTER TABLE public.currency_rates_latest
            DROP CONSTRAINT uq_currency_rates_latest_base_code;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_currency_rates_latest_base_code_market'
    ) THEN
        ALTER TABLE public.currency_rates_latest
            ADD CONSTRAINT uq_currency_rates_latest_base_code_market UNIQUE (base_currency, currency_code, market);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_currency_rates_code_base_market_date
    ON public.currency_rates (currency_code, base_currency, market, rate_date DESC);

CREATE INDEX IF NOT EXISTS idx_currency_rates_latest_base_market_code
    ON public.currency_rates_latest (base_currency, market, currency_code);
