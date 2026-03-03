UPDATE public.currency_rates_latest
SET change_rate = 0
WHERE change_rate IS NULL;

UPDATE public.currency_rates
SET change_rate = 0
WHERE change_rate IS NULL;

ALTER TABLE IF EXISTS public.currency_rates_latest
    ALTER COLUMN change_rate SET DEFAULT 0;

ALTER TABLE IF EXISTS public.currency_rates
    ALTER COLUMN change_rate SET DEFAULT 0;
