-- ============================================================
-- AI Asistan – Optimize Veritabanı Şeması (PostgreSQL 16)
-- 28 tablo → 18 tablo (JSONB ile birleştirme)
-- Oluşturma tarihi: 2026-02-10
-- ============================================================

-- ============================================================
-- GEREKLİ EXTENSION'LAR
-- ============================================================
-- citext: case-insensitive email
-- pgcrypto: gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ┌──────────────────────────────────────────────────────────┐
-- │                      ENUM TÜRLERİ                       │
-- └──────────────────────────────────────────────────────────┘

DO $$
BEGIN
  -- currency_code
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
    CREATE TYPE "currency_code" AS ENUM ('TRY','USD','EUR','GBP');
  END IF;

  -- module_key
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_key') THEN
    CREATE TYPE "module_key" AS ENUM (
      'work','family','health','finance','goals',
      'blog','social','games','shopping','dashboard','ai'
    );
  END IF;

  -- ai_feature_key
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_feature_key') THEN
    CREATE TYPE "ai_feature_key" AS ENUM (
      'daily_suggestion','diet_plan','mail_draft',
      'blog_cleaner','investment_insights'
    );
  END IF;

  -- reminder_channel
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_channel') THEN
    CREATE TYPE "reminder_channel" AS ENUM ('in_app','email','push','sms');
  END IF;

  -- reminder_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE "reminder_status" AS ENUM ('scheduled','sent','skipped','canceled');
  END IF;

  -- visibility
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
    CREATE TYPE "visibility" AS ENUM ('private','followers','public');
  END IF;

  -- txn_type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'txn_type') THEN
    CREATE TYPE "txn_type" AS ENUM ('income','expense');
  END IF;

  -- health_log_type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_log_type') THEN
    CREATE TYPE "health_log_type" AS ENUM ('daily_summary','water','exercise','meal');
  END IF;
END $$;

-- ============================================================
-- 1) users  –  Kimlik & giriş
-- ============================================================
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

-- ============================================================
-- 2) refresh_tokens  –  JWT yenileme (DB’de sadece HASH saklanır)
-- ============================================================
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"          uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"     uuid        NOT NULL,
  "token_hash"  text        NOT NULL,
  "device_info" text,          -- Cihaz ve tarayıcı bilgisi
  "ip_address"  inet,
  "is_revoked"  boolean     NOT NULL DEFAULT false,
  "expires_at"  timestamptz NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT (now())
);

COMMENT ON COLUMN "refresh_tokens"."device_info" IS 'Cihaz ve tarayıcı bilgisi';
CREATE UNIQUE INDEX IF NOT EXISTS "ux_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_expires" ON "refresh_tokens" ("user_id", "expires_at");

-- ============================================================
-- 3) user_profiles  –  Profil + bildirim tercihleri (JSONB)
-- ============================================================
-- notification_preferences tablosu kaldırıldı; tercihler burada JSONB.
-- Örnek notifications JSONB:
--   {"email": true, "push": true, "sms": false, "quiet_start":"23:00","quiet_end":"07:00"}
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
  "interests"                     jsonb,         -- ["teknoloji","spor","yemek"]
  "onboarding"                    jsonb,
  "notifications"                 jsonb NOT NULL DEFAULT '{"email":true,"push":true,"sms":false}',
  "updated_at"                    timestamptz   NOT NULL DEFAULT (now())
);

-- ============================================================
-- 4) follows  –  Kullanıcılar arası takip
-- ============================================================
CREATE TABLE IF NOT EXISTS "follows" (
  "follower_id"  uuid        NOT NULL,
  "following_id" uuid        NOT NULL,
  "created_at"   timestamptz DEFAULT (now()),
  PRIMARY KEY ("follower_id", "following_id")
);

CREATE INDEX IF NOT EXISTS "idx_follows_following" ON "follows" ("following_id");

-- ============================================================
-- 5) finance_accounts  –  Hesaplar (Nakit, Banka vb.)
-- ============================================================
CREATE TABLE IF NOT EXISTS "finance_accounts" (
  "id"         uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"    uuid          NOT NULL,
  "name"       text          NOT NULL,  -- Örn: "Nakit", "Banka Hesabım"
  "currency"   currency_code DEFAULT 'TRY',
  "created_at" timestamptz   DEFAULT (now())
);

COMMENT ON COLUMN "finance_accounts"."name" IS 'Örn: Nakit, Banka Hesabım';
CREATE INDEX IF NOT EXISTS "idx_finance_accounts_user" ON "finance_accounts" ("user_id");

-- ============================================================
-- 6) finance_categories  –  Gelir / gider kategorileri
-- ============================================================
CREATE TABLE IF NOT EXISTS "finance_categories" (
  "id"      uuid     PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid     NOT NULL,
  "name"    text     NOT NULL,
  "kind"    txn_type NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_finance_categories_user_kind" ON "finance_categories" ("user_id", "kind");

-- ============================================================
-- 7) finance_transactions  –  Gelir / gider kayıtları
-- ============================================================
CREATE TABLE IF NOT EXISTS "finance_transactions" (
  "id"           uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"      uuid          NOT NULL,
  "account_id"   uuid          NOT NULL,
  "category_id"  uuid,
  "type"         txn_type      NOT NULL,
  "amount_minor" bigint        NOT NULL,  -- Tutar x 100 (10.50 TL → 1050)
  "currency"     currency_code DEFAULT 'TRY',
  "occurred_on"  date          NOT NULL DEFAULT CURRENT_DATE,
  "note"         text,
  "created_at"   timestamptz   DEFAULT (now())
);

COMMENT ON COLUMN "finance_transactions"."amount_minor" IS 'Tutar x 100 (Örn: 10.50 TL -> 1050)';
CREATE INDEX IF NOT EXISTS "idx_finance_tx_user_date" ON "finance_transactions" ("user_id", "occurred_on");
CREATE INDEX IF NOT EXISTS "idx_finance_tx_account"   ON "finance_transactions" ("account_id");
CREATE INDEX IF NOT EXISTS "idx_finance_tx_category"  ON "finance_transactions" ("category_id");

-- ============================================================
-- 8) investments  –  Yatırım portföyü
-- ============================================================
CREATE TABLE IF NOT EXISTS "investments" (
  "id"             uuid          PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"        uuid          NOT NULL,
  "asset_type"     text          NOT NULL,  -- hisse, kripto, altın, döviz
  "symbol"         text          NOT NULL,
  "quantity"       numeric(24,8) NOT NULL DEFAULT 0,
  "avg_cost_minor" bigint        DEFAULT 0,
  "currency"       currency_code DEFAULT 'TRY',
  "updated_at"     timestamptz   DEFAULT (now())
);

COMMENT ON COLUMN "investments"."asset_type" IS 'hisse, kripto, altın, döviz';
CREATE INDEX IF NOT EXISTS "idx_investments_user" ON "investments" ("user_id");

-- ============================================================
-- 9) work_events  –  Toplantı & iş etkinlikleri
-- ============================================================
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

CREATE INDEX IF NOT EXISTS "idx_work_events_user_start" ON "work_events" ("user_id", "start_time");

-- ============================================================
-- 10) reminders  –  Hatırlatıcılar (iş + aile + genel)
-- ============================================================
CREATE TABLE IF NOT EXISTS "reminders" (
  "id"            uuid             PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"       uuid             NOT NULL,
  "work_event_id" uuid,
  "contact_id"    uuid,             -- family_events yerine contacts'a bağlantı
  "source_module" module_key,       -- 'work', 'family', 'health' vb.
  "title"         text             NOT NULL,
  "remind_at"     timestamptz      NOT NULL,
  "recurrence"    text,             -- 'yearly', 'monthly', 'weekly', NULL
  "channel"       reminder_channel DEFAULT 'in_app',
  "status"        reminder_status  DEFAULT 'scheduled'
);

CREATE INDEX IF NOT EXISTS "idx_reminders_upcoming"
  ON "reminders" ("user_id", "remind_at")
  WHERE "status" = 'scheduled';

-- ============================================================
-- 11) health_logs  –  Tüm sağlık verileri tek tabloda
-- ============================================================
CREATE TABLE IF NOT EXISTS "health_logs" (
  "id"        uuid            PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"   uuid            NOT NULL,
  "log_type"  health_log_type NOT NULL,
  "log_date"  date            NOT NULL DEFAULT CURRENT_DATE,
  "data"      jsonb           NOT NULL DEFAULT '{}',
  "logged_at" timestamptz     NOT NULL DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_health_logs_user_date"
  ON "health_logs" ("user_id", "log_date", "log_type");

COMMENT ON TABLE "health_logs" IS 'Su, spor, öğün ve günlük özet — hepsi tek tabloda, log_type ile ayrışır';

-- ============================================================
-- 12) contacts  –  Aile & yakın çevre kişileri
-- ============================================================
CREATE TABLE IF NOT EXISTS "contacts" (
  "id"              uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"         uuid        NOT NULL,
  "name"            text        NOT NULL,
  "relationship"    text,        -- eş, anne, baba, kardeş, çocuk, arkadaş
  "birth_date"      date,
  "phone"           text,
  "email"           text,
  "important_dates" jsonb,       -- ek önemli tarihler
  "notes"           text,
  "created_at"      timestamptz DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_contacts_user" ON "contacts" ("user_id");

-- ============================================================
-- 13) goals  –  Kişisel hedefler (milestones JSONB)
-- ============================================================
CREATE TABLE IF NOT EXISTS "goals" (
  "id"           uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"      uuid        NOT NULL,
  "title"        text        NOT NULL,
  "description"  text,
  "category"     text,         -- kariyer, eğitim, hobi, fitness, finans
  "target_date"  date,
  "progress_pct" int         DEFAULT 0 CHECK ("progress_pct" BETWEEN 0 AND 100),
  "is_completed" boolean     DEFAULT false,
  "milestones"   jsonb       DEFAULT '[]',
  "created_at"   timestamptz DEFAULT (now()),
  "updated_at"   timestamptz DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_goals_user" ON "goals" ("user_id", "is_completed");

-- ============================================================
-- 14) shopping_lists  –  Alışveriş listeleri
-- ============================================================
CREATE TABLE IF NOT EXISTS "shopping_lists" (
  "id"          uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"     uuid        NOT NULL,
  "name"        text        NOT NULL DEFAULT 'Alışveriş Listem',
  "is_archived" boolean     DEFAULT false,
  "created_at"  timestamptz DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_shopping_lists_user_archived" ON "shopping_lists" ("user_id", "is_archived");

-- ============================================================
-- 15) shopping_items  –  Liste öğeleri
-- ============================================================
CREATE TABLE IF NOT EXISTS "shopping_items" (
  "id"                    uuid    PRIMARY KEY DEFAULT (gen_random_uuid()),
  "list_id"               uuid    NOT NULL,
  "name"                  text    NOT NULL,
  "quantity"              int     DEFAULT 1,
  "unit"                  text,             -- adet, kg, lt, paket
  "estimated_price_minor" bigint,           -- 25.90 TL → 2590
  "is_checked"            boolean DEFAULT false,
  "note"                  text
);

CREATE INDEX IF NOT EXISTS "idx_shopping_items_list" ON "shopping_items" ("list_id", "is_checked");

-- ============================================================
-- 16) game_scores  –  Zeka oyunları skor tablosu
-- ============================================================
CREATE TABLE IF NOT EXISTS "game_scores" (
  "id"           uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"      uuid        NOT NULL,
  "game_key"     text        NOT NULL,   -- sudoku, quiz, memory, wordle
  "score"        int         NOT NULL,
  "difficulty"   text,                   -- easy, medium, hard
  "duration_sec" int,
  "metadata"     jsonb,
  "played_at"    timestamptz DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_game_scores_leaderboard" ON "game_scores" ("game_key", "score" DESC);
CREATE INDEX IF NOT EXISTS "idx_game_scores_user"        ON "game_scores" ("user_id", "played_at" DESC);

-- ============================================================
-- 17) blog_posts  –  Blog yazıları (yorum & beğeni JSONB)
-- ============================================================
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id"            uuid        PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id"       uuid        NOT NULL,
  "title"         text        NOT NULL,
  "raw_content"   text        NOT NULL,
  "clean_content" text,                    -- AI temizlenmiş versiyon
  "visibility"    visibility  DEFAULT 'private',
  "status"        text        DEFAULT 'draft',  -- draft, published, archived
  "tags"          text[],
  "like_count"    int         DEFAULT 0,
  "comments"      jsonb       DEFAULT '[]',
  "created_at"    timestamptz DEFAULT (now()),
  "updated_at"    timestamptz DEFAULT (now())
);

CREATE INDEX IF NOT EXISTS "idx_blog_posts_user"   ON "blog_posts" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_blog_posts_status" ON "blog_posts" ("status", "visibility");

-- ============================================================
-- 18) ai_interactions  –  AI kullanım günlüğü
-- ============================================================
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

CREATE INDEX IF NOT EXISTS "idx_ai_interactions_user" ON "ai_interactions" ("user_id", "created_at" DESC);

-- ============================================================
--                FOREIGN KEY İLİŞKİLERİ
-- ============================================================

-- Auth & Profil
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT IF NOT EXISTS "fk_refresh_tokens_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_profiles"
  ADD CONSTRAINT IF NOT EXISTS "fk_user_profiles_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Sosyal
ALTER TABLE "follows"
  ADD CONSTRAINT IF NOT EXISTS "fk_follows_follower"
  FOREIGN KEY ("follower_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "follows"
  ADD CONSTRAINT IF NOT EXISTS "fk_follows_following"
  FOREIGN KEY ("following_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Finans
ALTER TABLE "finance_accounts"
  ADD CONSTRAINT IF NOT EXISTS "fk_finance_accounts_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "finance_categories"
  ADD CONSTRAINT IF NOT EXISTS "fk_finance_categories_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "finance_transactions"
  ADD CONSTRAINT IF NOT EXISTS "fk_finance_transactions_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "finance_transactions"
  ADD CONSTRAINT IF NOT EXISTS "fk_finance_transactions_account"
  FOREIGN KEY ("account_id") REFERENCES "finance_accounts" ("id") ON DELETE RESTRICT;

ALTER TABLE "finance_transactions"
  ADD CONSTRAINT IF NOT EXISTS "fk_finance_transactions_category"
  FOREIGN KEY ("category_id") REFERENCES "finance_categories" ("id") ON DELETE SET NULL;

ALTER TABLE "investments"
  ADD CONSTRAINT IF NOT EXISTS "fk_investments_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- İş & Hatırlatıcı
ALTER TABLE "work_events"
  ADD CONSTRAINT IF NOT EXISTS "fk_work_events_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT IF NOT EXISTS "fk_reminders_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT IF NOT EXISTS "fk_reminders_work_event"
  FOREIGN KEY ("work_event_id") REFERENCES "work_events" ("id") ON DELETE SET NULL;

ALTER TABLE "reminders"
  ADD CONSTRAINT IF NOT EXISTS "fk_reminders_contact"
  FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") ON DELETE SET NULL;

-- Sağlık
ALTER TABLE "health_logs"
  ADD CONSTRAINT IF NOT EXISTS "fk_health_logs_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Kişiler
ALTER TABLE "contacts"
  ADD CONSTRAINT IF NOT EXISTS "fk_contacts_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Hedefler
ALTER TABLE "goals"
  ADD CONSTRAINT IF NOT EXISTS "fk_goals_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Alışveriş
ALTER TABLE "shopping_lists"
  ADD CONSTRAINT IF NOT EXISTS "fk_shopping_lists_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "shopping_items"
  ADD CONSTRAINT IF NOT EXISTS "fk_shopping_items_list"
  FOREIGN KEY ("list_id") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE;

-- Oyunlar
ALTER TABLE "game_scores"
  ADD CONSTRAINT IF NOT EXISTS "fk_game_scores_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- Blog
ALTER TABLE "blog_posts"
  ADD CONSTRAINT IF NOT EXISTS "fk_blog_posts_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- AI
ALTER TABLE "ai_interactions"
  ADD CONSTRAINT IF NOT EXISTS "fk_ai_interactions_user"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- ============================================================
-- ŞEMA SONU — 18 TABLO
-- ============================================================