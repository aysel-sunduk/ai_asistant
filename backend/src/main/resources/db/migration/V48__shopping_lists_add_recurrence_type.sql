-- Shopping listelerine tekrar/periyot tipi ekler (DAILY/WEEKLY/MONTHLY)
ALTER TABLE IF EXISTS public.shopping_lists
ADD COLUMN IF NOT EXISTS recurrence_type varchar(20);

UPDATE public.shopping_lists
SET recurrence_type = 'WEEKLY'
WHERE recurrence_type IS NULL OR btrim(recurrence_type) = '';

ALTER TABLE IF EXISTS public.shopping_lists
ALTER COLUMN recurrence_type SET DEFAULT 'WEEKLY';

ALTER TABLE IF EXISTS public.shopping_lists
ALTER COLUMN recurrence_type SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_shopping_lists_recurrence_type'
    ) THEN
        ALTER TABLE public.shopping_lists
        ADD CONSTRAINT chk_shopping_lists_recurrence_type
        CHECK (recurrence_type IN ('DAILY', 'WEEKLY', 'MONTHLY'));
    END IF;
END$$;
