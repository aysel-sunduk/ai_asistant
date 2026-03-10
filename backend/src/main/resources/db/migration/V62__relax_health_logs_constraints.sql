-- Java code already strictly validates log_type and source, 
-- and we are expanding these lists frequently (e.g., adding 'food_scan' and 'ai_food_scan').
-- Dropping the database-level check constraints so they don't block new features.

ALTER TABLE public.health_logs DROP CONSTRAINT IF EXISTS chk_health_logs_log_type_allowed;
ALTER TABLE public.health_logs DROP CONSTRAINT IF EXISTS chk_health_logs_source_allowed;
