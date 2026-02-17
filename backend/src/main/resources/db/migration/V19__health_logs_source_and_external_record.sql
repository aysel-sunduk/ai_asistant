-- Add source and external id support for mobile/wearable health sync.

ALTER TABLE IF EXISTS public.health_logs
    ADD COLUMN IF NOT EXISTS source varchar(32);

ALTER TABLE IF EXISTS public.health_logs
    ADD COLUMN IF NOT EXISTS external_record_id varchar(128);

UPDATE public.health_logs
SET source = 'manual'
WHERE source IS NULL OR length(trim(source)) = 0;

ALTER TABLE IF EXISTS public.health_logs
    ALTER COLUMN source SET DEFAULT 'manual';

ALTER TABLE IF EXISTS public.health_logs
    ALTER COLUMN source SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_logs_source_allowed'
    ) THEN
        ALTER TABLE public.health_logs
        ADD CONSTRAINT chk_health_logs_source_allowed
        CHECK (source IN ('manual', 'mobile_device', 'apple_health', 'google_fit', 'other'));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_health_logs_user_external_record
    ON public.health_logs (user_id, external_record_id)
    WHERE external_record_id IS NOT NULL AND length(trim(external_record_id)) > 0;
