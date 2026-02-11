-- Add tables used by finance module entities.
-- These tables are referenced by CurrencyRate and InvestmentRecommendation.

CREATE TABLE IF NOT EXISTS "currency_rates" (
    "id"            uuid           PRIMARY KEY DEFAULT (gen_random_uuid()),
    "currency_code" currency_code  NOT NULL,
    "rate"          numeric(19,4)  NOT NULL,
    "change_rate"   numeric(10,4),
    "rate_date"     timestamp      NOT NULL,
    "source"        varchar(50),
    "created_at"    timestamp
);

CREATE INDEX IF NOT EXISTS "idx_currency_rates_code_date"
    ON "currency_rates" ("currency_code", "rate_date" DESC);

CREATE TABLE IF NOT EXISTS "investment_recommendations" (
    "id"                  uuid           PRIMARY KEY DEFAULT (gen_random_uuid()),
    "created_at"          timestamptz    NOT NULL DEFAULT (now()),
    "updated_at"          timestamptz    NOT NULL DEFAULT (now()),
    "recommendation_type" varchar(50)    NOT NULL,
    "asset_type"          varchar(50),
    "symbol"              varchar(20),
    "confidence_score"    numeric(5,2),
    "reason"              text,
    "risk_level"          varchar(20),
    "target_price"        numeric(19,4),
    "valid_until"         timestamp
);

CREATE INDEX IF NOT EXISTS "idx_investment_reco_valid_until"
    ON "investment_recommendations" ("valid_until");

CREATE INDEX IF NOT EXISTS "idx_investment_reco_confidence"
    ON "investment_recommendations" ("confidence_score" DESC);
