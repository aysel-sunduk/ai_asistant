-- Stabilize reminders schema and prevent invalid string values.

ALTER TABLE IF EXISTS public.reminders
    ALTER COLUMN source_module TYPE varchar(64) USING source_module::text,
    ALTER COLUMN channel TYPE varchar(64) USING channel::text,
    ALTER COLUMN status TYPE varchar(64) USING status::text,
    ALTER COLUMN recurrence TYPE varchar(64) USING recurrence::text;

ALTER TABLE IF EXISTS public.reminders
    ALTER COLUMN source_module SET DEFAULT 'general',
    ALTER COLUMN channel SET DEFAULT 'in_app',
    ALTER COLUMN status SET DEFAULT 'scheduled',
    ALTER COLUMN recurrence SET DEFAULT 'none';

UPDATE public.reminders
SET source_module = 'general'
WHERE source_module IS NULL OR btrim(source_module) = '';

UPDATE public.reminders
SET source_module = lower(regexp_replace(btrim(source_module), '[-\s]+', '_', 'g'))
WHERE source_module IS NOT NULL;

UPDATE public.reminders
SET source_module = CASE
    WHEN source_module IN ('work_event', 'work_events', 'event', 'events') THEN 'work'
    WHEN source_module IN ('todo', 'task', 'tasks') THEN 'goals'
    WHEN source_module IN ('mail', 'email') THEN 'business'
    WHEN source_module IN ('family_module') THEN 'family'
    WHEN source_module IN ('finance_module') THEN 'finance'
    WHEN source_module IN ('health_module') THEN 'health'
    WHEN source_module IN ('social_module') THEN 'social'
    WHEN source_module IN ('shopping_module') THEN 'shopping'
    ELSE source_module
END;

UPDATE public.reminders
SET source_module = 'general'
WHERE source_module NOT IN ('general', 'business', 'work', 'family', 'health', 'finance', 'social', 'shopping', 'goals');

UPDATE public.reminders
SET channel = 'in_app'
WHERE channel IS NULL OR btrim(channel) = '';

UPDATE public.reminders
SET channel = lower(regexp_replace(btrim(channel), '[-\s]+', '_', 'g'))
WHERE channel IS NOT NULL;

UPDATE public.reminders
SET channel = CASE
    WHEN channel IN ('inapp', 'app') THEN 'in_app'
    ELSE channel
END;

UPDATE public.reminders
SET channel = 'in_app'
WHERE channel NOT IN ('in_app', 'email', 'push', 'sms');

UPDATE public.reminders
SET status = 'scheduled'
WHERE status IS NULL OR btrim(status) = '';

UPDATE public.reminders
SET status = lower(regexp_replace(btrim(status), '[-\s]+', '_', 'g'))
WHERE status IS NOT NULL;

UPDATE public.reminders
SET status = CASE
    WHEN status IN ('cancelled', 'canceled') THEN 'canceled'
    ELSE status
END;

UPDATE public.reminders
SET status = 'scheduled'
WHERE status NOT IN ('scheduled', 'sent', 'skipped', 'canceled');

UPDATE public.reminders
SET recurrence = 'none'
WHERE recurrence IS NULL OR btrim(recurrence) = '';

UPDATE public.reminders
SET recurrence = lower(regexp_replace(btrim(recurrence), '[-\s]+', '_', 'g'))
WHERE recurrence IS NOT NULL;

UPDATE public.reminders
SET recurrence = CASE
    WHEN recurrence IN ('no', 'once') THEN 'none'
    WHEN recurrence = 'weekday' THEN 'weekdays'
    ELSE recurrence
END;

UPDATE public.reminders
SET recurrence = 'none'
WHERE recurrence NOT IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'custom');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminders_source_module_allowed'
    ) THEN
        ALTER TABLE public.reminders
            ADD CONSTRAINT chk_reminders_source_module_allowed
            CHECK (source_module IN ('general', 'business', 'work', 'family', 'health', 'finance', 'social', 'shopping', 'goals'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminders_channel_allowed'
    ) THEN
        ALTER TABLE public.reminders
            ADD CONSTRAINT chk_reminders_channel_allowed
            CHECK (channel IN ('in_app', 'email', 'push', 'sms'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminders_status_allowed'
    ) THEN
        ALTER TABLE public.reminders
            ADD CONSTRAINT chk_reminders_status_allowed
            CHECK (status IN ('scheduled', 'sent', 'skipped', 'canceled'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminders_recurrence_allowed'
    ) THEN
        ALTER TABLE public.reminders
            ADD CONSTRAINT chk_reminders_recurrence_allowed
            CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'custom'));
    END IF;
END $$;
