-- Convert Postgres ENUM columns to VARCHAR to avoid enum-related runtime errors
-- Generated: 2026-02-12

-- NOTE: Review this file before applying to production. Run on a copy/backup first.

-- 1) Drop defaults where necessary, convert type using ::text, then restore sensible defaults

-- user_profiles.preferred_currency
-- user_profiles.preferred_currency (guarded)
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

-- currency_rates.currency_code
-- currency_rates.currency_code (guarded)
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

-- finance_accounts.currency
-- finance_accounts.currency (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'finance_accounts' AND column_name = 'currency'
	) THEN
		EXECUTE 'ALTER TABLE public.finance_accounts ALTER COLUMN currency DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.finance_accounts ALTER COLUMN currency TYPE varchar(32) USING currency::text';
		EXECUTE 'ALTER TABLE public.finance_accounts ALTER COLUMN currency SET DEFAULT ''TRY''';
	END IF;
END $$;

-- finance_categories.kind
-- finance_categories.kind (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'finance_categories' AND column_name = 'kind'
	) THEN
		EXECUTE 'ALTER TABLE public.finance_categories ALTER COLUMN kind DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.finance_categories ALTER COLUMN kind TYPE varchar(32) USING kind::text';
	END IF;
END $$;

-- finance_transactions.type
-- finance_transactions.type (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'finance_transactions' AND column_name = 'type'
	) THEN
		EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN type DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN type TYPE varchar(32) USING type::text';
	END IF;
END $$;

-- finance_transactions.currency
-- finance_transactions.currency (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'finance_transactions' AND column_name = 'currency'
	) THEN
		EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency TYPE varchar(32) USING currency::text';
		EXECUTE 'ALTER TABLE public.finance_transactions ALTER COLUMN currency SET DEFAULT ''TRY''';
	END IF;
END $$;

-- investments.currency
-- investments.currency (guarded)
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

-- reminders.source_module, channel, status
-- reminders.source_module, channel, status (guarded)
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

-- health_logs.log_type
-- health_logs.log_type (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'health_logs' AND column_name = 'log_type'
	) THEN
		EXECUTE 'ALTER TABLE public.health_logs ALTER COLUMN log_type DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.health_logs ALTER COLUMN log_type TYPE varchar(64) USING log_type::text';
	END IF;
END $$;

-- blog_posts.visibility
-- blog_posts.visibility (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'visibility'
	) THEN
		EXECUTE 'ALTER TABLE public.blog_posts ALTER COLUMN visibility DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.blog_posts ALTER COLUMN visibility TYPE varchar(32) USING visibility::text';
		EXECUTE 'ALTER TABLE public.blog_posts ALTER COLUMN visibility SET DEFAULT ''private''';
	END IF;
END $$;

-- ai_interactions.feature_key, module
-- ai_interactions.feature_key, module (guarded)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'ai_interactions' AND column_name = 'feature_key'
	) THEN
		EXECUTE 'ALTER TABLE public.ai_interactions ALTER COLUMN feature_key DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.ai_interactions ALTER COLUMN feature_key TYPE varchar(128) USING feature_key::text';
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'ai_interactions' AND column_name = 'module'
	) THEN
		EXECUTE 'ALTER TABLE public.ai_interactions ALTER COLUMN module DROP DEFAULT';
		EXECUTE 'ALTER TABLE public.ai_interactions ALTER COLUMN module TYPE varchar(64) USING module::text';
	END IF;
END $$;


-- NOTE: Do NOT drop enum types automatically here — dropping types can fail
-- when dependent objects (casts, constraints) still exist. Leave old enum
-- types in place to avoid accidental cascade deletions. If you want to remove
-- them later, review dependencies and run manual DROP TYPE ... CASCADE with
-- caution on a maintenance window.

-- End of migration
