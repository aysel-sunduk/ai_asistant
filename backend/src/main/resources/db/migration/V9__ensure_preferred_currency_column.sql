-- Ensure preferred_currency exists as varchar/text for user_profiles
-- Generated: 2026-02-12

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferred_currency'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferred_currency varchar(32) DEFAULT 'TRY';
    ELSE
        -- If the column exists but has different type, try to cast safely
        PERFORM 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferred_currency' AND data_type IN ('character varying','text');
        IF NOT FOUND THEN
            -- attempt safe type conversion
            EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN preferred_currency TYPE varchar(32) USING preferred_currency::text';
        END IF;
    END IF;
END $$;
