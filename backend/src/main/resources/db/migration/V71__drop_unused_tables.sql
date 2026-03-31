-- V71: Drop unused legacy tables (Finance and AI Interactions)
DROP TABLE IF EXISTS "finance_transactions" CASCADE;
DROP TABLE IF EXISTS "finance_categories" CASCADE;
DROP TABLE IF EXISTS "finance_accounts" CASCADE;
DROP TABLE IF EXISTS "ai_interactions" CASCADE;
