-- Keep only TRY-based FX rows to align with application base currency strategy.

UPDATE public.currency_rates
SET base_currency = upper(trim(base_currency))
WHERE base_currency IS NOT NULL;

UPDATE public.currency_rates_latest
SET base_currency = upper(trim(base_currency))
WHERE base_currency IS NOT NULL;

DELETE FROM public.currency_rates
WHERE base_currency IS NULL OR base_currency <> 'TRY';

DELETE FROM public.currency_rates_latest
WHERE base_currency IS NULL OR base_currency <> 'TRY';

ALTER TABLE public.currency_rates
ALTER COLUMN base_currency SET DEFAULT 'TRY';

ALTER TABLE public.currency_rates_latest
ALTER COLUMN base_currency SET DEFAULT 'TRY';
