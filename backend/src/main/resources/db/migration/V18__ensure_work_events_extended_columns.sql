-- Ensure work_events schema matches current WorkEvent entity and repository queries.

ALTER TABLE IF EXISTS public.work_events
    ADD COLUMN IF NOT EXISTS status varchar(20),
    ADD COLUMN IF NOT EXISTS priority varchar(20),
    ADD COLUMN IF NOT EXISTS event_type varchar(50),
    ADD COLUMN IF NOT EXISTS is_online boolean,
    ADD COLUMN IF NOT EXISTS meeting_url varchar(1000),
    ADD COLUMN IF NOT EXISTS reminder_sent boolean,
    ADD COLUMN IF NOT EXISTS reminder_minutes_before int,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.work_events
SET status = 'SCHEDULED'
WHERE status IS NULL OR trim(status) = '';

UPDATE public.work_events
SET priority = 'MEDIUM'
WHERE priority IS NULL OR trim(priority) = '';

UPDATE public.work_events
SET is_online = false
WHERE is_online IS NULL;

UPDATE public.work_events
SET reminder_sent = false
WHERE reminder_sent IS NULL;

UPDATE public.work_events
SET reminder_minutes_before = 15
WHERE reminder_minutes_before IS NULL OR reminder_minutes_before < 0;

UPDATE public.work_events
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE IF EXISTS public.work_events
    ALTER COLUMN status SET DEFAULT 'SCHEDULED',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN priority SET DEFAULT 'MEDIUM',
    ALTER COLUMN priority SET NOT NULL,
    ALTER COLUMN is_online SET DEFAULT false,
    ALTER COLUMN reminder_sent SET DEFAULT false,
    ALTER COLUMN reminder_minutes_before SET DEFAULT 15;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_events_status_allowed'
    ) THEN
        ALTER TABLE public.work_events
        ADD CONSTRAINT chk_work_events_status_allowed
        CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_events_priority_allowed'
    ) THEN
        ALTER TABLE public.work_events
        ADD CONSTRAINT chk_work_events_priority_allowed
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_events_reminder_non_negative'
    ) THEN
        ALTER TABLE public.work_events
        ADD CONSTRAINT chk_work_events_reminder_non_negative
        CHECK (reminder_minutes_before >= 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_work_events_status
    ON public.work_events (status);

CREATE INDEX IF NOT EXISTS idx_work_events_user_status_start
    ON public.work_events (user_id, status, start_time);
