-- Enforce work event business rules at DB level.

UPDATE public.work_events
SET participant_count = 0
WHERE participant_count IS NULL OR participant_count < 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_events_participant_count_non_negative'
    ) THEN
        ALTER TABLE public.work_events
        ADD CONSTRAINT chk_work_events_participant_count_non_negative
        CHECK (participant_count >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_events_end_after_start'
    ) THEN
        ALTER TABLE public.work_events
        ADD CONSTRAINT chk_work_events_end_after_start
        CHECK (end_time > start_time);
    END IF;
END $$;
