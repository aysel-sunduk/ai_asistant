-- ============================================================
-- AI Asistan – Optimize Veritabanı Şeması (PostgreSQL 16)
-- 28 tablo → 18 tablo (JSONB ile birleştirme)
-- Güncelleme: GIN Index & Performans Optimizasyonu
-- Oluşturma tarihi: 2026-02-10
-- ============================================================

-- ============================================================
-- GEREKLİ EXTENSION'LAR
-- ============================================================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ┌──────────────────────────────────────────────────────────┐
-- │                      ENUM TÜRLERİ                        │
-- └──────────────────────────────────────────────────────────┘
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
        CREATE TYPE "currency_code" AS ENUM ('TRY','USD','EUR','GBP');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_key') THEN
        CREATE TYPE "module_key" AS ENUM (
            'work','family','health','finance','goals',
            'blog','social','games','shopping','dashboard','ai'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_feature_key') THEN
        CREATE TYPE "ai_feature_key" AS ENUM (
            'daily_suggestion','diet_plan','mail_draft',
            'blog_cleaner','investment_insights'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_channel') THEN
        CREATE TYPE "reminder_channel" AS ENUM ('in_app','email','push','sms');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
        CREATE TYPE "reminder_status" AS ENUM ('scheduled','sent','skipped','canceled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
        CREATE TYPE "visibility" AS ENUM ('private','followers','public');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'txn_type') THEN
        CREATE TYPE "txn_type" AS ENUM ('income','expense');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_log_type') THEN
        CREATE TYPE "health_log_type" AS ENUM ('daily_summary','water','exercise','meal');
    END IF;
END $$;

-- ============================================================
-- TABLO YAPILARI (1-18)
-- ============================================================

-- 1) users
CREATE TABLE IF NOT EXISTS "users" (
    "id"                uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "email"             citext      UNIQUE NOT NULL,
    "password_hash"     text        NOT NULL,
    "is_email_verified" boolean     NOT NULL DEFAULT false,
    "is_active"         boolean     NOT NULL DEFAULT true,
    "role"              text        NOT NULL DEFAULT 'user',
    "created_at"        timestamptz NOT NULL DEFAULT (now()),
    "updated_at"        timestamptz NOT NULL DEFAULT (now()),
    "deleted_at"        timestamptz
);

-- 2) refresh_tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id"          uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"     uuid        NOT NULL,
    "token_hash"  text        NOT NULL,
    "device_info" text,
    "ip_address"  inet,
    "is_revoked"  boolean     NOT NULL DEFAULT false,
    "expires_at"  timestamptz NOT NULL,
    "created_at"  timestamptz NOT NULL DEFAULT (now())
);

-- 3) user_profiles (JSONB GIN Index eklendi)
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "user_id"                       uuid          PRIMARY KEY,
    "full_name"                     text,
    "birth_date"                    date,
    "gender"                        text,
    "timezone"                      text          NOT NULL DEFAULT 'Europe/Istanbul',
    "locale"                        text          NOT NULL DEFAULT 'tr-TR',
    "height_cm"                     int,
    "weight_kg"                     numeric(5,2),
    "preferred_currency"            currency_code NOT NULL DEFAULT 'TRY',
    "monthly_income_estimate_minor" bigint,
    "interests"                     jsonb,
    "onboarding"                    jsonb,
    "notifications"                 jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}',
    "updated_at"                    timestamptz   NOT NULL DEFAULT (now())
);

-- 4) follows
CREATE TABLE IF NOT EXISTS "follows" (
    "follower_id"  uuid        NOT NULL,
    "following_id" uuid        NOT NULL,
    "created_at"   timestamptz DEFAULT (now()),
    PRIMARY KEY ("follower_id", "following_id")
);

-- 5) finance_accounts
CREATE TABLE IF NOT EXISTS "finance_accounts" (
    "id"         uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"    uuid          NOT NULL,
    "name"       text          NOT NULL,
    "currency"   currency_code DEFAULT 'TRY',
    "created_at" timestamptz   DEFAULT (now())
);

-- 6) finance_categories
CREATE TABLE IF NOT EXISTS "finance_categories" (
    "id"      uuid     PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id" uuid     NOT NULL,
    "name"    text     NOT NULL,
    "kind"    txn_type NOT NULL
);

-- 7) finance_transactions
CREATE TABLE IF NOT EXISTS "finance_transactions" (
    "id"           uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"      uuid          NOT NULL,
    "account_id"   uuid          NOT NULL,
    "category_id"  uuid,
    "type"         txn_type      NOT NULL,
    "amount_minor" bigint        NOT NULL,
    "currency"     currency_code DEFAULT 'TRY',
    "occurred_on"  date          NOT NULL DEFAULT CURRENT_DATE,
    "note"         text,
    "created_at"   timestamptz   DEFAULT (now())
);

-- 8) investments
CREATE TABLE IF NOT EXISTS "investments" (
    "id"             uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"        uuid          NOT NULL,
    "asset_type"     text          NOT NULL,
    "symbol"         text          NOT NULL,
    "quantity"       numeric(24,8) NOT NULL DEFAULT 0,
    "avg_cost_minor" bigint        DEFAULT 0,
    "currency"       currency_code DEFAULT 'TRY',
    "updated_at"     timestamptz   DEFAULT (now())
);

-- 9) work_events
CREATE TABLE IF NOT EXISTS "work_events" (
    "id"                uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"           uuid        NOT NULL,
    "title"             text        NOT NULL,
    "description"       text,
    "start_time"        timestamptz NOT NULL,
    "end_time"          timestamptz NOT NULL,
    "participant_count" int         DEFAULT 0,
    "location"          text,
    "metadata"          jsonb,
    "created_at"        timestamptz DEFAULT (now())
);

-- 10) reminders
CREATE TABLE IF NOT EXISTS "reminders" (
    "id"            uuid             PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"       uuid             NOT NULL,
    "work_event_id" uuid,
    "contact_id"    uuid,
    "source_module" module_key,
    "title"         text             NOT NULL,
    "remind_at"     timestamptz      NOT NULL,
    "recurrence"    text,
    "channel"       reminder_channel DEFAULT 'in_app',
    "status"        reminder_status  DEFAULT 'scheduled'
);

-- 11) health_logs (GIN Index eklendi)
CREATE TABLE IF NOT EXISTS "health_logs" (
    "id"        uuid            PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"   uuid            NOT NULL,
    "log_type"  health_log_type NOT NULL,
    "log_date"  date            NOT NULL DEFAULT CURRENT_DATE,
    "data"      jsonb           NOT NULL DEFAULT '{}',
    "logged_at" timestamptz     NOT NULL DEFAULT (now())
);

-- 12) contacts
CREATE TABLE IF NOT EXISTS "contacts" (
    "id"              uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"         uuid        NOT NULL,
    "name"            text        NOT NULL,
    "relationship"    text,
    "birth_date"      date,
    "phone"           text,
    "email"           text,
    "important_dates" jsonb,
    "notes"           text,
    "created_at"      timestamptz DEFAULT (now())
);

-- 13) goals (Milestones JSONB arama desteği eklendi)
CREATE TABLE IF NOT EXISTS "goals" (
    "id"           uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"      uuid        NOT NULL,
    "title"        text        NOT NULL,
    "description"  text,
    "category"     text,
    "target_date"  date,
    "progress_pct" int         DEFAULT 0 CHECK ("progress_pct" BETWEEN 0 AND 100),
    "is_completed" boolean     DEFAULT false,
    "milestones"   jsonb       DEFAULT '[]',
    "created_at"   timestamptz DEFAULT (now()),
    "updated_at"   timestamptz DEFAULT (now())
);

-- 14) shopping_lists
CREATE TABLE IF NOT EXISTS "shopping_lists" (
    "id"          uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"     uuid        NOT NULL,
    "name"        text        NOT NULL DEFAULT 'Alışveriş Listem',
    "is_archived" boolean     DEFAULT false,
    "created_at"  timestamptz DEFAULT (now())
);

-- 15) shopping_items
CREATE TABLE IF NOT EXISTS "shopping_items" (
    "id"                    uuid    PRIMARY KEY DEFAULT (gen_random_uuid()),
    "list_id"               uuid    NOT NULL,
    "name"                  text    NOT NULL,
    "quantity"              int     DEFAULT 1,
    "unit"                  text,
    "estimated_price_minor" bigint,
    "is_checked"            boolean DEFAULT false,
    "note"                  text
);

-- 16) game_scores
CREATE TABLE IF NOT EXISTS "game_scores" (
    "id"           uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"      uuid        NOT NULL,
    "game_key"     text        NOT NULL,
    "score"        int         NOT NULL,
    "difficulty"   text,
    "duration_sec" int,
    "metadata"     jsonb,
    "played_at"    timestamptz DEFAULT (now())
);

-- 17) blog_posts
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id"            uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"       uuid        NOT NULL,
    "title"         text        NOT NULL,
    "raw_content"   text        NOT NULL,
    "clean_content" text,
    "visibility"    visibility  DEFAULT 'private',
    "status"        text        DEFAULT 'draft',
    "tags"          text[],
    "like_count"    int         DEFAULT 0,
    "comments"      jsonb       DEFAULT '[]',
    "created_at"    timestamptz DEFAULT (now()),
    "updated_at"    timestamptz DEFAULT (now())
);

-- 18) ai_interactions
CREATE TABLE IF NOT EXISTS "ai_interactions" (
    "id"               uuid           PRIMARY KEY DEFAULT (gen_random_uuid()),
    "user_id"          uuid           NOT NULL,
    "feature_key"      ai_feature_key NOT NULL,
    "module"           module_key,
    "prompt_summary"   text,
    "response_summary" text,
    "tokens_used"      int,
    "rating"           int CHECK ("rating" BETWEEN 1 AND 5),
    "created_at"       timestamptz    DEFAULT (now())
);

-- ============================================================
-- İNDEKSLER (STANDART & JSONB GIN)
-- ============================================================

-- Standart B-Tree İndeksler
CREATE UNIQUE INDEX IF NOT EXISTS "ux_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_expires" ON "refresh_tokens" ("user_id", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_follows_following" ON "follows" ("following_id");
CREATE INDEX IF NOT EXISTS "idx_finance_accounts_user" ON "finance_accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_finance_categories_user_kind" ON "finance_categories" ("user_id", "kind");
CREATE INDEX IF NOT EXISTS "idx_finance_tx_user_date" ON "finance_transactions" ("user_id", "occurred_on");
CREATE INDEX IF NOT EXISTS "idx_finance_tx_account" ON "finance_transactions" ("account_id");
CREATE INDEX IF NOT EXISTS "idx_investments_user" ON "investments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_work_events_user_start" ON "work_events" ("user_id", "start_time");
CREATE INDEX IF NOT EXISTS "idx_reminders_upcoming" ON "reminders" ("user_id", "remind_at") WHERE "status" = 'scheduled';
CREATE INDEX IF NOT EXISTS "idx_health_logs_user_date" ON "health_logs" ("user_id", "log_date", "log_type");
CREATE INDEX IF NOT EXISTS "idx_contacts_user" ON "contacts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_goals_user" ON "goals" ("user_id", "is_completed");
CREATE INDEX IF NOT EXISTS "idx_shopping_lists_user_archived" ON "shopping_lists" ("user_id", "is_archived");
CREATE INDEX IF NOT EXISTS "idx_shopping_items_list" ON "shopping_items" ("list_id", "is_checked");
CREATE INDEX IF NOT EXISTS "idx_game_scores_leaderboard" ON "game_scores" ("game_key", "score" DESC);
CREATE INDEX IF NOT EXISTS "idx_blog_posts_user" ON "blog_posts" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_ai_interactions_user" ON "ai_interactions" ("user_id", "created_at" DESC);

-- GIN Index (JSONB İçerisinde Arama Performansı İçin)
CREATE INDEX IF NOT EXISTS "idx_user_profiles_notifications_gin" ON "user_profiles" USING GIN ("notifications");
CREATE INDEX IF NOT EXISTS "idx_health_logs_data_gin" ON "health_logs" USING GIN ("data");
CREATE INDEX IF NOT EXISTS "idx_goals_milestones_gin" ON "goals" USING GIN ("milestones");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_comments_gin" ON "blog_posts" USING GIN ("comments");

-- ============================================================
-- FOREIGN KEY İLİŞKİLERİ (DO $$ GÜVENLİĞİ İLE)
-- ============================================================

DO $$
BEGIN
    -- Auth & Profile
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refresh_tokens_user') THEN
        ALTER TABLE "refresh_tokens" ADD CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_profiles_user') THEN
        ALTER TABLE "user_profiles" ADD CONSTRAINT "fk_user_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;

    -- Sosyal
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_follows_follower') THEN
        ALTER TABLE "follows" ADD CONSTRAINT "fk_follows_follower" FOREIGN KEY ("follower_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_follows_following') THEN
        ALTER TABLE "follows" ADD CONSTRAINT "fk_follows_following" FOREIGN KEY ("following_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;

    -- Finans
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_accounts_user') THEN
        ALTER TABLE "finance_accounts" ADD CONSTRAINT "fk_finance_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_categories_user') THEN
        ALTER TABLE "finance_categories" ADD CONSTRAINT "fk_finance_categories_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_transactions_user') THEN
        ALTER TABLE "finance_transactions" ADD CONSTRAINT "fk_finance_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_transactions_account') THEN
        ALTER TABLE "finance_transactions" ADD CONSTRAINT "fk_finance_transactions_account" FOREIGN KEY ("account_id") REFERENCES "finance_accounts" ("id") ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_transactions_category') THEN
        ALTER TABLE "finance_transactions" ADD CONSTRAINT "fk_finance_transactions_category" FOREIGN KEY ("category_id") REFERENCES "finance_categories" ("id") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_investments_user') THEN
        ALTER TABLE "investments" ADD CONSTRAINT "fk_investments_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;

    -- İş & Hatırlatıcı
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_work_events_user') THEN
        ALTER TABLE "work_events" ADD CONSTRAINT "fk_work_events_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reminders_user') THEN
        ALTER TABLE "reminders" ADD CONSTRAINT "fk_reminders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reminders_work_event') THEN
        ALTER TABLE "reminders" ADD CONSTRAINT "fk_reminders_work_event" FOREIGN KEY ("work_event_id") REFERENCES "work_events" ("id") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reminders_contact') THEN
        ALTER TABLE "reminders" ADD CONSTRAINT "fk_reminders_contact" FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") ON DELETE SET NULL;
    END IF;

    -- Diğer Modüller
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_health_logs_user') THEN
        ALTER TABLE "health_logs" ADD CONSTRAINT "fk_health_logs_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_contacts_user') THEN
        ALTER TABLE "contacts" ADD CONSTRAINT "fk_contacts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_goals_user') THEN
        ALTER TABLE "goals" ADD CONSTRAINT "fk_goals_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_shopping_lists_user') THEN
        ALTER TABLE "shopping_lists" ADD CONSTRAINT "fk_shopping_lists_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_shopping_items_list') THEN
        ALTER TABLE "shopping_items" ADD CONSTRAINT "fk_shopping_items_list" FOREIGN KEY ("list_id") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_game_scores_user') THEN
        ALTER TABLE "game_scores" ADD CONSTRAINT "fk_game_scores_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_user') THEN
        ALTER TABLE "blog_posts" ADD CONSTRAINT "fk_blog_posts_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ai_interactions_user') THEN
        ALTER TABLE "ai_interactions" ADD CONSTRAINT "fk_ai_interactions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- ŞEMA SONU — 18 TABLO
-- ============================================================