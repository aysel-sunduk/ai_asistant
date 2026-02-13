-- Enforce string-based columns for fields that previously used postgres enum types.
-- Safe for mixed environments: each block is guarded and idempotent.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'currency_rates' AND column_name = 'currency_code'
    ) THEN
        EXECUTE 'ALTER TABLE public.currency_rates ALTER COLUMN currency_code DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.currency_rates ALTER COLUMN currency_code TYPE varchar(32) USING currency_code::text';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'currency_rates' AND column_name = 'base_currency'
    ) THEN
        EXECUTE 'ALTER TABLE public.currency_rates ALTER COLUMN base_currency DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.currency_rates ALTER COLUMN base_currency TYPE varchar(32) USING base_currency::text';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'investments' AND column_name = 'currency'
    ) THEN
        EXECUTE 'ALTER TABLE public.investments ALTER COLUMN currency DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.investments ALTER COLUMN currency TYPE varchar(32) USING currency::text';
        EXECUTE 'ALTER TABLE public.investments ALTER COLUMN currency SET DEFAULT ''TRY''';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'preferred_currency'
    ) THEN
        EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN preferred_currency DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN preferred_currency TYPE varchar(32) USING preferred_currency::text';
        EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN preferred_currency SET DEFAULT ''TRY''';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'finance_transactions' AND column_name = 'type'
    ) THEN
        EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN type DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN type TYPE varchar(32) USING type::text';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'finance_transactions' AND column_name = 'currency'
    ) THEN
        EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency TYPE varchar(32) USING currency::text';
        EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency SET DEFAULT ''TRY''';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'family_transactions' AND column_name = 'type'
    ) THEN
        EXECUTE 'ALTER TABLE public.family_transactions ALTER COLUMN type TYPE varchar(32) USING type::text';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'family_transactions' AND column_name = 'currency'
    ) THEN
        EXECUTE 'ALTER TABLE public.family_transactions ALTER COLUMN currency TYPE varchar(32) USING currency::text';
        EXECUTE 'ALTER TABLE public.family_transactions ALTER COLUMN currency SET DEFAULT ''TRY''';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'source_module'
    ) THEN
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN source_module DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN source_module TYPE varchar(64) USING source_module::text';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'channel'
    ) THEN
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN channel DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN channel TYPE varchar(64) USING channel::text';
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN channel SET DEFAULT ''in_app''';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'status'
    ) THEN
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN status DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN status TYPE varchar(64) USING status::text';
        EXECUTE 'ALTER TABLE public.reminders ALTER COLUMN status SET DEFAULT ''scheduled''';
    END IF;
END $$;
